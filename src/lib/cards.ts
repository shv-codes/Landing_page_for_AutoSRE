import type { CardBrand, PaymentMethod } from '../types.ts'

export function digits(value: string) {
  return value.replace(/\D/g, '')
}

export function brandOf(pan: string): CardBrand {
  const s = digits(pan)
  if (/^3[47]/.test(s)) return 'amex'
  if (/^4/.test(s)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(s)) return 'mastercard'
  if (/^(60|65|81|82|508)/.test(s)) return 'rupay'
  return 'card'
}

export function brandLabel(brand: CardBrand) {
  if (brand === 'visa') return 'Visa'
  if (brand === 'mastercard') return 'Mastercard'
  if (brand === 'amex') return 'American Express'
  if (brand === 'rupay') return 'RuPay'
  return 'Card'
}

export function formatPan(raw: string) {
  const brand = brandOf(raw)
  const max = brand === 'amex' ? 15 : 16
  const d = digits(raw).slice(0, max)
  if (brand === 'amex') {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ')
  }
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function formatExp(raw: string) {
  const d = digits(raw).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function luhn(pan: string) {
  const s = digits(pan)
  if (!/^\d+$/.test(s) || s.length < 13) return false
  let sum = 0
  let alt = false
  for (let i = s.length - 1; i >= 0; i--) {
    let n = Number(s[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function readCard(pan: string, exp: string, cvv: string, holder: string):
  | { ok: true; payment: PaymentMethod }
  | { ok: false; message: string } {
  const brand = brandOf(pan)
  const d = digits(pan)
  const expected = brand === 'amex' ? 15 : 16
  if (d.length !== expected || !luhn(d)) {
    return { ok: false, message: 'Enter a valid card number. 4242 4242 4242 4242 passes the check.' }
  }
  const match = /^(\d{2})\/(\d{2})$/.exec(exp)
  if (!match) return { ok: false, message: 'Enter the expiry as MM/YY.' }
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return { ok: false, message: 'That month is not on a card.' }
  const now = new Date()
  const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)
  if (expired) return { ok: false, message: 'This card is expired.' }
  const cvvDigits = digits(cvv)
  const cvvLen = brand === 'amex' ? 4 : 3
  if (cvvDigits.length !== cvvLen) {
    return { ok: false, message: brand === 'amex' ? 'American Express uses a 4-digit code.' : 'Enter the 3-digit security code.' }
  }
  if (holder.trim().length < 2) return { ok: false, message: 'Enter the name printed on the card.' }
  return {
    ok: true,
    payment: {
      type: 'card',
      brand,
      last4: d.slice(-4),
      exp,
      holder: holder.trim(),
      label: `${brandLabel(brand)} ···· ${d.slice(-4)}`,
    },
  }
}

export function validVpa(value: string) {
  return /^[a-z0-9._-]{2,}@[a-z]{2,}$/i.test(value.trim())
}
