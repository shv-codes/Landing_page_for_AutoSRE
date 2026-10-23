export type PlanId = 'student' | 'professional' | 'business'
export type Cycle = 'monthly' | 'annual'
export type SubStatus = 'active' | 'past_due' | 'canceled'
export type ModelMode = 'live' | 'cached' | 'replay'
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'card'

export interface PaymentMethod {
  type: 'card' | 'upi' | 'netbanking'
  brand?: CardBrand
  last4?: string
  exp?: string
  holder?: string
  vpa?: string
  bank?: string
  label: string
}

export interface BillingAddress {
  line1: string
  line2: string
  city: string
  region: string
  postal: string
  country: string
  gstin: string
}

export interface Subscription {
  planId: PlanId
  cycle: Cycle
  status: SubStatus
  startedAt: string
  periodStart: string
  periodEnd: string
  cancelAtPeriodEnd: boolean
  cancelReason?: string
  pending: { planId: PlanId; cycle: Cycle } | null
}

export interface InvoiceLine {
  label: string
  amount: number
}

export interface Invoice {
  id: string
  number: string
  createdAt: string
  description: string
  lines: InvoiceLine[]
  taxable: number
  tax: number
  taxLabel: string
  total: number
  status: 'paid' | 'scheduled'
  kind: 'new' | 'renewal' | 'upgrade' | 'downgrade' | 'addon'
  paidWith: string
}

export interface Activity {
  id: string
  at: string
  label: string
  detail: string
  incidents: number
  tokens: number
}

export interface Seat {
  id: string
  name: string
  role: 'Reviewer' | 'Member'
}

export interface Guardrails {
  diffLimit: number
  retryCap: number
  killIdleSeconds: number
  alertThreshold: number
}

export interface WorkspaceRecord {
  payment: PaymentMethod | null
  billing: BillingAddress | null
  subscription: Subscription | null
  invoices: Invoice[]
  activity: Activity[]
  allowance: { extraIncidents: number; extraTokens: number }
  usage: { incidents: number; tokens: number }
  credit: number
  guardrails: Guardrails
  modelMode: ModelMode
  seats: Seat[]
  runSeq: number
  studentId: string | null
}

export interface Account {
  id: string
  name: string
  email: string
  password: string
  org: string
  workspace: string
  createdAt: string
}

export interface Note {
  id: string
  at: string
  kind: 'contact' | 'demo' | 'status'
  email: string
  title: string
  body: string
}

export interface DB {
  accounts: Account[]
  sessionEmail: string | null
  records: Record<string, WorkspaceRecord>
  inbox: Note[]
}

export type ActionResult =
  | { ok: true; invoiceId?: string }
  | { ok: false; message: string }
