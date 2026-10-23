import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { shots, timeline } from '../content.ts'
import { Dialog } from './ui.tsx'

const ease = [0.22, 1, 0.36, 1] as const

export function ShotFrame({
  src,
  alt,
  chrome = true,
}: {
  src: string
  alt: string
  chrome?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-black shadow-[0_40px_120px_-48px_rgba(0,0,0,0.85)]">
      {chrome && (
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
          <span className="size-1.5 rounded-full bg-white/20" />
          <span className="size-1.5 rounded-full bg-white/20" />
          <span className="size-1.5 rounded-full bg-white/20" />
          <span className="ml-2 font-mono text-[11px] text-faint">console · reference deployment</span>
        </div>
      )}
      <img src={src} alt={alt} className="block w-full" />
    </div>
  )
}

export function IncidentTimeline() {
  return (
    <ol className="relative grid gap-0">
      {timeline.map((item, index) => (
        <li key={item.t} className="grid grid-cols-[88px_16px_1fr] gap-3 sm:grid-cols-[104px_16px_1fr]">
          <p className="pt-0.5 text-right font-mono text-[12px] text-faint">{item.t}</p>
          <div className="relative flex justify-center">
            <span className={`mt-1.5 size-1.5 rounded-full ${index === timeline.length - 1 ? 'bg-good' : 'bg-white/40'}`} />
            {index < timeline.length - 1 && <span className="absolute top-3 h-full w-px bg-line-strong" />}
          </div>
          <div className="pb-6">
            <p className="text-[13px] text-faint">{item.who}</p>
            <p className="mt-0.5 text-[15px] leading-relaxed text-ink">{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const storySteps = [shots[0], shots[1], shots[2], shots[4], shots[5]]

export function StickyStory() {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-story]'))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const index = Number((visible.target as HTMLElement).dataset.story)
        if (!Number.isNaN(index)) setActive(index)
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.2, 0.5, 0.8] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="grid gap-24 lg:gap-0">
        {storySteps.map((shot, index) => (
          <article
            key={shot.id}
            data-story={index}
            className="lg:flex lg:min-h-[70vh] lg:flex-col lg:justify-center"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              0{index + 1} / {shot.label}
            </p>
            <h3 className="mt-3 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">{shot.title}</h3>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">{shot.caption}</p>
          </article>
        ))}
      </div>
      <div className="lg:sticky lg:top-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={storySteps[active].id}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease }}
          >
            <ShotFrame src={storySteps[active].src} alt={storySteps[active].caption} />
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex gap-1.5">
          {storySteps.map((shot, index) => (
            <span key={shot.id} className={`h-0.5 flex-1 ${index === active ? 'bg-ink' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function RunPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!open) return
    setIndex(0)
    setPlaying(!reduced)
  }, [open, reduced])

  useEffect(() => {
    if (!open || !playing) return
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % shots.length)
    }, 3200)
    return () => window.clearTimeout(timer)
  }, [open, playing, index])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % shots.length)
      if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + shots.length) % shots.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const shot = shots[index]
  return (
    <Dialog open={open} onClose={onClose} title="Reference run" wide>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Reference deployment</p>
          <h2 className="mt-1 font-serif text-3xl tracking-[-0.03em]">{shot.title}</h2>
        </div>
        <button className="text-[13px] text-muted" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="mt-4">
        <ShotFrame src={shot.src} alt={shot.caption} />
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-muted">{shot.caption}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {shots.map((item, itemIndex) => (
            <button
              key={item.id}
              aria-label={item.label}
              className={`h-1 w-8 rounded-full ${itemIndex === index ? 'bg-ink' : 'bg-white/20'}`}
              onClick={() => setIndex(itemIndex)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button className="h-9 rounded-full border border-line px-3 text-[13px]" onClick={() => setPlaying((value) => !value)}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            className="h-9 rounded-full border border-line px-3 text-[13px]"
            onClick={() => setIndex((value) => (value + 1) % shots.length)}
          >
            Next
          </button>
        </div>
      </div>
    </Dialog>
  )
}
