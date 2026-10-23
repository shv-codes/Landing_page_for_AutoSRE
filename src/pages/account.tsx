import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { banks, packs, plans } from '../content.ts'
import { planById, renewalPreview, validateAddress } from '../lib/billing.ts'
import { brandOf, formatExp, formatPan, readCard, validVpa } from '../lib/cards.ts'
import { formatDate, formatWhen } from '../lib/format.ts'
import { annualUsd, compact, inr, usd } from '../lib/money.ts'
import { useStore } from '../lib/store.tsx'
import type { BillingAddress, Guardrails, Seat } from '../types.ts'
import { Banner, Button, Container, Dialog, Meter, TextField, controlClass, cx, useTitle } from '../components/ui.tsx'

const nav = [
  ['Overview', '/account'],
  ['Usage', '/account/usage'],
  ['Plan', '/account/plan'],
  ['Controls', '/account/controls'],
  ['Payment', '/account/payment'],
  ['Invoices', '/account/invoices'],
]

export function AccountLayout() {
  const { account } = useStore()
  const location = useLocation()
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return (
    <Container className="grid gap-8 py-10 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="no-print">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Workspace</p>
        <p className="mt-1 truncate text-[14px]">{account.org}</p>
        <p className="truncate font-mono text-[12px] text-faint">{account.workspace}</p>
        <nav className="mt-6 flex gap-2 overflow-x-auto lg:grid lg:gap-1" aria-label="Workspace">
          {nav.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/account'}
              className={({ isActive }) =>
                cx('whitespace-nowrap rounded-lg px-3 py-2 text-[14px]', isActive ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </Container>
  )
}

function useWorkspace() {
  const store = useStore()
  if (!store.account || !store.record) throw new Error('workspace')
  return { ...store, account: store.account, record: store.record }
}

export function Overview() {
  useTitle('Workspace')
  const { account, record, endPeriod, erase } = useWorkspace()
  const sub = record.subscription
  const plan = sub && sub.status !== 'canceled' ? planById(sub.planId) : null
  const renewal = renewalPreview(record)
  const [confirmErase, setConfirmErase] = useState(false)
  const [notice, setNotice] = useState('')

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-serif text-4xl tracking-[-0.03em]">{account.org}</h1>
        <p className="mt-2 text-[14px] text-muted">{account.email}</p>
      </header>
      {!plan && (
        <Banner>
          No plan on this workspace. <Link className="underline underline-offset-4" to="/pricing">Choose one</Link> and the allowance, the sandbox, and live patching turn on.
        </Banner>
      )}
      {sub?.status === 'past_due' && renewal && (
        <Banner tone="warn">
          Renewal due. Live patching is paused. <Link className="underline underline-offset-4" to={`/checkout?plan=${renewal.plan.id}&cycle=${renewal.cycle}`}>Pay {inr(renewal.total)}</Link>
        </Banner>
      )}
      {sub?.status === 'active' && sub.cancelAtPeriodEnd && (
        <Banner tone="warn">This plan ends {formatDate(sub.periodEnd)}. Resume it from the plan page if that was a mistake.</Banner>
      )}
      {sub?.pending && sub.status === 'active' && (
        <Banner>Moving to {planById(sub.pending.planId).name} on {formatDate(sub.periodEnd)}.</Banner>
      )}
      {plan && sub && (
        <section className="grid gap-4 rounded-xl border border-line p-5 sm:grid-cols-3">
          <div>
            <p className="text-[12px] text-faint">Plan</p>
            <p className="mt-1 text-lg">{plan.name}</p>
            <p className="text-[13px] capitalize text-muted">{sub.status.replace('_', ' ')} · {sub.cycle}</p>
          </div>
          <div>
            <p className="text-[12px] text-faint">{sub.status === 'past_due' ? 'Ended' : 'Renews'}</p>
            <p className="mt-1 text-lg">{formatDate(sub.periodEnd)}</p>
          </div>
          <div>
            <p className="text-[12px] text-faint">Credit</p>
            <p className="mt-1 text-lg">{inr(record.credit)}</p>
          </div>
        </section>
      )}
      {plan && (
        <section className="grid gap-4 rounded-xl border border-line p-5">
          <Meter label="Incidents" used={record.usage.incidents} max={plan.incidents + record.allowance.extraIncidents} />
          <Meter label="Tokens" used={record.usage.tokens} max={plan.tokens + record.allowance.extraTokens} />
          <Link to="/account/usage" className="text-[13px] text-muted underline underline-offset-4">Open usage</Link>
        </section>
      )}
      {renewal && !renewal.canceling && (
        <p className="text-[14px] text-muted">
          Next invoice for {renewal.plan.name}: {inr(renewal.total)}
          {renewal.applied > 0 ? `, after ${inr(renewal.applied)} credit` : ''}.
        </p>
      )}
      <section>
        <h2 className="text-[14px] text-faint">Recent activity</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {record.activity.length === 0 && <li className="py-4 text-[14px] text-muted">Nothing has run yet. A live sample or a replay will show up here and on the usage meters.</li>}
          {record.activity.slice(0, 5).map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-[14px]">{item.label}</p>
              <p className="text-[13px] text-muted">{item.detail}</p>
              <p className="font-mono text-[11px] text-faint">{formatWhen(item.at)}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link to="/console" className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-[14px] text-bg">Open the console</Link>
        <Link to="/account/invoices" className="inline-flex h-10 items-center rounded-full border border-line px-4 text-[14px]">Invoices</Link>
      </div>
      <details className="rounded-xl border border-line p-4">
        <summary className="text-[14px]">Demo tools</summary>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Move the clock to the renewal date so you can pay a renewal, or watch a downgrade take effect, without waiting a month. Erase deletes the workspace from this browser.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              const result = endPeriod()
              setNotice(result.ok ? 'The period has ended. Check the banner above.' : result.message)
            }}
          >
            End this period
          </Button>
          <Button variant="danger" onClick={() => setConfirmErase(true)}>Erase this browser</Button>
        </div>
        {notice && <p className="mt-3 text-[13px] text-muted">{notice}</p>}
      </details>
      <Dialog open={confirmErase} title="Erase workspace" onClose={() => setConfirmErase(false)}>
        <h2 className="font-serif text-3xl">Erase everything on this browser?</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">The account, invoices, usage, and saved notes go with it. Nothing is sent anywhere, because nothing left this browser.</p>
        <div className="mt-5 flex gap-2">
          <Button variant="danger" onClick={erase}>Erase</Button>
          <Button variant="ghost" onClick={() => setConfirmErase(false)}>Keep it</Button>
        </div>
      </Dialog>
    </div>
  )
}

export function Usage() {
  useTitle('Usage')
  const { record, recordLive, recordReplay, buyPack, setModelMode } = useWorkspace()
  const navigate = useNavigate()
  const sub = record.subscription
  const plan = sub && sub.status !== 'canceled' ? planById(sub.planId) : null
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'bad' | 'good' | 'warn'>('good')
  const [packId, setPackId] = useState<string | null>(null)

  const report = (result: { ok: true; invoiceId?: string } | { ok: false; message: string }, success: string) => {
    if (!result.ok) {
      setTone('bad')
      setMessage(result.message)
      return
    }
    setTone('good')
    setMessage(success)
    if (result.invoiceId) navigate(`/account/invoices/${result.invoiceId}`)
  }

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="font-serif text-4xl tracking-[-0.03em]">Usage</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          A live attempt on the reference incident costs 1 incident and 812 tokens. Replay costs nothing. Cached mode does not call the model.
        </p>
      </header>
      {!plan && <Banner>Choose a plan before usage means anything. <Link className="underline underline-offset-4" to="/pricing">Pricing</Link></Banner>}
      {plan && (
        <div className="grid gap-4 rounded-xl border border-line p-5">
          <Meter label="Live incidents" used={record.usage.incidents} max={plan.incidents + record.allowance.extraIncidents} />
          <Meter label="Model tokens" used={record.usage.tokens} max={plan.tokens + record.allowance.extraTokens} />
          <p className="text-[12.5px] text-faint">
            Included {plan.incidents.toLocaleString('en-IN')} incidents and {compact(plan.tokens)} tokens
            {record.allowance.extraIncidents + record.allowance.extraTokens > 0 ? ', plus packs' : ''}. Model mode is {record.modelMode}.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {(['live', 'cached', 'replay'] as const).map((mode) => (
          <button
            key={mode}
            className={`h-9 rounded-full px-3 text-[13px] capitalize ${record.modelMode === mode ? 'bg-ink text-bg' : 'border border-line text-muted'}`}
            onClick={() => {
              const result = setModelMode(mode)
              if (!result.ok) {
                setTone('bad')
                setMessage(result.message)
              }
            }}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => report(recordLive(), 'Logged a live attempt. 812 tokens.')}>Log a live attempt</Button>
        <Button variant="ghost" onClick={() => report(recordReplay(), 'Replay recorded. No tokens spent.')}>Play the cached replay</Button>
      </div>
      {message && <Banner tone={tone}>{message} {tone === 'bad' && <Link className="underline underline-offset-4" to="/account/plan"> See plans</Link>}</Banner>}
      <section>
        <h2 className="text-[16px]">Packs</h2>
        <p className="mt-1 text-[13px] text-muted">Charged to the payment method on file. Cheaper than overage. Not refunded once applied.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {packs.map((pack) => (
            <button key={pack.id} className="rounded-xl border border-line p-4 text-left hover:bg-white/[0.03]" onClick={() => setPackId(pack.id)}>
              <p>{pack.name}</p>
              <p className="mt-1 font-serif text-2xl">{inr(pack.price)}</p>
              <p className="text-[12px] text-faint">Plus GST if the billing address is in India.</p>
            </button>
          ))}
        </div>
      </section>
      <Dialog open={Boolean(packId)} title="Buy pack" onClose={() => setPackId(null)}>
        {packId && (
          <>
            <h2 className="font-serif text-3xl">Add {packs.find((pack) => pack.id === packId)?.name}</h2>
            <p className="mt-3 text-[14px] text-muted">
              {inr(packs.find((pack) => pack.id === packId)?.price ?? 0)} before tax, on {record.payment?.label ?? 'a payment method you still need to add'}.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                onClick={() => {
                  const result = buyPack(packId)
                  setPackId(null)
                  report(result, 'Pack added to this period.')
                }}
              >
                Confirm
              </Button>
              <Button variant="ghost" onClick={() => setPackId(null)}>Cancel</Button>
            </div>
          </>
        )}
      </Dialog>
      <section>
        <h2 className="text-[16px]">Activity</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {record.activity.length === 0 && <li className="py-4 text-[14px] text-muted">No attempts yet.</li>}
          {record.activity.map((item) => (
            <li key={item.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[14px]">{item.label}</p>
                <p className="text-[13px] text-muted">{item.detail}</p>
              </div>
              <p className="font-mono text-[12px] text-faint">{formatWhen(item.at)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function PlanPage() {
  useTitle('Plan')
  const { record, cancelSub, resumeSub, clearPending } = useWorkspace()
  const sub = record.subscription
  const [reason, setReason] = useState('We do not need live patching next month.')
  const [message, setMessage] = useState('')
  const renewal = renewalPreview(record)

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl tracking-[-0.03em]">Plan</h1>
      {renewal && (
        <p className="text-[14px] text-muted">
          {renewal.canceling
            ? `Access until ${formatDate(renewal.when)}, then it stops.`
            : `Next charge ${inr(renewal.total)} on ${formatDate(renewal.when)} for ${renewal.plan.name}.`}
        </p>
      )}
      <div className="grid gap-3">
        {plans.map((plan) => {
          const current = sub?.status === 'active' && sub.planId === plan.id
          return (
            <article key={plan.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line p-4">
              <div>
                <h2 className="text-[16px]">{plan.name} {current ? '· current' : ''}</h2>
                <p className="text-[13px] text-muted">{plan.usdMonthly === 0 ? '1 month free' : `${usd(plan.usdMonthly)} / month · ${usd(annualUsd(plan.usdMonthly))} / year`} · {compact(plan.tokens)} tokens · {plan.incidents.toLocaleString('en-IN')} incidents</p>
              </div>
              <div className="flex gap-2">
                {plan.usdMonthly === 0 ? (
                  <Link to={`/checkout?plan=${plan.id}&cycle=monthly`} className="inline-flex h-9 items-center rounded-full border border-line px-3 text-[13px]">Start the free month</Link>
                ) : (
                  <>
                    <Link to={`/checkout?plan=${plan.id}&cycle=monthly`} className="inline-flex h-9 items-center rounded-full border border-line px-3 text-[13px]">Monthly</Link>
                    <Link to={`/checkout?plan=${plan.id}&cycle=annual`} className="inline-flex h-9 items-center rounded-full border border-line px-3 text-[13px]">Annual</Link>
                  </>
                )}
              </div>
            </article>
          )
        })}
        <p className="text-[14px] text-muted">
          Self-hosted, your own model key, SSO, and audit export are <Link to="/demo?plan=enterprise" className="underline underline-offset-4">Enterprise</Link>. That one is a conversation, not a checkout.
        </p>
      </div>
      {sub?.pending && (
        <div>
          <Banner>A move to {planById(sub.pending.planId).name} ({sub.pending.cycle}) is scheduled.</Banner>
          <Button className="mt-3" variant="ghost" onClick={() => {
            const result = clearPending()
            setMessage(result.ok ? 'Staying on the current plan.' : result.message)
          }}>Stay on the current plan</Button>
        </div>
      )}
      {sub?.status === 'active' && !sub.cancelAtPeriodEnd && (
        <form
          className="grid max-w-lg gap-3 border-t border-line pt-6"
          onSubmit={(event) => {
            event.preventDefault()
            const result = cancelSub(reason)
            setMessage(result.ok ? `Cancellation set for ${formatDate(sub.periodEnd)}.` : result.message)
          }}
        >
          <h2 className="text-[16px]">Cancel at period end</h2>
          <label className="text-[13px] text-muted">
            Reason
            <select className={`${controlClass} mt-1.5`} value={reason} onChange={(event) => setReason(event.target.value)}>
              {[
                'We do not need live patching next month.',
                'The allowance is the wrong size.',
                'We are moving the service.',
                'Just looking at the cancellation path.',
              ].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <Button type="submit" variant="ghost">Schedule cancellation</Button>
        </form>
      )}
      {sub?.cancelAtPeriodEnd && sub.status === 'active' && (
        <Button
          onClick={() => {
            const result = resumeSub()
            setMessage(result.ok ? 'Cancellation removed. The plan will renew.' : result.message)
          }}
        >
          Resume the plan
        </Button>
      )}
      {sub?.status === 'past_due' && renewal && (
        <Link to={`/checkout?plan=${renewal.plan.id}&cycle=${renewal.cycle}`} className="inline-flex h-10 w-fit items-center rounded-full bg-ink px-4 text-[14px] text-bg">
          Pay renewal · {inr(renewal.total)}
        </Link>
      )}
      {sub?.status === 'canceled' && (
        <Banner>This period has ended. Pick a plan above to start again. Any credit balance still applies.</Banner>
      )}
      {message && <p className="text-[14px] text-muted">{message}</p>}
    </div>
  )
}

export function Controls() {
  useTitle('Controls')
  const { account, record, setGuardrails, addSeat, removeSeat } = useWorkspace()
  const sub = record.subscription
  const plan = sub && sub.status !== 'canceled' ? planById(sub.planId) : null
  const [guards, setGuards] = useState<Guardrails>(record.guardrails)
  const [seat, setSeat] = useState('')
  const [role, setRole] = useState<Seat['role']>('Reviewer')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setGuards(record.guardrails)
  }, [record.guardrails])

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="font-serif text-4xl tracking-[-0.03em]">Controls</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          These are the limits the agent reads. Locked rules, including the human merge gate, are not on this page. They change in guardrails/evaluator.py.
        </p>
      </header>
      {!plan && <Banner>Controls unlock with a plan.</Banner>}
      {plan && (
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            const result = setGuardrails(guards)
            setMessage(result.ok ? 'Saved on this workspace.' : result.message)
          }}
        >
          <Range label="Diff cap (lines)" value={guards.diffLimit} min={plan.bounds.diff[0]} max={plan.bounds.diff[1]} onChange={(value) => setGuards({ ...guards, diffLimit: value })} />
          <Range label="Retry cap" value={guards.retryCap} min={plan.bounds.retry[0]} max={plan.bounds.retry[1]} onChange={(value) => setGuards({ ...guards, retryCap: value })} />
          <Range label="Kill idle sessions after (seconds)" value={guards.killIdleSeconds} min={plan.bounds.kill[0]} max={plan.bounds.kill[1]} onChange={(value) => setGuards({ ...guards, killIdleSeconds: value })} />
          <Range label="Alert threshold (%)" value={guards.alertThreshold} min={plan.bounds.threshold[0]} max={plan.bounds.threshold[1]} onChange={(value) => setGuards({ ...guards, alertThreshold: value })} />
          <Button type="submit">Save limits</Button>
          {plan.id === 'student' && <p className="text-[13px] text-faint">Student keeps the defaults. Professional is where these move.</p>}
        </form>
      )}
      <section className="border-t border-line pt-6">
        <h2 className="text-[16px]">Seats</h2>
        <p className="mt-1 text-[13px] text-muted">
          {account.name} is the owner. {plan ? `${plan.name} includes ${plan.seats} total.` : 'A plan sets the count.'} Names stay in this browser.
        </p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          <li className="flex items-center justify-between py-3 text-[14px]">
            <span>{account.name}</span>
            <span className="text-faint">Owner</span>
          </li>
          {record.seats.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3 text-[14px]">
              <span>{item.name} <span className="text-faint">· {item.role}</span></span>
              <button className="text-[13px] text-muted" onClick={() => removeSeat(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const result = addSeat(seat, role)
            setMessage(result.ok ? `${seat} added.` : result.message)
            if (result.ok) setSeat('')
          }}
        >
          <div className="min-w-48 flex-1">
            <TextField label="Name the seat" value={seat} onChange={(event) => setSeat(event.target.value)} />
          </div>
          <label className="text-[13px] text-muted">
            Role
            <select className={`${controlClass} mt-1.5`} value={role} onChange={(event) => setRole(event.target.value as Seat['role'])}>
              <option>Reviewer</option>
              <option>Member</option>
            </select>
          </label>
          <Button type="submit">Add seat</Button>
        </form>
      </section>
      {message && <p className="text-[14px] text-muted">{message}</p>}
    </div>
  )
}

function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const locked = min === max
  return (
    <label className="block">
      <span className="flex justify-between text-[14px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </span>
      <input className="mt-2 w-full accent-white disabled:opacity-40" type="range" min={min} max={max} value={value} disabled={locked} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

export function PaymentPage() {
  useTitle('Payment method')
  const { record, updatePayment, updateBilling } = useWorkspace()
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card')
  const [pan, setPan] = useState('')
  const [exp, setExp] = useState('')
  const [cvv, setCvv] = useState('')
  const [holder, setHolder] = useState('')
  const [vpa, setVpa] = useState('')
  const [bank, setBank] = useState(banks[0])
  const [billing, setBilling] = useState<BillingAddress>(record.billing ?? {
    line1: '', line2: '', city: '', region: '', postal: '', country: 'India', gstin: '',
  })
  const [message, setMessage] = useState('')

  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="font-serif text-4xl tracking-[-0.03em]">Payment</h1>
      <p className="text-[14px] text-muted">On file: {record.payment?.label ?? 'nothing yet'}. Replacing it does not charge anything.</p>
      <div className="flex gap-2">
        {(['card', 'upi', 'netbanking'] as const).map((item) => (
          <button key={item} className={`h-9 rounded-full px-3 text-[13px] capitalize ${method === item ? 'bg-ink text-bg' : 'border border-line text-muted'}`} onClick={() => setMethod(item)}>
            {item === 'netbanking' ? 'Netbanking' : item === 'upi' ? 'UPI' : 'Card'}
          </button>
        ))}
      </div>
      {method === 'card' && (
        <div className="grid gap-3">
          <TextField label="Card number" value={pan} onChange={(event) => setPan(formatPan(event.target.value))} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Expiry" value={exp} onChange={(event) => setExp(formatExp(event.target.value))} />
            <TextField label="CVV" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, brandOf(pan) === 'amex' ? 4 : 3))} />
          </div>
          <TextField label="Name on card" value={holder} onChange={(event) => setHolder(event.target.value)} />
        </div>
      )}
      {method === 'upi' && <TextField label="UPI ID" value={vpa} onChange={(event) => setVpa(event.target.value)} />}
      {method === 'netbanking' && (
        <div className="grid gap-2">
          {banks.map((item) => (
            <button key={item} className={`rounded-lg border px-3 py-2 text-left text-[14px] ${bank === item ? 'border-white/40' : 'border-line'}`} onClick={() => setBank(item)}>{item}</button>
          ))}
        </div>
      )}
      <Button
        onClick={() => {
          if (method === 'card') {
            const card = readCard(pan, exp, cvv, holder)
            if (!card.ok) return setMessage(card.message)
            const result = updatePayment(card.payment)
            setMessage(result.ok ? `Saved ${card.payment.label}.` : result.message)
            return
          }
          if (method === 'upi') {
            if (!validVpa(vpa)) return setMessage('Enter a UPI id like name@okaxis.')
            const result = updatePayment({ type: 'upi', vpa, label: `UPI ${vpa}` })
            setMessage(result.ok ? 'UPI id saved.' : result.message)
            return
          }
          const result = updatePayment({ type: 'netbanking', bank, label: bank })
          setMessage(result.ok ? `${bank} saved.` : result.message)
        }}
      >
        Save payment method
      </Button>
      <form
        className="grid gap-3 border-t border-line pt-6"
        onSubmit={(event) => {
          event.preventDefault()
          const addressError = validateAddress(billing)
          if (addressError) return setMessage(addressError)
          const result = updateBilling(billing)
          setMessage(result.ok ? 'Billing address saved.' : result.message)
        }}
      >
        <h2 className="text-[16px]">Billing address</h2>
        <TextField label="Address" value={billing.line1} onChange={(event) => setBilling({ ...billing, line1: event.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="City" value={billing.city} onChange={(event) => setBilling({ ...billing, city: event.target.value })} />
          <TextField label="State" value={billing.region} onChange={(event) => setBilling({ ...billing, region: event.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Postal code" value={billing.postal} onChange={(event) => setBilling({ ...billing, postal: event.target.value })} />
          <label className="text-[13px] text-muted">
            Country
            <select className={`${controlClass} mt-1.5`} value={billing.country} onChange={(event) => setBilling({ ...billing, country: event.target.value })}>
              {['India', 'United States', 'United Kingdom', 'Singapore', 'United Arab Emirates', 'Germany', 'Other'].map((country) => <option key={country}>{country}</option>)}
            </select>
          </label>
        </div>
        <Button type="submit" variant="ghost">Save address</Button>
      </form>
      {message && <p className="text-[14px] text-muted">{message}</p>}
    </div>
  )
}

export function Invoices() {
  useTitle('Invoices')
  const { record } = useWorkspace()
  return (
    <div>
      <h1 className="font-serif text-4xl tracking-[-0.03em]">Invoices</h1>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {record.invoices.length === 0 && <li className="py-6 text-[14px] text-muted">No invoices yet. A plan or a pack creates the first one.</li>}
        {record.invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link to={`/account/invoices/${invoice.id}`} className="grid grid-cols-[1fr_auto] gap-2 py-4 sm:grid-cols-[140px_1fr_auto_auto]">
              <span className="font-mono text-[12px] text-faint">{invoice.number}</span>
              <span className="text-[14px]">{invoice.description}</span>
              <span className="text-[13px] capitalize text-muted">{invoice.status}</span>
              <span className="text-right tabular-nums">{inr(invoice.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function InvoiceDetail() {
  const { id } = useParams()
  const { account, record } = useWorkspace()
  const invoice = record.invoices.find((item) => item.id === id)
  useTitle(invoice ? invoice.number : 'Invoice')
  if (!invoice) {
    return (
      <div>
        <h1 className="font-serif text-4xl">That invoice is not on this workspace.</h1>
        <Link to="/account/invoices" className="mt-4 inline-block underline underline-offset-4">Back to invoices</Link>
      </div>
    )
  }
  return (
    <article className="print-sheet rounded-xl border border-line p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] text-faint">{invoice.number}</p>
          <h1 className="mt-2 font-serif text-4xl tracking-[-0.03em]">{inr(invoice.total)}</h1>
          <p className="mt-1 text-[14px] capitalize text-muted">{invoice.status} · {formatDate(invoice.createdAt)}</p>
        </div>
        <button className="no-print h-9 rounded-full border border-line px-3 text-[13px]" onClick={() => window.print()}>Print</button>
      </div>
      <div className="mt-8 grid gap-6 text-[14px] sm:grid-cols-2">
        <div>
          <p className="text-faint">From</p>
          <p className="mt-1">Zero-Ops</p>
          <p className="text-muted">Chandigarh, India</p>
          <p className="text-muted">Demo billing. No tax is remitted.</p>
        </div>
        <div>
          <p className="text-faint">To</p>
          <p className="mt-1">{account.org}</p>
          <p className="text-muted">{account.email}</p>
          {record.billing && (
            <p className="text-muted">
              {record.billing.line1}, {record.billing.city} {record.billing.postal}, {record.billing.country}
              {record.billing.gstin ? ` · GSTIN ${record.billing.gstin}` : ''}
            </p>
          )}
        </div>
      </div>
      <table className="mt-8 w-full text-left text-[14px]">
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.label} className="border-t border-line">
              <td className="py-2 pr-4">{line.label}</td>
              <td className="py-2 text-right tabular-nums">{inr(line.amount)}</td>
            </tr>
          ))}
          <tr className="border-t border-line">
            <td className="py-2">{invoice.taxLabel}</td>
            <td className="py-2 text-right tabular-nums">{inr(invoice.tax)}</td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-2 font-medium">Total</td>
            <td className="py-2 text-right font-medium tabular-nums">{inr(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-6 text-[13px] text-muted">Paid with {invoice.paidWith}. {invoice.description}.</p>
      <Link to="/account/invoices" className="no-print mt-6 inline-block text-[14px] underline underline-offset-4">All invoices</Link>
    </article>
  )
}
