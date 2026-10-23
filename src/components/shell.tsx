import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { footerNav } from '../content.ts'
import { useStore } from '../lib/store.tsx'
import { Container, Mark, cx } from './ui.tsx'

const links = [
  ['Product', '/product'],
  ['Pricing', '/pricing'],
  ['Security', '/security'],
  ['Docs', '/docs/overview'],
  ['Console', '/console'],
]

function NavItem({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx('text-[14px] transition-colors', isActive ? 'text-ink' : 'text-muted hover:text-ink')
      }
    >
      {children}
    </NavLink>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { account, logout } = useStore()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    setMenu(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-ink">
            <Mark className="size-[22px]" />
            <span className="text-[15px] font-medium tracking-[-0.02em]">Zero-Ops</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {links.map(([label, to]) => (
              <NavItem key={to} to={to}>
                {label}
              </NavItem>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {account ? (
              <div className="relative">
                <button
                  className="flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[13px] text-ink hover:bg-white/5"
                  onClick={() => setMenu((value) => !value)}
                  aria-expanded={menu}
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-medium text-bg">
                    {account.name.slice(0, 1).toUpperCase()}
                  </span>
                  {account.workspace}
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-panel p-1.5 shadow-2xl">
                    <Link className="block rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-white/5 hover:text-ink" to="/account">
                      Workspace
                    </Link>
                    <Link className="block rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-white/5 hover:text-ink" to="/account/usage">
                      Usage
                    </Link>
                    <Link className="block rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-white/5 hover:text-ink" to="/console">
                      Console
                    </Link>
                    <button
                      className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-white/5 hover:text-ink"
                      onClick={logout}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="px-3 text-[14px] text-muted hover:text-ink">
                  Sign in
                </Link>
                <Link to="/pricing" className="inline-flex h-9 items-center rounded-full bg-ink px-3.5 text-[14px] font-medium text-bg hover:bg-white">
                  Get started
                </Link>
              </>
            )}
          </div>
          <button className="h-9 rounded-full border border-line px-3 text-[13px] lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            Menu
          </button>
        </Container>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 bg-bg lg:hidden">
          <Container className="flex h-14 items-center justify-between">
            <span className="text-[15px] font-medium">Zero-Ops</span>
            <button className="text-[14px] text-muted" onClick={() => setOpen(false)}>
              Close
            </button>
          </Container>
          <Container className="grid gap-5 pt-6">
            {links.map(([label, to]) => (
              <NavItem key={to} to={to} onClick={() => setOpen(false)}>
                <span className="font-serif text-4xl text-ink">{label}</span>
              </NavItem>
            ))}
            <div className="mt-4 flex gap-3">
              {account ? (
                <>
                  <Link to="/account" className="text-muted" onClick={() => setOpen(false)}>
                    Workspace
                  </Link>
                  <button className="text-muted" onClick={logout}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-muted" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                  <Link to="/pricing" className="text-ink" onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
      <div id="content" className="flex-1">
        {children}
      </div>
      <footer className="no-print border-t border-line">
        <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Mark className="size-5" />
              <span className="text-[15px] font-medium">Zero-Ops</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              AutoSRE is the agent. Zero-Ops is the company. The pull request stays a draft until a person merges it.
            </p>
            <p className="mt-4 text-[13px] text-faint">Chandigarh, India</p>
          </div>
          {footerNav.map((column) => (
            <div key={column.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{column.title}</p>
              <ul className="mt-3 grid gap-2">
                {column.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="text-[14px] text-muted hover:text-ink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
        <Container className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[12px] text-faint">
          <p>© {new Date().getFullYear()} Zero-Ops. Reference metrics are from the service in the screenshots.</p>
          <p>Draft pull requests only.</p>
        </Container>
      </footer>
    </div>
  )
}
