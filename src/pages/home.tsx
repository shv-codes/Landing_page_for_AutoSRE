import { useState } from 'react'
import { Link } from 'react-router-dom'
import { enterprise, homeFaq, loop, plans } from '../content.ts'
import { annualUsd, inr, usd } from '../lib/money.ts'
import { HeroVisual } from '../components/scene.tsx'
import { IncidentTimeline, RunPlayer, StickyStory } from '../components/story.tsx'
import { ButtonLink, Container, useTitle } from '../components/ui.tsx'

export default function Home() {
  useTitle('AutoSRE')
  const [phase, setPhase] = useState(0)
  const [player, setPlayer] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Container className="grid items-center gap-6 pb-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-8 lg:pt-16">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">AutoSRE</p>
            <h1 className="mt-4 max-w-[14ch] font-serif text-[clamp(48px,6.6vw,86px)] leading-[0.94] tracking-[-0.035em]">
              The incident ends in a <em className="italic">pull request.</em>
            </h1>
            <p className="mt-6 max-w-[40rem] text-[17px] leading-relaxed text-muted">
              AutoSRE reads the alert, finds the commit that leaked the cursor, kills the stuck sessions, and proves a patch in a sandbox with no network. Median on the reference service: 1 minute 58 seconds. A person still merges.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to="/pricing">Choose a plan</ButtonLink>
              <button
                className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[14px] text-ink hover:bg-white/5"
                onClick={() => setPlayer(true)}
              >
                Watch INC-0042
              </button>
            </div>
            <p className="mt-6 max-w-md text-[13px] leading-relaxed text-faint">
              12 of 14 incidents closed with no one in the diff. 0 pushes to main. The light on the right is one incident moving through the loop.
            </p>
          </div>
          <HeroVisual phase={phase} onPhase={setPhase} />
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            ['14', 'incidents, 30 days'],
            ['12', 'fixed without a person'],
            ['1m 58s', 'median alert to PR'],
            ['0', 'pushes to main, ever'],
          ].map(([value, label]) => (
            <div key={label} className="bg-bg px-5 py-6 sm:px-6">
              <p className="font-serif text-4xl tracking-[-0.03em] sm:text-5xl">{value}</p>
              <p className="mt-2 text-[13px] text-muted">{label}</p>
            </div>
          ))}
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_1fr] lg:py-28">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">The problem</p>
            <h2 className="mt-3 max-w-[16ch] font-serif text-4xl leading-[1.02] tracking-[-0.03em] sm:text-6xl">
              A chatbot will tell you to close the cursor. It will not close it.
            </h2>
          </div>
          <div className="max-w-xl text-[16px] leading-relaxed text-muted">
            <p>
              At 3am the pool is at 98 of 100. The engineer correlates telemetry, logs, and git, writes a patch under a page, and writes the post-mortem afterwards. The suggestion from a chat window is not a test result.
            </p>
            <p className="mt-4">
              On the reference service the first patch failed because the cursor was still open. The second patch closed it. Fourteen tests passed. The draft waited for the person who owns analytics.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-[12.5px] leading-relaxed text-ink">
{`AssertionError: 1 cursor(s) opened but not closed

# attempt 2
14 passed
manage.py check · no issues
draft pull request #42 · main untouched`}
            </pre>
          </div>
        </Container>
      </section>

      <section id="product" className="border-b border-line py-20 lg:py-28">
        <Container>
          <div className="mb-12 max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">The console</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">What the on-call actually sees.</h2>
          </div>
          <StickyStory />
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="py-20 lg:py-28">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">The loop</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Six stages. Then a person.</h2>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {loop.map((step, index) => (
              <li key={step.id} className="bg-bg p-6">
                <p className="font-mono text-[12px] text-faint">0{index + 1}</p>
                <h3 className="mt-3 text-[18px] font-medium tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="grid items-start gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">INC-0042</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Postgres pool exhausted. Three minutes later, a draft.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              victim-service, 17 Oct. Connections fell from 98 to 31 after five idle sessions were killed. The merge was held because Rohan owns analytics.
            </p>
            <Link to="/product#inc-0042" className="mt-6 inline-block text-[14px] text-ink underline decoration-white/20 underline-offset-4">
              Read the system behind this run
            </Link>
          </div>
          <IncidentTimeline />
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Plans</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Priced like a tool that does the work, plus the model that writes the diff.</h2>
            </div>
            <Link to="/pricing" className="text-[14px] text-muted underline decoration-white/20 underline-offset-4 hover:text-ink">
              Compare and estimate
            </Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const trial = plan.usdMonthly === 0
              return (
                <article key={plan.id} className={`rounded-xl border p-6 ${plan.id === 'professional' ? 'border-white/30 bg-panel' : 'border-line bg-bg'}`}>
                  <p className="text-[13px] text-faint">{plan.kicker}</p>
                  <h3 className="mt-2 text-[20px] font-medium tracking-[-0.02em]">{plan.name}</h3>
                  <p className="mt-5 font-serif text-5xl tracking-[-0.03em]">{trial ? 'Free' : usd(plan.usdMonthly)}</p>
                  <p className="mt-1 text-[13px] text-muted">
                    {trial ? '1 month · student ID' : `per month · ${usd(annualUsd(plan.usdMonthly))} a year · ${inr(plan.monthly)}`}
                  </p>
                  <p className="mt-4 min-h-16 text-[14px] leading-relaxed text-muted">{plan.summary}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {trial ? (
                      <ButtonLink to={`/checkout?plan=${plan.id}&cycle=monthly`}>Start the free month</ButtonLink>
                    ) : (
                      <>
                        <ButtonLink to={`/checkout?plan=${plan.id}&cycle=monthly`}>Start monthly</ButtonLink>
                        <ButtonLink to={`/checkout?plan=${plan.id}&cycle=annual`} variant="ghost">
                          Start annual
                        </ButtonLink>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
            <article className="rounded-xl border border-line bg-bg p-6">
              <p className="text-[13px] text-faint">{enterprise.kicker}</p>
              <h3 className="mt-2 text-[20px] font-medium tracking-[-0.02em]">{enterprise.name}</h3>
              <p className="mt-5 font-serif text-5xl tracking-[-0.03em]">Contact us</p>
              <p className="mt-1 text-[13px] text-muted">Self-hosted · your model key</p>
              <p className="mt-4 min-h-16 text-[14px] leading-relaxed text-muted">{enterprise.summary}</p>
              <div className="mt-6">
                <ButtonLink to="/demo?plan=enterprise">Contact us</ButtonLink>
              </div>
            </article>
          </div>
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-faint">
            Professional is $49 a month. 250 incidents are about 179 engineer-hours against a 45-minute manual pass, about ₹1.8 lakh at ₹1,000 an hour. Student is one month free with a student ID. Annual is 10% off. Paid plans add GST at 18% for billing addresses in India. Every plan opens draft pull requests only.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-20 lg:py-28">
          <h2 className="font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Questions worth answering before a card.</h2>
          <div className="mt-8 border-t border-line">
            {homeFaq.map((item, index) => {
              const open = openFaq === index
              return (
                <div key={item.q} className="border-b border-line">
                  <button
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? -1 : index)}
                  >
                    <span className="text-[17px] tracking-[-0.02em]">{item.q}</span>
                    <span className="font-mono text-[13px] text-faint">{open ? '–' : '+'}</span>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-3xl pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-16 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-12">
            <h2 className="max-w-[16ch] font-serif text-4xl tracking-[-0.03em] sm:text-6xl">Put the next connection leak in front of it.</h2>
            <div className="flex gap-3">
              <ButtonLink to="/pricing">See pricing</ButtonLink>
              <ButtonLink to="/security" variant="ghost">
                Read the guardrails
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
      <RunPlayer open={player} onClose={() => setPlayer(false)} />
    </>
  )
}
