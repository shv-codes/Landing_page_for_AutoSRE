import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { banks, countries, plans } from '../content.ts'
import { isStudentEmail, quote, validStudentId, validateAddress } from '../lib/billing.ts'
import { brandOf, formatExp, formatPan, readCard, validVpa } from '../lib/cards.ts'
import { formatDate } from '../lib/format.ts'
import { inr, usd, annualUsd } from '../lib/money.ts'
import { useStore } from '../lib/store.tsx'
import type { BillingAddress, Cycle, PaymentMethod, PlanId } from '../types.ts'
import { Banner, Button, Container, TextField, controlClass, useTitle } from '../components/ui.tsx'

const emptyAddress: BillingAddress = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal: '',
  country: 'India',
  gstin: '',
}

function isPlan(value: string | null): value is PlanId {
  return plans.some((plan) => plan.id === value)
}

export default function Checkout() {
  useTitle('Checkout')
  const [params] = useSearchParams()
  const planId = params.get('plan')
  const cycle: Cycle = planId === 'student' || params.get('cycle') !== 'annual' ? 'monthly' : 'annual'
  if (!isPlan(planId)) return <Navigate to="/pricing" replace />
  return <CheckoutForm planId={planId} cycle={cycle} />
}

function CheckoutForm({ planId, cycle }: { planId: PlanId; cycle: Cycle }) {
  const { account, record, signup, login, purchase } = useStore()
  const navigate = useNavigate()
  const plan = plans.find((item) => item.id === planId)!
  const [step, setStep] = useState<'account' | 'pay'>(account ? 'pay' : 'account')
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [auth, setAuth] = useState({ name: '', email: '', password: '', org: '' })
  const [authError, setAuthError] = useState('')
  const [billing, setBilling] = useState<BillingAddress>(record?.billing ?? emptyAddress)
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card')
  const [useSaved, setUseSaved] = useState(Boolean(record?.payment))
  const [pan, setPan] = useState('')
  const [exp, setExp] = useState('')
  const [cvv, setCvv] = useState('')
  const [holder, setHolder] = useState('')
  const [vpa, setVpa] = useState('')
  const [bank, setBank] = useState(banks[0])
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [studentId, setStudentId] = useState(record?.studentId ?? '')
  const [phase, setPhase] = useState<'form' | 'upi' | 'otp' | 'processing'>('form')
  const [invoiceId, setInvoiceId] = useState<string | undefined>()
  const frozenQuote = useRef<ReturnType<typeof quote> | null>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (account) setStep('pay')
  }, [account])

  useEffect(() => {
    if (record?.billing && !seeded.current) {
      setBilling(record.billing)
      seeded.current = true
    }
  }, [record])

  const priced = quote({
    record: record ?? null,
    planId,
    cycle,
    country: billing.country,
  })
  const shown = phase === 'processing' && frozenQuote.current ? frozenQuote.current : priced

  const finish = (payment: PaymentMethod | null) => {
    const result = purchase({
      planId,
      cycle,
      country: billing.country,
      billing: priced.immediate && priced.total > 0 ? billing : record?.billing ?? null,
      payment,
      studentId,
    })
    if (!result.ok) {
      frozenQuote.current = null
      setError(result.message)
      setPhase('form')
      return
    }
    frozenQuote.current = priced
    setInvoiceId(result.invoiceId)
    setError('')
    setPhase('processing')
  }

  const pay = () => {
    setError('')
    if (priced.kind === 'same' || priced.kind === 'scheduled') return
    if (planId === 'student') {
      if (account && !isStudentEmail(account.email)) {
        setError('Student needs a university email. Go back and choose Professional, or create the workspace with a .edu or .ac.in address.')
        return
      }
      if (!validStudentId(studentId)) {
        setError('Enter a student ID of 4 to 20 letters or digits.')
        return
      }
    }
    if (priced.immediate && priced.total > 0) {
      const addressError = validateAddress(billing)
      if (addressError) {
        setError(addressError)
        return
      }
    }
    if (priced.kind === 'downgrade' || priced.total === 0) {
      finish(record?.payment ?? null)
      return
    }
    if (useSaved && record?.payment) {
      finish(record.payment)
      return
    }
    if (method === 'card') {
      const card = readCard(pan, exp, cvv, holder)
      if (!card.ok) {
        setError(card.message)
        return
      }
      finish(card.payment)
      return
    }
    if (method === 'upi') {
      if (!validVpa(vpa)) {
        setError('Enter a UPI id like name@okaxis.')
        return
      }
      setPhase('upi')
      return
    }
    setPhase('otp')
  }

  return (
    <div>
      <div className={`border-b ${priced.total > 0 ? 'border-warn/30 bg-warn/10' : 'border-line bg-panel'}`}>
        <Container className={`py-2.5 text-[12.5px] leading-relaxed ${priced.total > 0 ? 'text-warn' : 'text-muted'}`}>
          {priced.total > 0
            ? 'Test mode. Card numbers, UPI ids, and bank OTPs are checked on this page and never sent to a bank. Production checkout hands this step to Razorpay. Try 4242 4242 4242 4242, any future expiry, any CVV.'
            : 'Nothing is due today. No card, UPI id, or billing address is collected for this change.'}
        </Container>
      </div>
      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,640px)_300px]">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-faint">
            {step === 'account' ? 'Step 1 of 2 · Workspace' : priced.total > 0 ? 'Step 2 of 2 · Payment' : 'Step 2 of 2 · Confirm'}
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">
            {shown.kind === 'downgrade' ? 'Schedule the change' : shown.kind === 'upgrade' ? 'Confirm the upgrade' : shown.kind === 'renewal' ? 'Pay the renewal' : `Subscribe to ${plan.name}`}
          </h1>

          {step === 'account' && (
            <form
              className="mt-8 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (mode === 'login') {
                  const result = login(auth.email, auth.password)
                  if (!result.ok) return setAuthError(result.message)
                  setStep('pay')
                  return
                }
                if (auth.name.trim().length < 2) return setAuthError('Enter your name.')
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auth.email)) return setAuthError('Enter an email address.')
                if (auth.password.length < 8) return setAuthError('Use at least 8 characters.')
                if (auth.org.trim().length < 2) return setAuthError('Name the organization or the project.')
                const result = signup(auth)
                if (!result.ok) return setAuthError(result.message)
                setStep('pay')
              }}
            >
              <div className="flex gap-4 text-[14px]">
                <button type="button" className={mode === 'signup' ? 'text-ink' : 'text-muted'} onClick={() => setMode('signup')}>
                  Create workspace
                </button>
                <button type="button" className={mode === 'login' ? 'text-ink' : 'text-muted'} onClick={() => setMode('login')}>
                  Sign in
                </button>
              </div>
              {mode === 'signup' && (
                <TextField label="Your name" value={auth.name} onChange={(event) => setAuth({ ...auth, name: event.target.value })} />
              )}
              <TextField label="Email" type="email" value={auth.email} autoComplete="email" onChange={(event) => setAuth({ ...auth, email: event.target.value })} />
              <TextField label="Password" type="password" value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} />
              {mode === 'signup' && (
                <TextField label="Organization or project" value={auth.org} onChange={(event) => setAuth({ ...auth, org: event.target.value })} />
              )}
              {planId === 'student' && <Banner tone="warn">Student is one month free. It needs a university email and a student ID, and it does not renew.</Banner>}
              {authError && <Banner tone="bad">{authError}</Banner>}
              <Button type="submit">{mode === 'signup' ? (plan.monthly === 0 ? 'Continue' : 'Continue to payment') : 'Sign in and continue'}</Button>
            </form>
          )}

          {step === 'pay' && phase === 'form' && (
            <div className="mt-8 grid gap-6">
              {account && <p className="text-[14px] text-muted">Workspace {account.workspace} · {account.email}</p>}
              {planId === 'student' && priced.kind !== 'same' && priced.kind !== 'scheduled' && (
                <TextField
                  label="Student ID"
                  value={studentId}
                  autoComplete="off"
                  placeholder="A1024"
                  onChange={(event) => setStudentId(event.target.value.trim())}
                  hint="The ID on your student card. Letters, digits, or a hyphen."
                />
              )}
              {(priced.kind === 'same' || priced.kind === 'scheduled') && (
                <div className="grid gap-3">
                  <Banner>{priced.detail}</Banner>
                  <Link to="/account/plan" className="text-[14px] underline underline-offset-4">Manage the plan</Link>
                </div>
              )}
              {priced.kind !== 'same' && priced.kind !== 'scheduled' && (
                <>
                  {priced.immediate && priced.total > 0 && (
                    <fieldset className="grid gap-4">
                      <legend className="text-[14px] text-ink">Billing address</legend>
                      <TextField label="Address" value={billing.line1} onChange={(event) => setBilling({ ...billing, line1: event.target.value })} />
                      <TextField label="Address line 2" hint="Optional" value={billing.line2} onChange={(event) => setBilling({ ...billing, line2: event.target.value })} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField label="City" value={billing.city} onChange={(event) => setBilling({ ...billing, city: event.target.value })} />
                        <TextField label={billing.country === 'India' ? 'State' : 'Region'} value={billing.region} onChange={(event) => setBilling({ ...billing, region: event.target.value })} />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField label={billing.country === 'India' ? 'PIN code' : 'Postal code'} value={billing.postal} onChange={(event) => setBilling({ ...billing, postal: event.target.value })} />
                        <label className="block text-[13px] text-muted">
                          Country
                          <select className={`${controlClass} mt-1.5`} value={billing.country} onChange={(event) => setBilling({ ...billing, country: event.target.value })}>
                            {countries.map((country) => <option key={country}>{country}</option>)}
                          </select>
                        </label>
                      </div>
                      {billing.country === 'India' && (
                        <TextField label="GSTIN" hint="Optional" value={billing.gstin} onChange={(event) => setBilling({ ...billing, gstin: event.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
                      )}
                    </fieldset>
                  )}

                  {priced.total > 0 && (
                    <fieldset>
                      <legend className="text-[14px] text-ink">Payment</legend>
                      {record?.payment && (
                        <label className="mt-3 flex items-center gap-2 text-[14px]">
                          <input type="checkbox" checked={useSaved} onChange={(event) => setUseSaved(event.target.checked)} />
                          Use {record.payment.label}
                        </label>
                      )}
                      {!useSaved && (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(['card', 'upi', 'netbanking'] as const).map((item) => (
                              <button
                                type="button"
                                key={item}
                                onClick={() => setMethod(item)}
                                className={`h-9 rounded-full px-3 text-[13px] ${method === item ? 'bg-ink text-bg' : 'border border-line text-muted'}`}
                              >
                                {item === 'card' ? 'Card' : item === 'upi' ? 'UPI' : 'Netbanking'}
                              </button>
                            ))}
                          </div>
                          {method === 'card' && (
                            <div className="mt-4 grid gap-4">
                              <TextField
                                label="Card number"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                value={pan}
                                placeholder="4242 4242 4242 4242"
                                onChange={(event) => setPan(formatPan(event.target.value))}
                                hint={brandOf(pan) === 'card' ? '' : brandOf(pan)}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <TextField label="Expiry" autoComplete="cc-exp" placeholder="MM/YY" value={exp} onChange={(event) => setExp(formatExp(event.target.value))} />
                                <TextField label="CVV" autoComplete="cc-csc" inputMode="numeric" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, brandOf(pan) === 'amex' ? 4 : 3))} />
                              </div>
                              <TextField label="Name on card" autoComplete="cc-name" value={holder} onChange={(event) => setHolder(event.target.value)} />
                            </div>
                          )}
                          {method === 'upi' && (
                            <div className="mt-4">
                              <TextField label="UPI ID" placeholder="name@okaxis" value={vpa} onChange={(event) => setVpa(event.target.value.trim())} />
                            </div>
                          )}
                          {method === 'netbanking' && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              {banks.map((item) => (
                                <button
                                  type="button"
                                  key={item}
                                  onClick={() => setBank(item)}
                                  className={`rounded-lg border px-3 py-3 text-left text-[14px] ${bank === item ? 'border-white/50 bg-white/5' : 'border-line'}`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </fieldset>
                  )}

                  {error && <Banner tone="bad">{error}</Banner>}
                  <Button type="button" onClick={pay}>
                    {priced.kind === 'downgrade' ? 'Schedule change' : priced.total === 0 ? 'Start for free' : `Pay ${inr(priced.total)}`}
                  </Button>
                  <p className="text-[12.5px] leading-relaxed text-faint">
                    By continuing you agree to the <Link className="underline underline-offset-4" to="/legal/terms">terms</Link> and <Link className="underline underline-offset-4" to="/legal/refunds">refund rules</Link>. You can cancel before the next renewal.
                  </p>
                </>
              )}
            </div>
          )}

          {phase === 'upi' && (
            <div className="mt-8 rounded-xl border border-line p-6">
              <p className="font-mono text-[12px] text-faint">UPI collect</p>
              <h2 className="mt-2 font-serif text-3xl">{inr(priced.total)}</h2>
              <p className="mt-2 text-[14px] text-muted">Zero-Ops requested {vpa}. Approve it to continue. In test mode the approval is this button.</p>
              <div className="mt-5 flex gap-3">
                <Button
                  type="button"
                  onClick={() => finish({ type: 'upi', vpa, label: `UPI ${vpa}` })}
                >
                  Approve in test mode
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPhase('form')}>Cancel</Button>
              </div>
              {error && <div className="mt-4"><Banner tone="bad">{error}</Banner></div>}
            </div>
          )}

          {phase === 'otp' && (
            <form
              className="mt-8 grid max-w-sm gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!/^\d{6}$/.test(otp)) {
                  setError('Enter the 6-digit OTP. Any 6 digits work in test mode.')
                  return
                }
                finish({ type: 'netbanking', bank, label: bank })
              }}
            >
              <h2 className="font-serif text-3xl">Authorize with {bank}</h2>
              <p className="text-[14px] text-muted">A production bank would text this code. Here, enter any 6 digits.</p>
              <TextField label="OTP" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} />
              {error && <Banner tone="bad">{error}</Banner>}
              <div className="flex gap-3">
                <Button type="submit">Authorize {inr(priced.total)}</Button>
                <Button type="button" variant="ghost" onClick={() => setPhase('form')}>Back</Button>
              </div>
            </form>
          )}

          {phase === 'processing' && (
            <Processing
              steps={
                shown.kind === 'downgrade'
                  ? ['Recording the schedule', 'Keeping the current plan active']
                  : shown.total === 0
                    ? ['Writing the subscription', 'Opening the workspace']
                    : ['Checking the payment', 'Authorizing', 'Writing the subscription', 'Opening the workspace']
              }
              onDone={() => navigate(`/checkout/done?id=${invoiceId ?? ''}`)}
            />
          )}
        </div>
        <Summary plan={plan} cycle={cycle} priced={shown} />
      </Container>
    </div>
  )
}

function Summary({
  plan,
  cycle,
  priced,
}: {
  plan: (typeof plans)[number]
  cycle: Cycle
  priced: ReturnType<typeof quote>
}) {
  const list = plan.usdMonthly === 0 ? null : cycle === 'annual' ? annualUsd(plan.usdMonthly) : plan.usdMonthly
  return (
    <aside className="h-fit rounded-xl border border-line bg-panel p-5 lg:sticky lg:top-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Due today</p>
      <p className="mt-2 font-serif text-4xl tracking-[-0.03em]">{priced.total === 0 ? '₹0' : inr(priced.total)}</p>
      <p className="mt-1 text-[13px] text-muted">
        {plan.name} · {plan.id === 'student' ? '1 month free' : cycle}
        {list ? ` · list ${usd(list)}` : ''}
      </p>
      <dl className="mt-5 grid gap-2 border-t border-line pt-4 text-[13px]">
        {priced.lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-3">
            <dt className="text-muted">{line.label}</dt>
            <dd className="tabular-nums">{inr(line.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{priced.taxLabel}</dt>
          <dd className="tabular-nums">{inr(priced.tax)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-[12.5px] leading-relaxed text-faint">{priced.detail}</p>
      {priced.periodEnd && priced.immediate && (
        <p className="mt-2 text-[12.5px] text-faint">Period ends {formatDate(priced.periodEnd)}.</p>
      )}
    </aside>
  )
}

function Processing({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (index >= steps.length) {
      const timer = window.setTimeout(() => done.current(), 450)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setIndex((value) => value + 1), 680)
    return () => window.clearTimeout(timer)
  }, [index, steps.length])

  return (
    <ol className="mt-10 grid gap-3">
      {steps.map((step, stepIndex) => {
        const state = stepIndex < index ? 'done' : stepIndex === index ? 'now' : 'wait'
        return (
          <li key={step} className="flex items-center gap-3 text-[15px]">
            <span className={`size-2 rounded-full ${state === 'wait' ? 'bg-white/20' : state === 'now' ? 'bg-warn' : 'bg-good'}`} />
            <span className={state === 'wait' ? 'text-faint' : 'text-ink'}>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function CheckoutDone() {
  useTitle('Receipt')
  const [params] = useSearchParams()
  const { account, record } = useStore()
  const invoice = record?.invoices.find((item) => item.id === params.get('id'))
  if (!account) return <Navigate to="/login?next=/account" replace />

  return (
    <Container className="max-w-2xl py-16">
      <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-good">Workspace ready</p>
      <h1 className="mt-3 font-serif text-5xl tracking-[-0.035em]">
        {invoice?.status === 'scheduled' ? 'The change is on the calendar.' : 'You are in.'}
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-muted">
        {invoice ? invoice.description : 'The payment finished. The invoice is on the workspace if you need it again.'}
      </p>
      {invoice && (
        <div className="mt-8 rounded-xl border border-line p-5">
          <div className="flex justify-between text-[13px] text-faint">
            <span>{invoice.number}</span>
            <span>{invoice.status === 'paid' ? 'Paid' : 'Scheduled'}</span>
          </div>
          <p className="mt-3 font-serif text-4xl">{inr(invoice.total)}</p>
          <p className="mt-1 text-[13px] text-muted">{invoice.paidWith}</p>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/console" className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-[14px] font-medium text-bg">Open the console</Link>
        <Link to={invoice ? `/account/invoices/${invoice.id}` : '/account'} className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[14px]">
          View the invoice
        </Link>
        <Link to="/account/usage" className="inline-flex h-10 items-center px-2 text-[14px] text-muted">
          Check usage
        </Link>
      </div>
    </Container>
  )
}
