import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { plans } from '../content.ts'
import type {
  Account,
  ActionResult,
  BillingAddress,
  Cycle,
  DB,
  Guardrails,
  ModelMode,
  Note,
  PaymentMethod,
  PlanId,
  Seat,
  WorkspaceRecord,
} from '../types.ts'
import { isStudentEmail, packById, planById, quote, validStudentId, viewSub } from './billing.ts'
import { clamp, slugify, uid } from './format.ts'

const KEY = 'zeroops.demo.v1'

export function emptyRecord(): WorkspaceRecord {
  return {
    payment: null,
    billing: null,
    subscription: null,
    invoices: [],
    activity: [],
    allowance: { extraIncidents: 0, extraTokens: 0 },
    usage: { incidents: 0, tokens: 0 },
    credit: 0,
    guardrails: { diffLimit: 50, retryCap: 3, killIdleSeconds: 30, alertThreshold: 90 },
    modelMode: 'live',
    seats: [],
    runSeq: 2040,
    studentId: null,
  }
}

function emptyDb(): DB {
  return { accounts: [], sessionEmail: null, records: {}, inbox: [] }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyDb()
    const parsed = JSON.parse(raw) as Partial<DB>
    if (!parsed.accounts || !parsed.records) return emptyDb()
    return {
      accounts: parsed.accounts,
      sessionEmail: parsed.sessionEmail ?? null,
      records: parsed.records,
      inbox: parsed.inbox ?? [],
    }
  } catch {
    return emptyDb()
  }
}

function nextInvoiceNumber(db: DB) {
  const count = Object.values(db.records).reduce((sum, record) => sum + record.invoices.length, 0)
  return `ZO-2026-${String(1042 + count).padStart(5, '0')}`
}

function clampRecord(record: WorkspaceRecord, planId: PlanId) {
  const plan = planById(planId)
  const bounds = plan.bounds
  record.guardrails = {
    diffLimit: clamp(record.guardrails.diffLimit, bounds.diff[0], bounds.diff[1]),
    retryCap: clamp(record.guardrails.retryCap, bounds.retry[0], bounds.retry[1]),
    killIdleSeconds: clamp(record.guardrails.killIdleSeconds, bounds.kill[0], bounds.kill[1]),
    alertThreshold: clamp(record.guardrails.alertThreshold, bounds.threshold[0], bounds.threshold[1]),
  }
  const extra = Math.max(0, plan.seats - 1)
  record.seats = record.seats.slice(0, extra)
}

interface Store {
  db: DB
  account: Account | null
  record: WorkspaceRecord | null
  signup: (input: { name: string; email: string; password: string; org: string }) => ActionResult
  login: (email: string, password: string) => ActionResult
  logout: () => void
  resetPassword: (email: string, password: string) => ActionResult
  purchase: (input: {
    planId: PlanId
    cycle: Cycle
    country: string
    billing: BillingAddress | null
    payment: PaymentMethod | null
    studentId?: string
  }) => ActionResult
  clearPending: () => ActionResult
  cancelSub: (reason: string) => ActionResult
  resumeSub: () => ActionResult
  endPeriod: () => ActionResult
  buyPack: (packId: string) => ActionResult
  updatePayment: (payment: PaymentMethod) => ActionResult
  updateBilling: (billing: BillingAddress) => ActionResult
  setModelMode: (mode: ModelMode) => ActionResult
  setGuardrails: (next: Guardrails) => ActionResult
  addSeat: (name: string, role: Seat['role']) => ActionResult
  removeSeat: (id: string) => void
  recordLive: () => ActionResult
  recordReplay: () => ActionResult
  addNote: (note: Omit<Note, 'id' | 'at'>) => Note
  erase: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load())

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(db))
  }, [db])

  const value = useMemo<Store>(() => {
    const account = db.accounts.find((item) => item.email === db.sessionEmail) ?? null
    const raw = account ? db.records[account.email] ?? null : null
    const record = raw
      ? { ...raw, subscription: viewSub(raw.subscription) }
      : null

    const requireSession = (): { account: Account; raw: WorkspaceRecord } | ActionResult => {
      if (!account || !raw) return { ok: false, message: 'Sign in first.' }
      return { account, raw }
    }

    return {
      db,
      account,
      record,
      signup: (input) => {
        const email = input.email.trim().toLowerCase()
        if (db.accounts.some((item) => item.email === email)) {
          return { ok: false, message: 'A workspace already uses that email. Sign in instead.' }
        }
        const next = structuredClone(db)
        const created: Account = {
          id: uid(),
          name: input.name.trim(),
          email,
          password: input.password,
          org: input.org.trim(),
          workspace: slugify(input.org),
          createdAt: new Date().toISOString(),
        }
        next.accounts.push(created)
        next.records[email] = emptyRecord()
        next.sessionEmail = email
        setDb(next)
        return { ok: true }
      },
      login: (email, password) => {
        const found = db.accounts.find((item) => item.email === email.trim().toLowerCase())
        if (!found) return { ok: false, message: 'No workspace uses that email.' }
        if (found.password !== password) return { ok: false, message: 'That password does not match.' }
        setDb({ ...db, sessionEmail: found.email })
        return { ok: true }
      },
      logout: () => setDb({ ...db, sessionEmail: null }),
      resetPassword: (email, password) => {
        const current = structuredClone(db)
        const found = current.accounts.find((item) => item.email === email.trim().toLowerCase())
        if (!found) return { ok: false, message: 'No workspace uses that email on this browser.' }
        if (password.length < 8) return { ok: false, message: 'Use at least 8 characters.' }
        found.password = password
        setDb(current)
        return { ok: true }
      },
      purchase: (input) => {
        const session = requireSession()
        if ('ok' in session) return session
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        const country = input.billing?.country ?? rec.billing?.country ?? input.country
        const priced = quote({ record: rec, planId: input.planId, cycle: input.cycle, country })
        if (priced.kind === 'same' || priced.kind === 'scheduled') {
          return { ok: false, message: priced.detail }
        }
        if (input.planId === 'student') {
          if (!isStudentEmail(session.account.email)) {
            return { ok: false, message: 'Student needs a university email (.edu, .ac.in, .edu.in, .ac.uk). Professional is the plan for any other address.' }
          }
          if (!validStudentId(input.studentId ?? '')) {
            return { ok: false, message: 'Enter a student ID of 4 to 20 letters or digits.' }
          }
          rec.studentId = (input.studentId ?? '').trim()
        }
        if (priced.total > 0 && !input.payment && !rec.payment) {
          return { ok: false, message: 'Add a payment method to pay this invoice.' }
        }
        if (input.payment) rec.payment = input.payment
        if (input.billing) rec.billing = input.billing
        const paidWith = rec.payment?.label ?? 'No payment method'
        const now = new Date()
        if (priced.kind === 'downgrade' && rec.subscription) {
          rec.subscription.pending = { planId: input.planId, cycle: input.cycle }
          rec.subscription.cancelAtPeriodEnd = false
        } else {
          const previous = rec.subscription
          const startedAt = previous?.startedAt ?? now.toISOString()
          rec.subscription = {
            planId: input.planId,
            cycle: input.cycle,
            status: 'active',
            startedAt,
            periodStart: priced.periodStart,
            periodEnd: priced.periodEnd,
            cancelAtPeriodEnd: input.planId === 'student',
            pending: null,
          }
          clampRecord(rec, input.planId)
        }
        rec.credit = priced.creditRemaining
        const invoiceId = uid()
        rec.invoices.unshift({
          id: invoiceId,
          number: nextInvoiceNumber(current),
          createdAt: now.toISOString(),
          description: priced.description,
          lines: priced.lines,
          taxable: priced.subtotal,
          tax: priced.tax,
          taxLabel: priced.taxLabel,
          total: priced.total,
          status: priced.kind === 'downgrade' ? 'scheduled' : 'paid',
          kind: priced.kind === 'renewal' ? 'renewal' : priced.kind === 'upgrade' ? 'upgrade' : priced.kind === 'downgrade' ? 'downgrade' : 'new',
          paidWith: priced.total > 0 ? paidWith : 'No charge',
        })
        rec.activity.unshift({
          id: uid(),
          at: now.toISOString(),
          label: priced.description,
          detail: priced.detail,
          incidents: 0,
          tokens: 0,
        })
        setDb(current)
        return { ok: true, invoiceId }
      },
      clearPending: () => {
        const session = requireSession()
        if ('ok' in session) return session
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        if (!rec.subscription?.pending) return { ok: false, message: 'Nothing is scheduled.' }
        rec.subscription.pending = null
        setDb(current)
        return { ok: true }
      },
      cancelSub: (reason) => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status !== 'active') {
          return { ok: false, message: 'There is no active period to cancel.' }
        }
        if (viewed.cancelAtPeriodEnd) return { ok: false, message: 'This workspace is already set to end.' }
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        if (!rec.subscription) return { ok: false, message: 'There is no active period to cancel.' }
        rec.subscription.cancelAtPeriodEnd = true
        rec.subscription.cancelReason = reason
        rec.subscription.pending = null
        rec.activity.unshift({
          id: uid(),
          at: new Date().toISOString(),
          label: 'Cancellation scheduled',
          detail: reason || 'No reason given.',
          incidents: 0,
          tokens: 0,
        })
        setDb(current)
        return { ok: true }
      },
      resumeSub: () => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed) return { ok: false, message: 'No subscription to resume.' }
        if (viewed.status === 'canceled') {
          return { ok: false, message: 'This period has already ended. Choose a plan to start again.' }
        }
        if (viewed.planId === 'student') {
          return { ok: false, message: 'The student month does not renew. Move to Professional when it ends.' }
        }
        if (!viewed.cancelAtPeriodEnd) return { ok: false, message: 'This plan is not set to cancel.' }
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        if (!rec.subscription) return { ok: false, message: 'No subscription to resume.' }
        rec.subscription.cancelAtPeriodEnd = false
        rec.subscription.cancelReason = undefined
        setDb(current)
        return { ok: true }
      },
      endPeriod: () => {
        const session = requireSession()
        if ('ok' in session) return session
        if (!raw?.subscription) return { ok: false, message: 'No period to end.' }
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        if (!rec.subscription) return { ok: false, message: 'No period to end.' }
        rec.subscription.periodEnd = new Date().toISOString()
        setDb(current)
        return { ok: true }
      },
      buyPack: (packId) => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status === 'canceled') {
          return { ok: false, message: 'Start a plan before buying a pack.' }
        }
        if (viewed.status === 'past_due') {
          return { ok: false, message: 'Pay the renewal first. Packs are added to a current period.' }
        }
        const pack = packById(packId)
        if (!pack) return { ok: false, message: 'That pack does not exist.' }
        if (!raw?.payment) return { ok: false, message: 'Add a payment method first.' }
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        const country = rec.billing?.country ?? 'India'
        const applied = Math.min(rec.credit, pack.price)
        const taxable = pack.price - applied
        const tax = Math.round(taxable * (country === 'India' ? 0.18 : 0))
        rec.credit -= applied
        if (pack.kind === 'tokens') rec.allowance.extraTokens += pack.amount
        else rec.allowance.extraIncidents += pack.amount
        const invoiceId = uid()
        const lines = [{ label: pack.name, amount: pack.price }]
        if (applied) lines.push({ label: 'Credit applied', amount: -applied })
        rec.invoices.unshift({
          id: invoiceId,
          number: nextInvoiceNumber(current),
          createdAt: new Date().toISOString(),
          description: pack.name,
          lines,
          taxable,
          tax,
          taxLabel: country === 'India' ? 'GST 18%' : 'Tax 0%',
          total: taxable + tax,
          status: 'paid',
          kind: 'addon',
          paidWith: rec.payment?.label ?? 'Payment method',
        })
        rec.activity.unshift({
          id: uid(),
          at: new Date().toISOString(),
          label: `Pack · ${pack.name}`,
          detail: 'Added to this period’s allowance.',
          incidents: 0,
          tokens: 0,
        })
        setDb(current)
        return { ok: true, invoiceId }
      },
      updatePayment: (payment) => {
        const session = requireSession()
        if ('ok' in session) return session
        const current = structuredClone(db)
        current.records[session.account.email].payment = payment
        setDb(current)
        return { ok: true }
      },
      updateBilling: (billing) => {
        const session = requireSession()
        if ('ok' in session) return session
        const current = structuredClone(db)
        current.records[session.account.email].billing = billing
        setDb(current)
        return { ok: true }
      },
      setModelMode: (mode) => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status === 'canceled') {
          return { ok: false, message: 'Model mode is part of a workspace. Choose a plan first.' }
        }
        const current = structuredClone(db)
        current.records[session.account.email].modelMode = mode
        setDb(current)
        return { ok: true }
      },
      setGuardrails: (next) => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status === 'canceled') {
          return { ok: false, message: 'Guardrail limits ship with a plan.' }
        }
        const bounds = planById(viewed.planId).bounds
        const current = structuredClone(db)
        current.records[session.account.email].guardrails = {
          diffLimit: clamp(next.diffLimit, bounds.diff[0], bounds.diff[1]),
          retryCap: clamp(next.retryCap, bounds.retry[0], bounds.retry[1]),
          killIdleSeconds: clamp(next.killIdleSeconds, bounds.kill[0], bounds.kill[1]),
          alertThreshold: clamp(next.alertThreshold, bounds.threshold[0], bounds.threshold[1]),
        }
        setDb(current)
        return { ok: true }
      },
      addSeat: (name, role) => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status === 'canceled') {
          return { ok: false, message: 'Seats are part of a plan.' }
        }
        const plan = planById(viewed.planId)
        const used = (raw?.seats.length ?? 0) + 1
        if (used >= plan.seats) {
          return { ok: false, message: `${plan.name} includes ${plan.seats} ${plan.seats === 1 ? 'seat' : 'seats'}, and yours is already filled.` }
        }
        if (name.trim().length < 2) return { ok: false, message: 'Name the seat.' }
        const current = structuredClone(db)
        current.records[session.account.email].seats.push({ id: uid(), name: name.trim(), role })
        setDb(current)
        return { ok: true }
      },
      removeSeat: (id) => {
        if (!account) return
        const current = structuredClone(db)
        const rec = current.records[account.email]
        if (!rec) return
        rec.seats = rec.seats.filter((seat) => seat.id !== id)
        setDb(current)
      },
      recordLive: () => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status === 'canceled') {
          return { ok: false, message: 'Live patching needs a plan.' }
        }
        if (viewed.status === 'past_due') {
          return { ok: false, message: 'Live patching is paused until the renewal is paid.' }
        }
        if (raw?.modelMode !== 'live') {
          return { ok: false, message: 'This workspace is not in live mode.' }
        }
        const plan = planById(viewed.planId)
        const incidentsCap = plan.incidents + (raw?.allowance.extraIncidents ?? 0)
        const tokensCap = plan.tokens + (raw?.allowance.extraTokens ?? 0)
        if ((raw?.usage.incidents ?? 0) + 1 > incidentsCap) {
          return { ok: false, message: 'The incident allowance is used up.' }
        }
        if ((raw?.usage.tokens ?? 0) + 812 > tokensCap) {
          return { ok: false, message: 'The token allowance is used up. A live attempt on the reference incident costs 812 tokens.' }
        }
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        rec.usage.incidents += 1
        rec.usage.tokens += 812
        rec.runSeq += 1
        rec.activity.unshift({
          id: uid(),
          at: new Date().toISOString(),
          label: `INC-${rec.runSeq} · live attempt`,
          detail: 'Connection pool exhausted · analytics/views.py · 812 tokens · patch written against Gemini 1.5 Flash.',
          incidents: 1,
          tokens: 812,
        })
        setDb(current)
        return { ok: true }
      },
      recordReplay: () => {
        const session = requireSession()
        if ('ok' in session) return session
        const viewed = viewSub(raw?.subscription ?? null)
        if (!viewed || viewed.status === 'canceled') {
          return { ok: false, message: 'Replay is kept on a workspace. Choose a plan first.' }
        }
        const current = structuredClone(db)
        const rec = current.records[session.account.email]
        rec.activity.unshift({
          id: uid(),
          at: new Date().toISOString(),
          label: 'Replay · INC-0042',
          detail: 'Cached run of the connection-pool incident. 0 tokens. The draft pull request is the one already on record.',
          incidents: 0,
          tokens: 0,
        })
        setDb(current)
        return { ok: true }
      },
      addNote: (note) => {
        const saved: Note = { ...note, id: uid(), at: new Date().toISOString() }
        const current = structuredClone(db)
        current.inbox.unshift(saved)
        setDb(current)
        return saved
      },
      erase: () => {
        localStorage.removeItem(KEY)
        setDb(emptyDb())
      },
    }
  }, [db])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const value = useContext(Ctx)
  if (!value) throw new Error('Store missing')
  return value
}

export function planName(id: PlanId) {
  return plans.find((plan) => plan.id === id)?.name ?? id
}
