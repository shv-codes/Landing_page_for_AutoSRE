import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { changelog, legal } from '../content.ts'
import { formatWhen, refCode } from '../lib/format.ts'
import { useStore } from '../lib/store.tsx'
import { Banner, Button, Container, TextArea, TextField, useTitle } from '../components/ui.tsx'
import { DocLayout } from './docs.tsx'
import NotFound from './not-found.tsx'

export function LegalPage() {
  const { slug } = useParams()
  const page = legal.find((item) => item.slug === slug)
  if (!page) return <NotFound />
  return <DocLayout slug={page.slug} title={page.title} lede={page.lede} blocks={page.blocks} section="legal" />
}

export function Changelog() {
  useTitle('Changelog')
  return (
    <Container className="py-16">
      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Changelog</p>
      <h1 className="mt-4 font-serif text-5xl tracking-[-0.035em]">What has actually shipped.</h1>
      <div className="mt-12 grid gap-12">
        {changelog.map((entry) => (
          <article key={entry.version} className="grid gap-3 border-t border-line pt-8 sm:grid-cols-[160px_1fr]">
            <div>
              <p className="font-mono text-[13px] text-ink">{entry.version}</p>
              <p className="text-[13px] text-faint">{entry.date}</p>
            </div>
            <div>
              <h2 className="text-2xl tracking-[-0.02em]">{entry.title}</h2>
              <ul className="mt-3 grid gap-2 text-[15px] text-muted">
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </Container>
  )
}

const systems = [
  ['Alert intake', 'Operational'],
  ['Agent loop', 'Operational'],
  ['Sandbox fleet', 'Operational'],
  ['Model gateway', 'Operational'],
  ['Audit log', 'Operational'],
  ['Billing on this site', 'Demo'],
]

export function Status() {
  useTitle('Status')
  const { addNote, db } = useStore()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState('')
  const [error, setError] = useState('')
  const watchers = db.inbox.filter((note) => note.kind === 'status')

  return (
    <Container className="py-16">
      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Status</p>
      <h1 className="mt-4 font-serif text-5xl tracking-[-0.035em]">All reference systems are up.</h1>
      <p className="mt-4 max-w-xl text-muted">
        This page is the status surface for the reference deployment and for billing on this demo. It does not poll a public cluster.
      </p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {systems.map(([name, state]) => (
          <li key={name} className="flex items-center justify-between py-4">
            <span>{name}</span>
            <span className={`font-mono text-[12px] ${state === 'Operational' ? 'text-good' : 'text-warn'}`}>{state}</span>
          </li>
        ))}
      </ul>
      <form
        className="mt-10 max-w-md"
        onSubmit={(event) => {
          event.preventDefault()
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Enter an email address.')
            return
          }
          const note = addNote({
            kind: 'status',
            email: email.trim().toLowerCase(),
            title: 'Status watch',
            body: `${email.trim()} asked to be told if the reference status changes.`,
          })
          setDone(note.id)
          setError('')
        }}
      >
        <TextField label="Email for status notes" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
        {error && <p className="mt-2 text-[13px] text-bad">{error}</p>}
        <Button className="mt-4" type="submit">Save on this browser</Button>
        {done && <p className="mt-3 text-[13px] text-muted">Saved. This preview does not send mail. The note is listed below.</p>}
      </form>
      {watchers.length > 0 && (
        <ul className="mt-8 grid max-w-md gap-2 text-[13px] text-muted">
          {watchers.map((note) => (
            <li key={note.id}>{note.email} · {formatWhen(note.at)}</li>
          ))}
        </ul>
      )}
    </Container>
  )
}

export function Contact() {
  useTitle('Contact')
  const { addNote, db } = useStore()
  const [form, setForm] = useState({ name: '', email: '', topic: 'Sales', message: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState<{ id: string; title: string } | null>(null)
  const notes = db.inbox.filter((note) => note.kind === 'contact')

  return (
    <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Contact</p>
        <h1 className="mt-4 font-serif text-5xl tracking-[-0.035em]">Write it down. It stays on this browser.</h1>
        <p className="mt-4 max-w-lg text-muted">Sales, support, security, or a student exception. There is no mailbox behind this form in the demo, so the note is saved locally and listed here.</p>
        {sent ? (
          <div className="mt-8">
            <Banner tone="good">Saved as {sent.title}. You can send another, or read it in the list.</Banner>
            <Button className="mt-4" variant="ghost" onClick={() => setSent(null)}>Send another</Button>
          </div>
        ) : (
          <form
            className="mt-8 grid max-w-lg gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (form.name.trim().length < 2) return setError('Enter your name.')
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a real email address.')
              if (form.message.trim().length < 12) return setError('Give enough detail that a person could answer it.')
              const code = refCode('ZO-N')
              addNote({
                kind: 'contact',
                email: form.email.trim().toLowerCase(),
                title: code,
                body: `${form.name} · ${form.topic}\n${form.message.trim()}`,
              })
              setSent({ id: code, title: code })
              setError('')
              setForm({ name: '', email: '', topic: 'Sales', message: '' })
            }}
          >
            <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <label className="block text-[13px] text-muted">
              Topic
              <select className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-[#0c0d10] px-3 text-[15px] text-ink" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}>
                {['Sales', 'Support', 'Security', 'Student'].map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </select>
            </label>
            <TextArea label="Message" rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
            {error && <p className="text-[13px] text-bad">{error}</p>}
            <Button type="submit">Save the note</Button>
          </form>
        )}
      </div>
      <aside>
        <h2 className="text-[14px] text-faint">Notes on this browser</h2>
        <div className="mt-4 grid gap-3">
          {notes.length === 0 && <p className="text-[14px] text-muted">None yet.</p>}
          {notes.map((note) => (
            <article key={note.id} className="rounded-xl border border-line p-4">
              <p className="font-mono text-[12px] text-faint">{note.title} · {formatWhen(note.at)}</p>
              <p className="mt-2 whitespace-pre-wrap text-[14px] text-muted">{note.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-faint">
          Security reports can also start from the <Link className="underline underline-offset-4" to="/security">guardrails page</Link>.
        </p>
      </aside>
    </Container>
  )
}

export function Demo() {
  useTitle('Walkthrough')
  const [params] = useSearchParams()
  const enterprise = params.get('plan') === 'enterprise'
  const { addNote, db } = useStore()
  const [form, setForm] = useState({ name: '', email: '', company: '', role: 'On-call', services: '3', window: 'Morning IST', note: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const bookings = db.inbox.filter((note) => note.kind === 'demo')

  return (
    <Container className="grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Walkthrough</p>
        <h1 className="mt-4 font-serif text-5xl tracking-[-0.035em]">{enterprise ? 'Enterprise. Contact us.' : 'Twenty-five minutes on a real incident.'}</h1>
        <p className="mt-4 max-w-xl text-muted">
          {enterprise
            ? 'Self-hosted, your own LLM key, SSO, and audit export. There is no public price. Tell us the cluster and the incident classes you want covered. The note is saved on this browser. Nobody is emailed by the demo.'
            : 'We replay INC-0042, then look at your service count and which plan actually fits. The booking is saved on this browser. Nobody is emailed by the demo.'}
        </p>
        {sent ? (
          <div className="mt-8 rounded-xl border border-line p-6">
            <p className="font-mono text-[12px] text-good">{sent}</p>
            <h2 className="mt-2 font-serif text-3xl">Held for a 25-minute walkthrough.</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {form.name || 'You'} · {form.window}. Bring the service that pages you, not a slide. If the load is past 25 seats or 50 services, this is the right room for it.
            </p>
            <Button className="mt-5" variant="ghost" onClick={() => setSent(null)}>Book another</Button>
          </div>
        ) : (
          <form
            className="mt-8 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (form.name.trim().length < 2) return setError('Enter your name.')
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a work or university email.')
              if (form.company.trim().length < 2) return setError('Enter the company or the project.')
              const code = refCode('ZO-D')
              addNote({
                kind: 'demo',
                email: form.email.trim().toLowerCase(),
                title: code,
                body: `${enterprise ? 'Enterprise. ' : ''}${form.name}, ${form.role} at ${form.company}. ${form.services} services. ${form.window}. ${form.note}`.trim(),
              })
              setSent(code)
              setError('')
            }}
          >
            <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="Company or project" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            <label className="block text-[13px] text-muted">
              Role
              <select className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-[#0c0d10] px-3 text-ink" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {['On-call', 'Developer', 'Engineering manager', 'Student', 'Founder'].map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <TextField label="Services to watch" value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })} />
            <label className="block text-[13px] text-muted">
              Window
              <select className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-[#0c0d10] px-3 text-ink" value={form.window} onChange={(event) => setForm({ ...form, window: event.target.value })}>
                {['Morning IST', 'Afternoon IST', 'Evening IST'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2">
              <TextArea label="What pages you" rows={4} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </div>
            {error && <p className="text-[13px] text-bad sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit">Hold the walkthrough</Button>
            </div>
          </form>
        )}
      </div>
      <aside className="lg:pt-28">
        <h2 className="text-[14px] text-faint">Bookings on this browser</h2>
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 && <p className="text-[14px] text-muted">None yet.</p>}
          {bookings.map((note) => (
            <article key={note.id} className="rounded-xl border border-line p-4">
              <p className="font-mono text-[12px] text-good">{note.title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{note.body}</p>
              <p className="mt-2 text-[12px] text-faint">{formatWhen(note.at)}</p>
            </article>
          ))}
        </div>
      </aside>
    </Container>
  )
}
