import { Link } from 'react-router-dom'
import { Container, useTitle } from '../components/ui.tsx'

export default function NotFound() {
  useTitle('Not found')
  return (
    <Container className="py-24">
      <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-faint">404</p>
      <h1 className="mt-3 font-serif text-6xl tracking-[-0.04em]">This page is not on the loop.</h1>
      <p className="mt-4 max-w-md text-muted">The address does not match a plan, a doc, or a workspace. The rest of the site is intact.</p>
      <div className="mt-8 flex gap-4 text-[14px]">
        <Link to="/" className="underline underline-offset-4">Home</Link>
        <Link to="/pricing" className="underline underline-offset-4">Pricing</Link>
        <Link to="/docs/overview" className="underline underline-offset-4">Docs</Link>
        <Link to="/contact" className="underline underline-offset-4">Contact</Link>
      </div>
    </Container>
  )
}
