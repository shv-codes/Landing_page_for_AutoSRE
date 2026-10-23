import { annualUsd, inrFromUsd } from './lib/money.ts'
import type { PlanId } from './types.ts'

export interface PlanBounds {
  diff: [number, number]
  retry: [number, number]
  kill: [number, number]
  threshold: [number, number]
}

export interface Plan {
  id: PlanId
  name: string
  kicker: string
  summary: string
  /** Monthly list price in USD. Student is 0: one month free, then it stops. */
  usdMonthly: number
  monthly: number
  annual: number
  seats: number
  services: number
  incidents: number
  tokens: number
  retentionDays: number
  overageIncident: number
  overagePer10k: number
  support: string
  sandbox: string
  bounds: PlanBounds
  includes: string[]
}

export const plans: Plan[] = [
  {
    id: 'student',
    name: 'Student',
    kicker: 'One service you are on the hook for',
    summary: 'One month free with a student ID and a university email. It ends when the month ends.',
    usdMonthly: 0,
    monthly: 0,
    annual: 0,
    seats: 1,
    services: 1,
    incidents: 30,
    tokens: 200_000,
    retentionDays: 14,
    overageIncident: 150,
    overagePer10k: 6,
    support: 'Docs and the audit log',
    sandbox: '1 CPU · 512 MB · 90s · shared queue',
    bounds: { diff: [50, 50], retry: [3, 3], kill: [30, 30], threshold: [90, 90] },
    includes: [
      '1 seat and 1 service',
      '30 live incidents a month',
      '200,000 model tokens',
      'Sandbox verification and a 3-attempt retry',
      'Replay and cached mode, which do not spend tokens',
      'Guardrails on, at the default limits',
      'Audit log kept 14 days',
      'Ends after one month. It does not renew.',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    kicker: 'The plan a working team actually runs',
    summary: 'For a product that pages someone. 250 verified fixes of this incident class, with the model allowance included.',
    usdMonthly: 49,
    monthly: inrFromUsd(49),
    annual: inrFromUsd(annualUsd(49)),
    seats: 5,
    services: 10,
    incidents: 250,
    tokens: 3_000_000,
    retentionDays: 90,
    overageIncident: 100,
    overagePer10k: 2.5,
    support: 'Email, next business day',
    sandbox: '1 CPU · 512 MB · 120s',
    bounds: { diff: [20, 200], retry: [1, 5], kill: [10, 120], threshold: [70, 95] },
    includes: [
      '5 seats and 10 services',
      '250 live incidents a month',
      '3 million model tokens',
      'Slack message with the pull request link',
      'Tunable diff cap, retry cap, and alert threshold',
      'JSON export of the audit, kept 90 days',
      'GitHub, PostgreSQL, and Docker',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    kicker: 'Several services, one shared record',
    summary: 'Several services and a shared record. Same bracket as tools that only investigate. This one also opens the draft.',
    usdMonthly: 99,
    monthly: inrFromUsd(99),
    annual: inrFromUsd(annualUsd(99)),
    seats: 25,
    services: 50,
    incidents: 2000,
    tokens: 15_000_000,
    retentionDays: 365,
    overageIncident: 60,
    overagePer10k: 1.8,
    support: 'Shared channel, 4-hour response',
    sandbox: '2 CPU · 1 GB · 180s',
    bounds: { diff: [20, 400], retry: [1, 8], kill: [5, 180], threshold: [50, 98] },
    includes: [
      '25 seats and 50 services',
      '2,000 live incidents a month',
      '15 million model tokens',
      'Priority model route and a fallback provider',
      'Custom dangerous-code patterns',
      'Audit log kept 365 days',
      'Named on-call lead. SSO and self-hosting are Enterprise.',
    ],
  },
]

export const packs = [
  { id: 'tok-500', kind: 'tokens' as const, amount: 500_000, price: 600, name: '500k tokens' },
  { id: 'tok-2m', kind: 'tokens' as const, amount: 2_000_000, price: 2000, name: '2 million tokens' },
  { id: 'tok-10m', kind: 'tokens' as const, amount: 10_000_000, price: 8000, name: '10 million tokens' },
  { id: 'inc-50', kind: 'incidents' as const, amount: 50, price: 4500, name: '50 incidents' },
  { id: 'inc-200', kind: 'incidents' as const, amount: 200, price: 16000, name: '200 incidents' },
]

export const enterprise = {
  name: 'Enterprise',
  kicker: 'Self-hosted. Your model key.',
  summary: 'For a team that will not send code or prompts to our cloud. Priced with you, the way Resolve and Traversal sell, once the deployment and the coverage are real.',
  includes: [
    'Self-hosted agent beside the services you run',
    'Bring your own LLM key. No token meter from us.',
    'SSO',
    'Audit export on your retention',
    'Coverage written down as new incident types ship',
  ],
}

export const banks = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
]

export const countries = [
  'India',
  'United States',
  'United Kingdom',
  'Singapore',
  'United Arab Emirates',
  'Germany',
  'Other',
]

export const shots = [
  {
    id: 'incidents',
    src: '/shots/incidents.png',
    label: 'Incidents',
    title: 'The queue',
    caption: 'Fourteen incidents on the reference service. Twelve closed without a person in the diff. Two went to the on-call.',
  },
  {
    id: 'live',
    src: '/shots/live.png',
    label: 'Live run',
    title: 'While it is still working',
    caption: 'INC-0043. Six sessions killed, the first patch failed its test, and the second is in the sandbox. The page updates every two seconds.',
  },
  {
    id: 'resolved',
    src: '/shots/resolved.png',
    label: 'Resolved',
    title: 'The draft, with the proof beside it',
    caption: 'INC-0042. Connections 98 to 31. Fourteen tests passed. The pull request waited for the person who owns the file.',
  },
  {
    id: 'runs',
    src: '/shots/runs.png',
    label: 'Agent runs',
    title: 'Every attempt, timed',
    caption: 'Alert to pull request across the last fourteen runs, against a three-minute line. Live, replay, and cached are labeled.',
  },
  {
    id: 'guardrails',
    src: '/shots/guardrails.png',
    label: 'Guardrails',
    title: 'What a patch has to clear',
    caption: 'Seven rules. Thirty-one patches checked. Four blocked. Nothing has been pushed to main.',
  },
  {
    id: 'audit',
    src: '/shots/audit.png',
    label: 'Audit log',
    title: 'The prompt and the response',
    caption: 'Attempt two, 812 tokens, confidence 0.92. The database URL was redacted before it reached the model.',
  },
  {
    id: 'settings',
    src: '/shots/settings.png',
    label: 'Settings',
    title: 'What the operator can change',
    caption: 'Live, cached, or replay. Retry cap. The threshold. Integrations read from the environment, never printed back.',
  },
]

export const phases = ['Alert', 'Diagnose', 'Correlate', 'Patch', 'Prove', 'Deliver'] as const

export const loop = [
  {
    id: 'Alert',
    title: 'Alert',
    text: 'A monitor posts when active connections cross 90% of max_connections. Duplicate alerts for an incident already running are ignored.',
  },
  {
    id: 'Diagnose',
    title: 'Diagnose',
    text: 'The agent reads pg_stat_activity. It groups sessions by state, and keeps the ones idle in a transaction long enough to matter, with the last query.',
  },
  {
    id: 'Correlate',
    title: 'Correlate',
    text: 'The query text and the stack are matched to recent commits. The output is a file, a line range, and a confidence score. Not a hunch in a chat window.',
  },
  {
    id: 'Patch',
    title: 'Patch',
    text: 'The model returns a unified diff, a regression test, and a risk rating. The patch is applied to a copy of the repo. The working tree is left alone.',
  },
  {
    id: 'Prove',
    title: 'Prove',
    text: 'pytest and manage.py check run in a container with no network, no host mounts, and a clock. The container is destroyed when the run ends. A failure comes back as the next prompt.',
  },
  {
    id: 'Deliver',
    title: 'Deliver',
    text: 'A branch, a commit, a draft pull request, and a post-mortem. Main is not a destination. Someone reviews the diff and merges it, or they do not.',
  },
]

export const timeline = [
  { t: '03:12:00', who: 'pg-monitor', text: 'Critical. pg_connections at 98 of 100 on victim-service.' },
  { t: '03:12:03', who: 'AutoSRE', text: 'Terminated 5 sessions idle in transaction. The pool could breathe again.' },
  { t: '03:12:23', who: 'AutoSRE', text: 'Traced the leak to commit 728a817, analytics/views.py, the user activity report.' },
  { t: '03:12:41', who: 'Shivansh', text: 'Acknowledged from Slack. The agent kept going.' },
  { t: '03:12:58', who: 'Sandbox', text: 'Patch 1 failed. AssertionError: 1 cursor(s) opened but not closed.' },
  { t: '03:13:41', who: 'Sandbox', text: 'Patch 2 passed. 14 tests, manage.py check clean, six guardrail checks green.' },
  { t: '03:15:02', who: 'GitHub', text: 'Draft pull request #42 opened with the post-mortem. Main was not touched.' },
]

export const homeFaq = [
  {
    q: 'Does it merge?',
    a: 'No. The pull request is opened as a draft. The human merge gate is locked on every plan, including Business. In the reference deployment the count of pushes to main is zero.',
  },
  {
    q: 'What if the first patch is wrong?',
    a: 'The sandbox failure, including the assertion, goes back into the next prompt. The cap is three attempts. After that the incident is escalated with the diffs, the traces, and the timeline. It does not keep guessing.',
  },
  {
    q: 'Which incidents does this version handle?',
    a: 'One class today: connection exhaustion from unclosed cursors on Django and Postgres, the sessions that sit idle in transaction. Kubernetes OOM, DNS, and permission failures are on the roadmap. The price is for a verified fix of the class that ships. It is meant to move as coverage grows, not to bill for incidents the agent cannot close.',
  },
  {
    q: 'What does the model actually see?',
    a: 'The diagnosis, the suspect diff, and on a retry the previous patch plus the sandbox trace. Secrets are scrubbed first. In the reference month that was 41 redactions. Keys are read from the environment and are not written into the audit body.',
  },
  {
    q: 'Is 1 minute 58 seconds a promise?',
    a: 'It is the median on the reference service, from alert to pull request, over the last 30 days. The target the team set was three minutes. A cold sandbox or a slow model can miss it. The audit log shows the actual minutes for each run.',
  },
]

export const pricingFaq = [
  {
    q: 'What am I paying for, besides tokens?',
    a: 'The subscription is the workspace: seats, services, the sandbox, the audit retention, and the right to run live incidents up to the allowance. Tokens are the live model calls that write a patch. Replay and cached mode are included and do not draw the allowance down.',
  },
  {
    q: 'What happens when the allowance is gone?',
    a: 'Live patching pauses. Diagnosis, correlation, and the audit log stay available, and cached replay still runs. Buy a pack or move up a plan and live patching continues. A pack is cheaper per token than overage.',
  },
  {
    q: 'What does the student month include?',
    a: 'One month, free, with a student ID and a university email. No card. The allowance is 30 incidents, the guardrails stay locked, and the month does not renew. After that, Professional is $49 a month.',
  },
  {
    q: 'Is it worth paying for if it only fixes one type of bug?',
    a: 'Today it closes one class: connection exhaustion from unclosed cursors on Django and Postgres. That is the incident the reference deployment proved, from 45 minutes by hand to a median of 1 minute 58 seconds. More classes are on the roadmap, including Kubernetes OOM, DNS, and permission failures. They are not in the price yet. The charge is per verified fix of the class that ships, and it is meant to scale as coverage grows.',
  },
  {
    q: 'How is tax handled?',
    a: 'Billing addresses in India are charged GST at 18% on the taxable amount, after any credit. Other countries are taxed at 0% in this checkout. The invoice shows the split. This demo does not remit tax and does not invent a GSTIN.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Moving up charges the difference for the rest of the period, or the new period if you switch to annual. Moving down is scheduled for the renewal date. You keep the plan you already paid for until then. Unused credit stays on the workspace and applies to the next invoice.',
  },
  {
    q: 'How do I cancel?',
    a: 'From the workspace, with a reason. Access runs through the end of the period you already paid. There is no partial-month cash refund. Annual plans stop renewing; they are not cashed out mid-year. Token packs already applied to the allowance stay applied.',
  },
  {
    q: 'Is my card charged here?',
    a: 'No. The checkout validates the card, UPI id, or netbanking OTP on this page and stores only a label, such as the last four digits. Nothing is sent to Razorpay or a bank. Production billing is designed to hand this same step to Razorpay.',
  },
]

export const matrix: { label: string; values: [string, string, string, string] }[] = [
  { label: 'Seats', values: ['1', '5', '25', 'Named'] },
  { label: 'Services', values: ['1', '10', '50', 'Named'] },
  { label: 'Live incidents / month', values: ['30', '250', '2,000', 'Named'] },
  { label: 'Model', values: ['200k tokens', '3 million', '15 million', 'Your key'] },
  { label: 'Where it runs', values: ['Our cloud', 'Our cloud', 'Our cloud', 'Your cluster'] },
  { label: 'Sandbox', values: ['Shared · 90s', '512 MB · 120s', '1 GB · 180s', 'Yours'] },
  { label: 'Guardrail tuning', values: ['Locked defaults', 'Diff, retry, threshold', 'Plus custom patterns', 'Reviewed with you'] },
  { label: 'Slack', values: ['—', 'PR link', 'PR link and on-call', 'Yes'] },
  { label: 'Audit retention', values: ['14 days', '90 days', '365 days', 'Yours'] },
  { label: 'Audit export', values: ['—', 'JSON', 'JSON', 'Yes'] },
  { label: 'SSO', values: ['—', '—', '—', 'Yes'] },
  { label: 'Support', values: ['Docs', 'Next business day', '4-hour channel', 'Contracted'] },
  { label: 'Merge to main', values: ['Never', 'Never', 'Never', 'Never'] },
]

export interface DocPage {
  slug: string
  title: string
  lede: string
  blocks: Array<{ type: 'p' | 'h' | 'code'; text: string } | { type: 'ul'; items: string[] }>
}

export const docs: DocPage[] = [
  {
    slug: 'overview',
    title: 'Overview',
    lede: 'AutoSRE sits beside a service. It does not replace the database, the pager, or the person who merges.',
    blocks: [
      { type: 'p', text: 'When a connection leak pins PostgreSQL, someone usually has to correlate pg_stat_activity, the logs, and git history, then write a patch while the service is down. A chatbot will suggest the close. It will not run the test, and it will not open the pull request.' },
      { type: 'p', text: 'AutoSRE runs that loop. Alert, diagnosis, commit correlation, a patch, a sandbox, and a draft pull request with a post-mortem. The reference incident is a Django app that opens a cursor in analytics/views.py and does not close it.' },
      { type: 'h', text: 'What this site is' },
      { type: 'p', text: 'This site is the commercial front: plans, the model allowance, invoices, and a console preview taken from the reference deployment. The agent itself is the Python stack your team runs next to the service. Connecting GitHub or Postgres is part of that deployment, not a button on this page.' },
      { type: 'h', text: 'What ships in this release' },
      { type: 'ul', items: [
        'One incident class: connection exhaustion from sessions stuck idle in transaction.',
        'Stop-the-bleeding via pg_terminate_backend, then a root-cause patch.',
        'A sandbox with no network and a hard timeout.',
        'A draft pull request. Never a push to main.',
        'An audit log of the prompt, the response, the patch, and the test result.',
      ] },
    ],
  },
  {
    slug: 'loop',
    title: 'The loop',
    lede: 'Six stages. One terminal failure. A person at the end.',
    blocks: [
      { type: 'p', text: 'ALERT_RECEIVED leads to DIAGNOSING, CORRELATING, PATCHING, then TESTING_IN_SANDBOX. A pass opens the pull request and resolves the incident. A fail returns to patching while attempts remain. When the attempts are gone, the state is ESCALATED_TO_HUMAN.' },
      { type: 'h', text: 'What each stage writes down' },
      { type: 'ul', items: [
        'Alert: source, metric, value, timestamp.',
        'Telemetry: connection counts, session states, the top query.',
        'Suspect commit: SHA, author, files, diff, confidence.',
        'Patch: unified diff, regression test, attempt number, risk.',
        'Sandbox: exit code, stdout, stderr, stack trace.',
        'Delivery: branch name, pull request URL, post-mortem.',
      ] },
      { type: 'p', text: 'The post-mortem covers summary, timeline, root cause, impact, the fix, the verification, and what would prevent a repeat. It is the body of the pull request, not a document someone writes the next morning.' },
      { type: 'code', text: 'autosre/fix-<incident_id>  →  draft PR  →  main, only if a person merges' },
    ],
  },
  {
    slug: 'guardrails',
    title: 'Guardrails',
    lede: 'A patch that fails a rule is thrown away. The agent retries, or it pages a person.',
    blocks: [
      { type: 'ul', items: [
        'Diff size. Default 50 lines. Professional can raise it. Student cannot.',
        'File allowlist. Only files tied to the suspect commit.',
        'Secret scrubbing. Keys, passwords, and tokens are redacted before any prompt.',
        'Dangerous code. Rejects os.system, subprocess, eval, exec, DROP, DELETE FROM, and rmtree.',
        'Sandbox isolation. No host mounts, no network, non-root, CPU and memory capped, container removed after the run.',
        'Retry cap. Default 3, then escalate.',
        'Human merge gate. Locked. It is not a setting.',
      ] },
      { type: 'p', text: 'On the reference service a patch that tried to restart Postgres with subprocess.run(["pg_ctl", "restart"]) was blocked. So was a diff that rewrote an entire view and blew past the line cap. Both incidents went to a person with the evidence attached.' },
      { type: 'p', text: 'Locked rules are changed in guardrails/evaluator.py through a reviewed pull request, not from a dashboard toggle. The limits you can change (diff cap, retry cap, idle timeout, alert threshold) are on the workspace controls, inside the bounds of your plan.' },
    ],
  },
  {
    slug: 'models',
    title: 'Models and usage',
    lede: 'The subscription is the tool. Tokens are the live calls that write the diff.',
    blocks: [
      { type: 'p', text: 'The reference model is Gemini 1.5 Flash through Vertex AI. The provider sits behind an interface so it can be swapped. When the API is unreachable, cached responses for the known incident are served and the console says so. Replay plays a recorded run and does not call the model at all.' },
      { type: 'h', text: 'What spends the allowance' },
      { type: 'ul', items: [
        'A live patch attempt. The reference retry on INC-0042 was 812 tokens.',
        'Overage, if you have allowed it, once the included tokens or incidents are gone.',
        'Packs, which add to the allowance and cost less per token than overage.',
      ] },
      { type: 'h', text: 'What does not' },
      { type: 'ul', items: [
        'Cached mode.',
        'Replay of a recorded run.',
        'Reading the audit log, the queue, or the guardrail panel.',
      ] },
      { type: 'p', text: 'When the allowance is exhausted, live patching pauses. The rest of the loop’s record stays readable. That pause is deliberate. An uncapped model bill is not a feature.' },
    ],
  },
  {
    slug: 'sandbox',
    title: 'Sandbox',
    lede: 'The patch has to survive the tests in a container that cannot see production.',
    blocks: [
      { type: 'p', text: 'Each attempt starts a fresh container from a cached image and destroys it afterwards. The reference limits are 1 CPU, 512 MB, and 120 seconds, with no network and no host mounts. Business raises that to 2 CPU, 1 GB, and 180 seconds. Student runs on a shared queue with a 90-second clock.' },
      { type: 'p', text: 'Inside, the agent runs pytest and python manage.py check. A non-zero exit, a timeout, or a guardrail failure is recorded with stdout and stderr. The trace is the input to the next attempt. Three failures escalate.' },
      { type: 'code', text: 'docker · python:3.11-slim · 1 CPU · 512 MB · no network' },
    ],
  },
  {
    slug: 'billing',
    title: 'Billing',
    lede: 'Monthly or annual. Tool allowance and model allowance are both on the invoice.',
    blocks: [
      { type: 'p', text: 'Student is one month free with a student ID and a university email. Checkout does not ask for a card, and the month does not renew. Professional is $49 a month and Business is $99. Annual is twelve times the monthly price, then 10% off. The invoice is in INR at the FBIL rate published for 23 October 2026, ₹94.94 per dollar. India billing addresses add GST at 18% after credit. A card, UPI id, or netbanking authorization is collected only when the amount due is above zero. On this demo the payment is validated locally. The production handoff is Razorpay. We store a label (last four digits, UPI id, or bank name), never the full card number. Enterprise (self-hosted, your model key, SSO, audit export) is a conversation, not a checkout.' },
      { type: 'h', text: 'Changes' },
      { type: 'ul', items: [
        'Upgrade: charged now, prorated for the days left, or a new period if you move onto annual.',
        'Downgrade: starts at the next renewal. No charge today.',
        'Credit: if a change leaves money on the workspace, it applies to the next invoice.',
        'Cancel: access until period end. No mid-cycle cash refund.',
        'Packs: one-time, applied immediately, not refunded once the allowance moves.',
      ] },
      { type: 'p', text: 'From the workspace you can pay a renewal, swap the payment method, read every invoice, and move the clock forward to see a renewal without waiting a month. That last control is marked as a demo tool.' },
    ],
  },
  {
    slug: 'integrations',
    title: 'Integrations',
    lede: 'The agent talks to a short list. Each one has a narrow permission.',
    blocks: [
      { type: 'ul', items: [
        'GitHub. Token scope is the repo, draft pull requests only. The token is an environment variable.',
        'PostgreSQL. Read pg_stat_activity. The only write is pg_terminate_backend on idle-in-transaction sessions, and only when stop-the-bleeding is on.',
        'Docker. A local socket to start and remove the sandbox. The container is non-root.',
        'Gemini on Vertex, or a cached fallback. The key is not shown in the settings screen.',
        'Slack. Optional. Posts the incident update and the pull request link to a channel.',
      ] },
      { type: 'p', text: 'The reference settings screen shows those connections as already present, because that deployment has them. This marketing site does not open an OAuth window that goes nowhere. When you deploy the agent, the keys live in the environment, which is also where the audit log refuses to print them.' },
    ],
  },
]

export const legal: DocPage[] = [
  {
    slug: 'terms',
    title: 'Terms',
    lede: 'The short version of what a workspace is allowed to do.',
    blocks: [
      { type: 'p', text: 'AutoSRE is sold as a monthly or annual workspace by Zero-Ops, Chandigarh. You get the seat, service, incident, and token allowances printed on the plan you chose. You do not get a right to merge to main, to disable the human gate, or to uncapped model spend.' },
      { type: 'p', text: 'You will only point the agent at repositories, databases, and clusters you are allowed to operate. The patch is applied to a copy and tested in a sandbox. Opening a draft pull request is the furthest the agent goes.' },
      { type: 'p', text: 'This website is a working commercial demo. Accounts, invoices, and payment labels are stored in your browser. A production deployment would put the same records on our side and collect payment through Razorpay. The product behavior the pages describe is the behavior specified for AutoSRE.' },
      { type: 'p', text: 'We can suspend a workspace that tries to route the agent at systems the customer does not own, or that attempts to strip the merge gate. The acceptable use page is part of these terms.' },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    lede: 'What this demo keeps, and what a production workspace would keep.',
    blocks: [
      { type: 'h', text: 'On this site' },
      { type: 'p', text: 'The workspace lives in localStorage on this browser. That includes your name, email, organization, the password you chose, billing address, invoices, usage, and a payment label. The full card number and the CVV are not stored. They are checked in memory and dropped. Nothing on this site is sent to a server.' },
      { type: 'p', text: 'You can erase the browser record from the workspace overview. That removes the account, the invoices, and the notes saved from the contact and demo forms.' },
      { type: 'h', text: 'In the agent' },
      { type: 'p', text: 'The audit log stores state changes, prompts, model responses, patches, and test results, with timestamps. Secrets are redacted before a prompt is built. API keys are read from the environment and are not written into the log. Sandbox containers do not receive the production database.' },
      { type: 'p', text: 'Retention follows the plan: 14 days on Student, 90 on Professional, 365 on Business. Export to JSON is included from Professional upward.' },
    ],
  },
  {
    slug: 'refunds',
    title: 'Refunds',
    lede: 'Cancel whenever you want. The period you paid for still runs.',
    blocks: [
      { type: 'ul', items: [
        'Cancel from the workspace. Live patching continues until the period ends, then stops.',
        'Monthly plans are not refunded mid-month. You already have the days.',
        'Annual plans are prepaid. Cancelling stops the renewal. We do not cash out unused months.',
        'If a plan change leaves a credit balance, it applies to a future invoice on the same workspace. It is not paid out to a card.',
        'Token and incident packs are one-time. Once they are added to the allowance they are not refunded.',
        'This demo never captures a real charge, so there is nothing to reverse at a bank.',
      ] },
      { type: 'p', text: 'If a renewal fails, the workspace goes past due. Live patching pauses. Replay still opens. Paying the renewal restores the plan. Erasing the browser record is not a billing dispute; it only deletes the local demo.' },
    ],
  },
  {
    slug: 'acceptable-use',
    title: 'Acceptable use',
    lede: 'The agent is allowed to fix a service you operate. That is the whole list.',
    blocks: [
      { type: 'ul', items: [
        'Do not point it at a repository, cluster, or database you do not have authority to change.',
        'Do not try to disable the human merge gate, the secret scrubber, or the sandbox.',
        'Do not ask the workflow to run destructive SQL outside pg_terminate_backend on idle sessions.',
        'Do not use the model allowance to generate anything other than a patch and a test for an incident you are handling.',
        'Do not upload secrets into a prompt by bypassing the scrubber.',
        'The free month is for the person named on the student ID. It is not a discounted seat for a company, and it does not renew.',
      ] },
      { type: 'p', text: 'The dangerous-code check exists because a model, under pressure, will suggest restarting the database. That suggestion is not a fix. The guardrail is there so the pull request never contains it.' },
    ],
  },
]

export const changelog = [
  {
    version: '1.0',
    date: '17 Oct 2026',
    title: 'The loop closes',
    points: [
      'Alert to draft pull request on connection exhaustion.',
      'Stop-the-bleeding, then the root-cause patch.',
      'Post-mortem on the pull request. Median on the reference service: 1m 58s.',
    ],
  },
  {
    version: '0.9',
    date: '14 Oct 2026',
    title: 'Guardrails start refusing work',
    points: [
      'Diff cap, file allowlist, dangerous-code check.',
      'A 161-line rewrite and a pg_ctl restart were both blocked.',
      'Secret scrubbing before the prompt is sent.',
    ],
  },
  {
    version: '0.8',
    date: '11 Oct 2026',
    title: 'The sandbox tells the model it was wrong',
    points: [
      'Failed pytest output is appended to the next attempt.',
      'Three failures escalate with the evidence attached.',
      'The container is removed after every run.',
    ],
  },
]

export const footerNav = [
  {
    title: 'Product',
    links: [
      ['How it works', '/product'],
      ['Console', '/console'],
      ['Guardrails', '/security'],
      ['Changelog', '/changelog'],
      ['Status', '/status'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    title: 'Use',
    links: [
      ['Overview', '/docs/overview'],
      ['The loop', '/docs/loop'],
      ['Models and usage', '/docs/models'],
      ['Sandbox', '/docs/sandbox'],
      ['Billing', '/docs/billing'],
      ['Book a walkthrough', '/demo'],
    ],
  },
  {
    title: 'Workspace',
    links: [
      ['Sign in', '/login'],
      ['Create a workspace', '/signup'],
      ['Billing', '/account'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Terms', '/legal/terms'],
      ['Privacy', '/legal/privacy'],
      ['Refunds', '/legal/refunds'],
      ['Acceptable use', '/legal/acceptable-use'],
    ],
  },
]
