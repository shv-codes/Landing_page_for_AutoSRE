import { packs, plans, type Plan } from '../content.ts'
import { formatDate } from './format.ts'
import type { BillingAddress, Cycle, InvoiceLine, PlanId, Subscription, WorkspaceRecord } from '../types.ts'

export interface Quote {
  kind: 'new' | 'renewal' | 'upgrade' | 'downgrade' | 'same' | 'scheduled'
  subtotal: number
  tax: number
  total: number
  creditRemaining: number
  description: string
  detail: string
  lines: InvoiceLine[]
  taxLabel: string
  periodStart: string
  periodEnd: string
  immediate: boolean
}

export function planById(id: PlanId): Plan {
  const plan = plans.find((item) => item.id === id)
  if (!plan) throw new Error(`Unknown plan ${id}`)
  return plan
}

export function priceOf(plan: Plan, cycle: Cycle) {
  return cycle === 'monthly' ? plan.monthly : plan.annual
}

export function rank(planId: PlanId, cycle: Cycle) {
  const tier = planId === 'student' ? 0 : planId === 'professional' ? 1 : 2
  return tier * 10 + (cycle === 'annual' ? 1 : 0)
}

export function taxRate(country: string) {
  return country === 'India' ? 0.18 : 0
}

export function isStudentEmail(email: string) {
  return /@(?:[\w-]+\.)*[\w-]+\.(?:edu|edu\.[a-z]{2}|ac\.[a-z]{2}|edu\.in)$/i.test(email.trim())
}

export function validStudentId(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9-]{3,19}$/.test(value.trim())
}

export function validGstin(value: string) {
  if (!value.trim()) return true
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase())
}

export function validateAddress(address: BillingAddress) {
  if (address.line1.trim().length < 3) return 'Enter the street address.'
  if (address.city.trim().length < 2) return 'Enter the city.'
  if (!address.country) return 'Choose a country.'
  if (address.country === 'India' && address.region.trim().length < 2) return 'Enter the state.'
  if (address.country === 'India' && !/^\d{6}$/.test(address.postal.trim())) return 'Enter a 6-digit PIN code.'
  if (address.country !== 'India' && address.postal.trim().length < 3) return 'Enter the postal code.'
  if (!validGstin(address.gstin)) return 'GSTIN should be 15 characters, for example 22AAAAA0000A1Z5.'
  return null
}

export function addCycle(from: Date, cycle: Cycle) {
  const next = new Date(from.getTime())
  if (cycle === 'monthly') next.setMonth(next.getMonth() + 1)
  else next.setFullYear(next.getFullYear() + 1)
  return next
}

export function viewSub(sub: Subscription | null, now = new Date()): Subscription | null {
  if (!sub) return null
  if (new Date(sub.periodEnd).getTime() > now.getTime()) {
    return { ...sub, status: 'active' }
  }
  if (sub.cancelAtPeriodEnd) return { ...sub, status: 'canceled' }
  return { ...sub, status: 'past_due' }
}

function remainingFraction(sub: Subscription, now: Date) {
  const start = new Date(sub.periodStart).getTime()
  const end = new Date(sub.periodEnd).getTime()
  const total = Math.max(1, end - start)
  const left = Math.min(total, Math.max(0, end - now.getTime()))
  return left / total
}

function settle(chargeLabel: string, chargeBase: number, unused: number, credit: number) {
  const unusedApplied = Math.min(Math.max(0, unused), Math.max(0, chargeBase))
  const leftoverUnused = Math.max(0, unused) - unusedApplied
  const afterUnused = Math.max(0, chargeBase) - unusedApplied
  const fromBalance = Math.min(Math.max(0, credit), afterUnused)
  const lines: InvoiceLine[] = [{ label: chargeLabel, amount: Math.max(0, chargeBase) }]
  if (unusedApplied) lines.push({ label: 'Unused time on the current plan', amount: -unusedApplied })
  if (fromBalance) lines.push({ label: 'Credit applied', amount: -fromBalance })
  return {
    lines,
    creditRemaining: Math.max(0, credit) - fromBalance + leftoverUnused,
  }
}

function finalize(
  lines: InvoiceLine[],
  creditRemaining: number,
  country: string,
  meta: Omit<Quote, 'subtotal' | 'tax' | 'total' | 'creditRemaining' | 'lines' | 'taxLabel'>,
): Quote {
  const net = lines.reduce((sum, line) => sum + line.amount, 0)
  const subtotal = Math.max(0, net)
  const rate = taxRate(country)
  const tax = Math.round(subtotal * rate)
  return {
    ...meta,
    lines,
    subtotal,
    tax,
    total: subtotal + tax,
    creditRemaining,
    taxLabel: rate ? 'GST 18%' : 'Tax 0%',
  }
}

function cycleLabel(cycle: Cycle) {
  return cycle === 'monthly' ? 'monthly' : 'annual'
}

export function quote(options: {
  record: WorkspaceRecord | null
  planId: PlanId
  cycle: Cycle
  country: string
  now?: Date
}): Quote {
  const now = options.now ?? new Date()
  const plan = planById(options.planId)
  const requestedCycle = options.cycle
  const cycle: Cycle = options.planId === 'student' ? 'monthly' : requestedCycle
  const full = priceOf(plan, cycle)
  const credit = options.record?.credit ?? 0
  const raw = options.record?.subscription ?? null
  const viewed = viewSub(raw, now)
  const start = now.toISOString()
  const end = addCycle(now, cycle).toISOString()

  const fresh = (kind: Quote['kind'], description: string, detail: string) => {
    const settled = settle(`${plan.name} · ${cycleLabel(cycle)}`, full, 0, credit)
    return finalize(settled.lines, settled.creditRemaining, options.country, {
      kind,
      description,
      detail,
      periodStart: start,
      periodEnd: end,
      immediate: true,
    })
  }

  if (!viewed || viewed.status === 'canceled') {
    if (plan.id === 'student') {
      return fresh(
        'new',
        'Student starts today',
        `1 month free with a student ID. Access ends ${formatDate(end)} and does not renew.`,
      )
    }
    return fresh('new', `${plan.name} starts today`, `Billed ${cycleLabel(cycle)}. The next renewal is ${formatDate(end)}.`)
  }

  if (viewed.status === 'past_due') {
    const dueId = viewed.pending?.planId ?? viewed.planId
    const dueCycle = viewed.pending?.cycle ?? viewed.cycle
    const kind = dueId === options.planId && dueCycle === cycle ? 'renewal' : 'new'
    return fresh(
      kind,
      kind === 'renewal' ? `${plan.name} renewal` : `${plan.name} starts today`,
      'The previous period has ended. Live patching stays paused until this is paid.',
    )
  }

  if (viewed.planId === options.planId && viewed.cycle === cycle) {
    return finalize([{ label: `${plan.name} · already active`, amount: 0 }], credit, options.country, {
      kind: 'same',
      description: `You are on ${plan.name}`,
      detail: viewed.pending
        ? `A move to ${planById(viewed.pending.planId).name} is scheduled for ${formatDate(viewed.periodEnd)}.`
        : plan.id === 'student'
          ? `Access ends ${formatDate(viewed.periodEnd)}. The free month does not renew.`
          : `Renews ${formatDate(viewed.periodEnd)}.`,
      periodStart: viewed.periodStart,
      periodEnd: viewed.periodEnd,
      immediate: false,
    })
  }

  const higher = rank(options.planId, cycle) > rank(viewed.planId, viewed.cycle)
  if (!higher) {
    if (viewed.pending?.planId === options.planId && viewed.pending.cycle === cycle) {
      return finalize([{ label: 'Already scheduled', amount: 0 }], credit, options.country, {
        kind: 'scheduled',
        description: `Already moving to ${plan.name}`,
        detail: `Takes effect ${formatDate(viewed.periodEnd)}. No charge today.`,
        periodStart: viewed.periodStart,
        periodEnd: viewed.periodEnd,
        immediate: false,
      })
    }
    return finalize(
      [{ label: `Scheduled · ${plan.name} ${cycleLabel(cycle)}`, amount: 0 }],
      credit,
      options.country,
      {
        kind: 'downgrade',
        description: `Move to ${plan.name} on ${formatDate(viewed.periodEnd)}`,
        detail: `You keep ${planById(viewed.planId).name} until then. No charge today.`,
        periodStart: viewed.periodStart,
        periodEnd: viewed.periodEnd,
        immediate: false,
      },
    )
  }

  const current = planById(viewed.planId)
  const fraction = remainingFraction(viewed, now)
  const unused = Math.round(priceOf(current, viewed.cycle) * fraction)
  const sameCycle = viewed.cycle === cycle
  const chargeBase = sameCycle ? Math.round(full * fraction) : full
  const chargeLabel = sameCycle
    ? `${plan.name} · rest of this period`
    : `${plan.name} · ${cycleLabel(cycle)}`
  const settled = settle(chargeLabel, chargeBase, unused, credit)
  return finalize(settled.lines, settled.creditRemaining, options.country, {
    kind: 'upgrade',
    description: `Switch to ${plan.name} today`,
    detail: sameCycle
      ? `You pay the difference through ${formatDate(viewed.periodEnd)}.`
      : `A new ${cycleLabel(cycle)} period starts today. Unused time becomes credit.`,
    periodStart: sameCycle ? viewed.periodStart : start,
    periodEnd: sameCycle ? viewed.periodEnd : end,
    immediate: true,
  })
}

export function renewalPreview(record: WorkspaceRecord, now = new Date()) {
  const sub = viewSub(record.subscription, now)
  if (!sub || sub.status === 'canceled') return null
  const target = sub.pending ?? { planId: sub.planId, cycle: sub.cycle }
  const plan = planById(target.planId)
  const list = priceOf(plan, target.cycle)
  const applied = Math.min(record.credit, list)
  const taxable = list - applied
  const country = record.billing?.country ?? 'India'
  const tax = Math.round(taxable * taxRate(country))
  return {
    plan,
    cycle: target.cycle,
    list,
    applied,
    taxable,
    tax,
    total: taxable + tax,
    when: sub.periodEnd,
    status: sub.status,
    canceling: sub.cancelAtPeriodEnd,
  }
}

export function packById(id: string) {
  return packs.find((pack) => pack.id === id) ?? null
}

export interface Fit {
  plan: Plan
  overage: number
  uncovered: string | null
  because: string | null
}

export function recommend(input: { services: number; seats: number; incidents: number; tokens: number }): Fit {
  const blocker = (plan: Plan) => {
    if (input.seats > plan.seats) return `${input.seats} seats is past the ${plan.seats} on ${plan.name}.`
    if (input.services > plan.services) return `${input.services} services is past the ${plan.services} on ${plan.name}.`
    if (input.incidents > plan.incidents) return `${input.incidents.toLocaleString('en-IN')} incidents is past the ${plan.incidents.toLocaleString('en-IN')} on ${plan.name}.`
    if (input.tokens > plan.tokens) return `That token volume is past ${plan.name}.`
    return null
  }

  let because: string | null = null
  for (const plan of plans) {
    const reason = blocker(plan)
    if (!reason) return { plan, overage: 0, uncovered: null, because }
    because = reason
  }

  const plan = plans[2]
  const extraInc = Math.max(0, input.incidents - plan.incidents)
  const extraUnits = Math.max(0, Math.ceil((input.tokens - plan.tokens) / 10_000))
  const overage = Math.round(extraInc * plan.overageIncident + extraUnits * plan.overagePer10k)
  const uncovered =
    input.services > plan.services || input.seats > plan.seats
      ? 'Above 25 seats or 50 services, that is Enterprise: self-hosted, your model key, SSO, and a coverage number in the contract.'
      : null
  return { plan, overage, uncovered, because }
}
