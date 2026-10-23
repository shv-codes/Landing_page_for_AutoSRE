import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isStudentEmail } from '../lib/billing.ts'
import { safeNext } from '../lib/format.ts'
import { useStore } from '../lib/store.tsx'
import { Banner, Button, Container, TextField, useTitle } from '../components/ui.tsx'

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function Login() {
  useTitle('Sign in')
  const { login } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <Container className="mx-auto max-w-[440px] py-20">
      <h1 className="font-serif text-5xl tracking-[-0.035em]">Sign in</h1>
      <p className="mt-3 text-[14px] text-muted">The workspace was created in this browser. There is no remote account behind it.</p>
      <form
        className="mt-8 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          const result = login(email, password)
          if (!result.ok) {
            setError(result.message)
            return
          }
          navigate(next)
        }}
      >
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <Banner tone="bad">{error}</Banner>}
        <Button type="submit">Continue</Button>
      </form>
      <p className="mt-6 text-[14px] text-muted">
        <Link className="text-ink underline underline-offset-4" to={`/reset?next=${encodeURIComponent(next)}`}>Forgot the password</Link>
        <span> · </span>
        <Link className="text-ink underline underline-offset-4" to={`/signup?next=${encodeURIComponent(next)}`}>Create a workspace</Link>
      </p>
    </Container>
  )
}

export function Signup() {
  useTitle('Create a workspace')
  const { signup } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [form, setForm] = useState({ name: '', email: '', password: '', org: '' })
  const [error, setError] = useState('')

  return (
    <Container className="mx-auto max-w-[440px] py-20">
      <h1 className="font-serif text-5xl tracking-[-0.035em]">Create a workspace</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Saved in this browser, including the password, so you can sign back in. Use a university email and a student ID for the free month.
      </p>
      <form
        className="mt-8 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (form.name.trim().length < 2) return setError('Enter your name.')
          if (!emailOk(form.email)) return setError('Enter an email address.')
          if (form.password.length < 8) return setError('Use at least 8 characters.')
          if (form.org.trim().length < 2) return setError('Name the organization or the project.')
          const result = signup(form)
          if (!result.ok) return setError(result.message)
          navigate(next)
        }}
      >
        <TextField label="Your name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        {form.email.includes('@') && (
          <p className="text-[12.5px] text-faint">
            {isStudentEmail(form.email) ? 'This address can take Student.' : 'This address cannot take Student. Professional is open to it.'}
          </p>
        )}
        <TextField label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} hint="8+" />
        <TextField label="Organization or project" value={form.org} onChange={(event) => setForm({ ...form, org: event.target.value })} />
        {error && <Banner tone="bad">{error}</Banner>}
        <Button type="submit">Create workspace</Button>
      </form>
      <p className="mt-6 text-[14px] text-muted">
        Already have one? <Link className="text-ink underline underline-offset-4" to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
      </p>
    </Container>
  )
}

export function Reset() {
  useTitle('Reset password')
  const { resetPassword } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <Container className="mx-auto max-w-[440px] py-20">
      <h1 className="font-serif text-5xl tracking-[-0.035em]">Reset the password</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        The account lives in this browser, so the reset happens here. It does not send an email.
      </p>
      <form
        className="mt-8 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          const result = resetPassword(email, password)
          if (!result.ok) return setError(result.message)
          navigate(`/login?next=${encodeURIComponent(next)}`)
        }}
      >
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <Banner tone="bad">{error}</Banner>}
        <Button type="submit">Save and sign in</Button>
      </form>
    </Container>
  )
}
