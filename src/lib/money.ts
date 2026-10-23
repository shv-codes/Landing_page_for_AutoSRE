export function inr(n: number) {
  const sign = n < 0 ? '−' : ''
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(n)))
  return sign + formatted
}

/** FBIL reference rate published for 23 October 2026: ₹94.9432 per US dollar. */
export const USD_INR = 94.94

/** Annual is twelve monthly payments, then 10% off. */
export const ANNUAL_DISCOUNT = 0.1

export function inrFromUsd(dollars: number) {
  return Math.round(dollars * USD_INR)
}

export function annualUsd(monthlyUsd: number) {
  return Math.round(monthlyUsd * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100
}

export function usd(amount: number) {
  const abs = Math.abs(amount)
  const digits = Number.isInteger(abs) ? 0 : 2
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(abs)
  return (amount < 0 ? '−' : '') + formatted
}

export function usdApprox(n: number) {
  if (n === 0) return '$0'
  const dollars = Math.round(Math.abs(n) / USD_INR)
  return `about $${dollars.toLocaleString('en-US')}`
}

export function compact(n: number) {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const text = Number.isInteger(m) ? String(m) : m.toFixed(1)
    return `${text} million`
  }
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return n.toLocaleString('en-IN')
}

export function num(n: number) {
  return n.toLocaleString('en-IN')
}
