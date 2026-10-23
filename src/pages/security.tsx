import { ShotFrame } from '../components/story.tsx'
import { ButtonLink, Container, useTitle } from '../components/ui.tsx'

const rules = [
  ['Diff size', '50 lines by default. A 161-line rewrite of analytics/views.py was rejected and the incident went to a person.'],
  ['File allowlist', 'The patch may touch only files tied to the suspect commit. A drive-by edit in another module does not ship.'],
  ['Secret scrubbing', 'Keys, passwords, tokens, and database URLs are redacted before a prompt is built. 41 redactions on the reference service.'],
  ['Dangerous code', 'os.system, subprocess, eval, exec, DROP, DELETE FROM, and rmtree are refused. A pg_ctl restart was blocked on attempt 3 of INC-0041.'],
  ['Sandbox', 'No host mounts, no network, non-root, CPU and memory capped, 120 second clock, container removed after the run.'],
  ['Retry cap', 'Three attempts, then escalate with every diff and every trace. The loop cannot spin.'],
  ['Human merge gate', 'Locked. Pull requests are drafts. The count of pushes to main on the reference service is zero, and the rule cannot be switched off from the dashboard.'],
]

export default function Security() {
  useTitle('Security')
  return (
    <article>
      <Container className="py-16 lg:py-24">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Guardrails</p>
        <h1 className="mt-4 max-w-[18ch] font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-7xl">
          The model is not allowed to be clever.
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted">
          Every patch is checked before a pull request can exist. A failed rule throws the diff away. The agent retries with the trace, or it hands the incident to a person. Locked rules change in guardrails/evaluator.py, through a reviewed pull request of their own.
        </p>
      </Container>
      <div className="border-y border-line">
        <Container className="grid gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="border-line lg:border-r">
            {rules.map(([title, body], index) => (
              <div key={title} className="border-b border-line px-0 py-6 last:border-b-0 lg:pr-10">
                <p className="font-mono text-[12px] text-faint">0{index + 1}</p>
                <h2 className="mt-2 text-[18px] tracking-[-0.02em]">{title}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
          <div className="py-8 lg:py-10 lg:pl-10">
            <ShotFrame src="/shots/guardrails.png" alt="Guardrails panel with four blocked patches and zero pushes to main" />
            <pre className="mt-4 overflow-x-auto rounded-lg border border-bad/40 bg-panel p-4 font-mono text-[12.5px] leading-relaxed text-bad">
{`blocked · dangerous code
subprocess.run(["pg_ctl", "restart"])

The model tried to restart Postgres
instead of closing the cursor.`}
            </pre>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Stop-the-bleeding is the one permitted write: terminate backends that are idle in a transaction. It is not a license to drop tables, delete rows, or restart the server.
            </p>
          </div>
        </Container>
      </div>
      <Container className="grid gap-8 py-16 lg:grid-cols-3">
        {[
          ['What the audit keeps', 'Every state change, prompt, response, patch, and test result, with a timestamp. Retention follows the plan. Export is JSON, from Professional up.'],
          ['What the sandbox cannot see', 'Production data, host files, and the network. Secrets do not ride along to make the tests “more realistic.”'],
          ['What you still do', 'Read the diff. Decide the merge. The agent’s job ends when the draft exists, or when it has to admit it could not prove a fix.'],
        ].map(([title, body]) => (
          <div key={title}>
            <h2 className="text-[16px] font-medium">{title}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
        <div className="lg:col-span-3">
          <ButtonLink to="/docs/guardrails" variant="ghost">
            Guardrails in the docs
          </ButtonLink>
        </div>
      </Container>
    </article>
  )
}
