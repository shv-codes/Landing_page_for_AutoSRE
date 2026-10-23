import { loop } from '../content.ts'
import { IncidentTimeline, ShotFrame } from '../components/story.tsx'
import { ButtonLink, Container, useTitle } from '../components/ui.tsx'

const integrations = [
  ['GitHub', 'A branch and a draft pull request. Token scope is the repo. Main is not a remote it can push to.'],
  ['PostgreSQL', 'Read pg_stat_activity. The only write is pg_terminate_backend on sessions idle in a transaction.'],
  ['Docker', 'A fresh container per attempt. No network, no host mounts, destroyed when the run ends.'],
  ['Gemini', '1.5 Flash on Vertex for the patch. Swappable. Cached responses when the API is down, and the console says so.'],
  ['Slack', 'The incident update and the pull request link, to a channel. Optional, from Professional up.'],
  ['pytest', 'The proof. A regression test that fails on the leak and passes on the fix, plus manage.py check.'],
]

export default function Product() {
  useTitle('Product')
  return (
    <article>
      <Container className="py-16 lg:py-24">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Product</p>
        <h1 className="mt-4 max-w-[16ch] font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-7xl">
          Closed-loop remediation. Open pull request.
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted">
          AutoSRE is the agent that sits beside a service. This release handles one incident well: a PostgreSQL pool exhausted by a cursor that was never closed. It diagnoses, patches, proves, and stops.
        </p>
      </Container>

      <div className="border-y border-line">
        <Container className="grid gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">State machine</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em]">Pass, or escalate. No third option.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              A sandbox failure returns to patching while attempts remain. After three, a person gets the diffs, the traces, and the timeline. The agent does not keep the token meter running out of stubbornness.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-5">
            <p className="font-mono text-[12px] leading-7 text-ink">
              ALERT → DIAGNOSING → CORRELATING → PATCHING → SANDBOX
            </p>
            <p className="mt-2 font-mono text-[12px] leading-7 text-good">pass → PR_CREATED → RESOLVED</p>
            <p className="mt-2 font-mono text-[12px] leading-7 text-bad">fail × 3 → ESCALATED_TO_HUMAN</p>
          </div>
        </Container>
      </div>

      <Container className="py-16">
        <ol className="grid gap-8 md:grid-cols-2">
          {loop.map((step, index) => (
            <li key={step.id} className="border-t border-line pt-5">
              <p className="font-mono text-[12px] text-faint">0{index + 1}</p>
              <h2 className="mt-2 text-xl tracking-[-0.02em]">{step.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>

      <section id="inc-0042" className="border-y border-line">
        <Container className="grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Reference incident</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em]">INC-0042, minute by minute</h2>
            <div className="mt-8">
              <IncidentTimeline />
            </div>
          </div>
          <div>
            <ShotFrame src="/shots/resolved.png" alt="Resolved incident INC-0042 with the diff and the passing tests" />
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              The on-call note on the draft: the five killed sessions were all the report endpoint, the diff looked right, and the merge waited for the owner of analytics. That hold is the product working, not a missing feature.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <h2 className="font-serif text-4xl tracking-[-0.03em]">The short list of systems it talks to</h2>
        <div className="mt-8 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map(([name, detail]) => (
            <div key={name} className="border-b border-r border-line p-6">
              <h3 className="text-[16px] font-medium">{name}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 grid gap-6 rounded-xl border border-line p-6 sm:grid-cols-[1.4fr_1fr] sm:p-8">
          <div>
            <h2 className="font-serif text-3xl tracking-[-0.03em]">Not in this release</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Today AutoSRE handles one incident class: connection exhaustion from unclosed cursors on Django and Postgres. Kubernetes OOM, DNS failures, IAM mistakes, Datadog or PagerDuty as an alert source, and multi-repo support are on the roadmap. They are not in the price. The charge is for a verified fix of the class that ships, and it is meant to scale as coverage grows. A manual pass on this leak is about 45 minutes. The reference median is 1m 58s.
            </p>
          </div>
          <div className="flex items-end">
            <ButtonLink to="/security">See what it refuses to do</ButtonLink>
          </div>
        </div>
      </Container>
    </article>
  )
}
