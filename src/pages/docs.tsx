import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { docs } from '../content.ts'
import { Container, useTitle } from '../components/ui.tsx'
import NotFound from './not-found.tsx'

export function DocsIndex() {
  useTitle('Docs')
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter((page) => {
      const blob = `${page.title} ${page.lede} ${page.blocks
        .map((block) => (block.type === 'ul' ? block.items.join(' ') : block.text))
        .join(' ')}`.toLowerCase()
      return blob.includes(q)
    })
  }, [query])

  return (
    <Container className="py-16">
      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-good">Docs</p>
      <h1 className="mt-4 font-serif text-5xl tracking-[-0.035em] sm:text-6xl">How the agent behaves.</h1>
      <label className="mt-8 block max-w-md">
        <span className="sr-only">Search docs</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the docs"
          className="h-11 w-full rounded-lg border border-line-strong bg-panel px-3 text-[15px] outline-none focus:border-white/50"
        />
      </label>
      <div className="mt-8 grid gap-3">
        {results.length === 0 && (
          <p className="text-muted">
            Nothing matches. <Link className="underline underline-offset-4" to="/contact">Ask from the contact form</Link>.
          </p>
        )}
        {results.map((page) => (
          <Link key={page.slug} to={`/docs/${page.slug}`} className="rounded-xl border border-line p-5 hover:bg-white/[0.03]">
            <h2 className="text-[18px] tracking-[-0.02em]">{page.title}</h2>
            <p className="mt-1 text-[14px] text-muted">{page.lede}</p>
          </Link>
        ))}
      </div>
    </Container>
  )
}

export default function DocPage() {
  const { slug } = useParams()
  if (!slug) return <Navigate to="/docs/overview" replace />
  const page = docs.find((item) => item.slug === slug)
  if (!page) return <NotFound />
  return <DocLayout slug={page.slug} title={page.title} lede={page.lede} blocks={page.blocks} />
}

export function DocLayout({
  slug,
  title,
  lede,
  blocks,
  section = 'docs',
}: {
  slug: string
  title: string
  lede: string
  blocks: (typeof docs)[number]['blocks']
  section?: 'docs' | 'legal'
}) {
  useTitle(title)
  const nav = section === 'legal'
    ? [
        ['Terms', '/legal/terms', 'terms'],
        ['Privacy', '/legal/privacy', 'privacy'],
        ['Refunds', '/legal/refunds', 'refunds'],
        ['Acceptable use', '/legal/acceptable-use', 'acceptable-use'],
      ]
    : docs.map((item) => [item.title, `/docs/${item.slug}`, item.slug] as const)
  return (
    <Container className="grid gap-10 py-14 lg:grid-cols-[200px_minmax(0,720px)]">
      <aside className="no-print lg:sticky lg:top-24 lg:self-start">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{section === 'legal' ? 'Legal' : 'Docs'}</p>
        <nav className="mt-3 grid gap-1.5" aria-label={section === 'legal' ? 'Legal' : 'Documentation'}>
          {nav.map(([label, to, id]) => (
            <Link key={id} to={to} className={`text-[14px] ${id === slug ? 'text-ink' : 'text-muted hover:text-ink'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <article>
        <h1 className="font-serif text-5xl tracking-[-0.035em]">{title}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">{lede}</p>
        <div className="mt-8 grid gap-4 text-[15.5px] leading-relaxed text-muted">
          {blocks.map((block, index) => {
            if (block.type === 'h') return <h2 key={index} className="mt-4 text-[20px] tracking-[-0.02em] text-ink">{block.text}</h2>
            if (block.type === 'ul') {
              return (
                <ul key={index} className="grid gap-2 pl-4">
                  {block.items.map((item) => (
                    <li key={item} className="list-disc">{item}</li>
                  ))}
                </ul>
              )
            }
            if (block.type === 'code') {
              return <pre key={index} className="overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-[12.5px] text-ink">{block.text}</pre>
            }
            return <p key={index}>{block.text}</p>
          })}
        </div>
      </article>
    </Container>
  )
}
