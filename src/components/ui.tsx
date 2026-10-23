import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-[1120px] px-5 sm:px-8', className)}>{children}</div>
}

const btn =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium tracking-[-0.011em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40'

export function btnClass(variant: 'primary' | 'ghost' | 'quiet' | 'danger' = 'primary', className = '') {
  if (variant === 'primary') return cx(btn, 'h-10 bg-ink text-bg hover:bg-white', className)
  if (variant === 'ghost') return cx(btn, 'h-10 border border-line-strong bg-transparent text-ink hover:bg-white/5', className)
  if (variant === 'danger') return cx(btn, 'h-10 bg-bad text-bg hover:bg-[#ff8b91]', className)
  return cx(btn, 'h-10 text-muted hover:text-ink', className)
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'quiet' | 'danger' }) {
  return <button className={btnClass(variant, className)} {...props} />
}

export function ButtonLink({
  to,
  variant = 'primary',
  className,
  children,
}: {
  to: string
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger'
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={btnClass(variant, className)}>
      {children}
    </Link>
  )
}

export const controlClass =
  'h-11 w-full rounded-lg border border-line-strong bg-[#0c0d10] px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-white/50'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] text-muted">
        {label}
        {hint && <span className="text-faint">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-[13px] text-bad">{error}</span>}
    </label>
  )
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...props
}: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input className={cx(controlClass, error && 'border-bad', className)} {...props} />
    </Field>
  )
}

export function TextArea({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error}>
      <textarea className={cx(controlClass, 'h-auto py-3 leading-relaxed', error && 'border-bad')} {...props} />
    </Field>
  )
}

export function SelectField({
  label,
  error,
  children,
  ...props
}: { label: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} error={error}>
      <select className={cx(controlClass, error && 'border-bad')} {...props}>
        {children}
      </select>
    </Field>
  )
}

export function Banner({ tone = 'info', children }: { tone?: 'info' | 'good' | 'warn' | 'bad'; children: ReactNode }) {
  const toneClass =
    tone === 'good'
      ? 'border-good/30 bg-good/10 text-good'
      : tone === 'warn'
        ? 'border-warn/30 bg-warn/10 text-warn'
        : tone === 'bad'
          ? 'border-bad/30 bg-bad/10 text-bad'
          : 'border-line-strong bg-white/5 text-muted'
  return <div className={cx('rounded-lg border px-3 py-2.5 text-[13.5px] leading-relaxed', toneClass)}>{children}</div>
}

export function Meter({ label, used, max, suffix = '' }: { label: string; used: number; max: number; suffix?: string }) {
  const pct = max <= 0 ? 0 : Math.min(100, (used / max) * 100)
  const tone = used > max ? 'bg-bad' : pct > 85 ? 'bg-warn' : 'bg-good'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-[13px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-[12px] tabular-nums text-ink">
          {used.toLocaleString('en-IN')} / {max.toLocaleString('en-IN')}
          {suffix}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div className={cx('h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/70" aria-label="Close" onClick={onClose} />
      <div className={cx('relative max-h-[90vh] w-full overflow-y-auto rounded-xl border border-line bg-panel p-5 sm:p-6', wide ? 'max-w-3xl' : 'max-w-lg')}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Mark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.15" opacity="0.75" />
      <circle cx="16" cy="5" r="1.7" fill="#3ecf8e" />
    </svg>
  )
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === 'AutoSRE' ? 'AutoSRE by Zero-Ops' : `${title} · AutoSRE`
  }, [title])
}
