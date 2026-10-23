import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { enterprise, matrix, packs, plans, pricingFaq } from '../content.ts'
import { recommend } from '../lib/billing.ts'
import { ANNUAL_DISCOUNT, USD_INR, annualUsd, compact, inr, usd } from '../lib/money.ts'
import { ButtonLink, Container, useTitle } from '../components/ui.tsx'

export default function Pricing() {
  useTitle('Pricing')
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')
  const [services, setServices] = useState(4)
  const [seats, setSeats] = useState(3)
  const [incidents, setIncidents] = useState(80)
  const [tokenIndex, setTokenIndex] = useState(3)
  const [open, setOpen] = useState(0)
  const tokenSteps = [100_000, 200_000, 500_000, 1_000_000, 3_000_000, 8_000_000, 15_000_000, 25_000_000]
  const tokens = tokenSteps[tokenIndex] ?? 1_000_000

  const professional = plans.find((plan) => plan.id === 'professional') ?? plans[1]
  const business = plans.find((plan) => plan.id === 'business') ?? plans[2]
  const fit = useMemo(
    () => recommend({ services, seats, incidents, tokens }),
    [services, seats, incidents, tokens],
  )
  const base = cycle === 'monthly' ? fit.plan.monthly : Math.round(fit.plan.annual / 12)
  const estimate = base + (cycle === 'monthly' ? fit.overage : Math.round(fit.overage))

  return (
    <article>
      <Container className="py-16 lg:py-20">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Pricing</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="max-w-[16ch] font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-7xl">
            A workspace, and a meter for the model.
          </h1>
          <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label="Billing period">
            {(['monthly', 'annual'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setCycle(item)}
                className={`relative h-9 rounded-full px-4 text-[13px] ${cycle === item ? 'bg-ink text-bg' : 'text-muted'}`}
              >
                {item === 'monthly' ? 'Monthly' : 'Annual · 10% off'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 max-w-2xl space-y-4 text-[16px] leading-relaxed text-muted">
          <p>
            A manual pass on this leak takes about 45 minutes. The reference median with AutoSRE is 1 minute 58 seconds, so each one gives back about 43 minutes. Professional’s 250 incidents a month is roughly 179 engineer-hours. At ₹1,000 an hour that is about ₹1.8 lakh of time. The plan is {usd(professional.usdMonthly)} a month, {inr(professional.monthly)}, about 3% of that time, and under a dollar a verified incident. Replay and cached mode are included and do not spend the model allowance.
          </p>
          <p>
            Five incident.io seats at $45 are $225 and do not open the pull request. Professional is {usd(professional.usdMonthly)} a month. Business is {usd(business.usdMonthly)} a month, against Cleric Team at $700 and PagerDuty AIOps at $699, which investigate and stop.
          </p>
          <p>
            Today the agent closes one class: connection exhaustion from unclosed cursors on Django and Postgres. Kubernetes OOM, DNS, and permission failures are on the roadmap and are not in the price. The charge is for a verified fix of the class that ships, and it is meant to scale as coverage grows.
          </p>
          <p className="text-[13px] text-faint">
            List prices are in USD. Invoices are in INR at the FBIL reference rate for 23 October 2026, ₹{USD_INR} per dollar. Annual is twelve months minus {Math.round(ANNUAL_DISCOUNT * 100)}%. GST at 18% is added for billing addresses in India. Student is one month free with a student ID, and that month does not renew.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const trial = plan.usdMonthly === 0
            const shownUsd = trial ? 0 : cycle === 'monthly' ? plan.usdMonthly : plan.usdMonthly * (1 - ANNUAL_DISCOUNT)
            const billedUsd = trial ? 0 : cycle === 'monthly' ? plan.usdMonthly : annualUsd(plan.usdMonthly)
            const billedInr = cycle === 'monthly' ? plan.monthly : plan.annual
            return (
              <article key={plan.id} className={`flex flex-col rounded-xl border p-6 ${plan.id === 'professional' ? 'border-white/35 bg-panel' : 'border-line'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[20px] font-medium tracking-[-0.02em]">{plan.name}</h2>
                  {plan.id === 'professional' && <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Most teams</span>}
                </div>
                <p className="mt-2 text-[13px] text-faint">{plan.kicker}</p>
                <p className="mt-6 font-serif text-5xl tracking-[-0.03em]">{trial ? 'Free' : usd(shownUsd)}</p>
                <p className="mt-1 text-[13px] text-muted">
                  {trial
                    ? '1 month · student ID'
                    : `per month${cycle === 'annual' ? `, billed ${usd(billedUsd)} yearly` : ''} · ${inr(billedInr)}`}
                </p>
                <ul className="mt-6 grid flex-1 gap-2 text-[14px] text-muted">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-good" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12.5px] text-faint">
                  Overage {inr(plan.overageIncident)} / incident · {inr(plan.overagePer10k)} / 10k tokens
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <ButtonLink to={`/checkout?plan=${plan.id}&cycle=${trial ? 'monthly' : cycle}`}>
                    {trial ? 'Start the free month' : `Start ${plan.name}`}
                  </ButtonLink>
                </div>
              </article>
            )
          })}
          <article className="flex flex-col rounded-xl border border-line p-6">
            <h2 className="text-[20px] font-medium tracking-[-0.02em]">{enterprise.name}</h2>
            <p className="mt-2 text-[13px] text-faint">{enterprise.kicker}</p>
            <p className="mt-6 font-serif text-5xl tracking-[-0.03em]">Contact us</p>
            <p className="mt-1 text-[13px] text-muted">{enterprise.summary}</p>
            <ul className="mt-6 grid flex-1 gap-2 text-[14px] text-muted">
              {enterprise.includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-good" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <ButtonLink to="/demo?plan=enterprise">Contact us</ButtonLink>
            </div>
          </article>
        </div>
      </Container>

      <section className="border-y border-line">
        <Container className="overflow-x-auto py-14">
          <table className="w-full min-w-[860px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-faint">
                <th className="py-3 pr-4 font-normal">Included</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="py-3 pr-4 font-medium text-ink">
                    {plan.name}
                  </th>
                ))}
                <th className="py-3 pr-4 font-medium text-ink">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th className="py-3 pr-4 font-normal text-muted">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${index}`} className="py-3 pr-4">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h2 className="font-serif text-4xl tracking-[-0.03em]">Estimate a month</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            Move the load. The suggestion is the cheapest plan that covers it. Past Business on seats or services, the calculator stops inventing a price and sends you to Enterprise.
          </p>
          <div className="mt-8 grid gap-5">
            <Slider label="Services" value={services} min={1} max={60} onChange={setServices} display={String(services)} />
            <Slider label="Seats" value={seats} min={1} max={40} onChange={setSeats} display={String(seats)} />
            <Slider label="Incidents / month" value={incidents} min={10} max={4000} step={10} onChange={setIncidents} display={incidents.toLocaleString('en-IN')} />
            <Slider label="Tokens / month" value={tokenIndex} min={0} max={tokenSteps.length - 1} onChange={setTokenIndex} display={compact(tokens)} />
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-line bg-panel p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Suggested</p>
          <h3 className="mt-2 font-serif text-4xl tracking-[-0.03em]">{fit.plan.name}</h3>
          {fit.because && <p className="mt-3 text-[14px] leading-relaxed text-muted">{fit.because}</p>}
          <p className="mt-5 font-serif text-4xl">{fit.plan.id === 'student' ? '1 month free' : inr(estimate)}</p>
          <p className="mt-1 text-[13px] text-muted">
            per month on {cycle}
            {fit.overage > 0 ? `, including about ${inr(fit.overage)} of overage` : ', inside the allowance'}
          </p>
          {fit.plan.id === 'student' && (
            <p className="mt-3 text-[13px] text-warn">Student needs a university email and a student ID. The month does not renew.</p>
          )}
          {fit.uncovered ? (
            <>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">{fit.uncovered}</p>
              <ButtonLink to="/demo?plan=enterprise" className="mt-6">
                Contact us
              </ButtonLink>
            </>
          ) : (
            <ButtonLink to={`/checkout?plan=${fit.plan.id}&cycle=${cycle}`} className="mt-6">
              Continue with {fit.plan.name}
            </ButtonLink>
          )}
          <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
            Packs cost less than overage. 2 million tokens is {inr(2000)}, against {inr(fit.plan.overagePer10k)} per 10k once you are past the allowance.
          </p>
        </aside>
      </Container>

      <section className="border-t border-line">
        <Container className="py-14">
          <h2 className="font-serif text-3xl tracking-[-0.03em]">Packs, when the month runs hot</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {packs.map((pack) => (
              <div key={pack.id} className="rounded-xl border border-line p-4">
                <p className="text-[14px]">{pack.name}</p>
                <p className="mt-2 font-serif text-2xl">{inr(pack.price)}</p>
                <p className="mt-1 text-[12px] text-faint">Added from an active workspace. Cheaper than overage.</p>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-line">
            {pricingFaq.map((item, index) => {
              const isOpen = open === index
              return (
                <div key={item.q} className="border-b border-line">
                  <button className="flex w-full items-center justify-between gap-6 py-5 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : index)}>
                    <span className="text-[16px]">{item.q}</span>
                    <span className="font-mono text-faint">{isOpen ? '–' : '+'}</span>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-3xl pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-8 text-[14px] text-muted">
            The billing rules in full are in the <Link className="underline decoration-white/20 underline-offset-4" to="/docs/billing">docs</Link> and the <Link className="underline decoration-white/20 underline-offset-4" to="/legal/refunds">refund terms</Link>.
          </p>
        </Container>
      </section>
    </article>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  display: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[14px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-[13px] tabular-nums">{display}</span>
      </span>
      <input
        className="mt-3 w-full accent-white"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
