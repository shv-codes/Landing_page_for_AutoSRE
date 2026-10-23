import { useState } from 'react'
import { Link } from 'react-router-dom'
import { shots } from '../content.ts'
import { useStore } from '../lib/store.tsx'
import { ShotFrame } from '../components/story.tsx'
import { Container, useTitle } from '../components/ui.tsx'

export default function Console() {
  useTitle('Console')
  const { account, record } = useStore()
  const [index, setIndex] = useState(0)
  const shot = shots[index]
  const plan = record?.subscription && record.subscription.status !== 'canceled' ? record.subscription.planId : null

  return (
    <div className="bg-black">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Console preview</p>
          <p className="text-[14px] text-muted">
            {account ? `${account.workspace}${plan ? ` · ${plan}` : ''}` : 'Reference deployment'} · screens from the running agent, not a live socket
          </p>
        </div>
        {account ? (
          <Link to="/account" className="text-[13px] text-muted underline underline-offset-4">Back to billing</Link>
        ) : (
          <Link to="/pricing" className="text-[13px] text-ink underline underline-offset-4">Get this workspace</Link>
        )}
      </Container>
      <Container className="pb-16">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {shots.map((item, itemIndex) => (
            <button
              key={item.id}
              onClick={() => setIndex(itemIndex)}
              className={`h-9 shrink-0 rounded-full px-3 text-[13px] ${itemIndex === index ? 'bg-ink text-bg' : 'border border-line text-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <ShotFrame src={shot.src} alt={shot.caption} />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl tracking-[-0.03em]">{shot.title}</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{shot.caption}</p>
          </div>
          <div className="flex gap-2">
            <button className="h-9 rounded-full border border-line px-3 text-[13px]" onClick={() => setIndex((value) => (value - 1 + shots.length) % shots.length)}>Previous</button>
            <button className="h-9 rounded-full border border-line px-3 text-[13px]" onClick={() => setIndex((value) => (value + 1) % shots.length)}>Next</button>
          </div>
        </div>
      </Container>
    </div>
  )
}
