import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { QuoteItem, QuoteSection } from '@/types'
import { SECTION_META, VENUE_COST_FACTORS, DEFAULT_EXCHANGE_RATES } from './constants'

// ── Tailwind class merge ────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Number formatting ────────────────────────────────────────────────────
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
  }).format(amount)
}

// ── Quote calculations ────────────────────────────────────────────────────
export function calcItemAmount(item: Partial<QuoteItem>): number {
  return (item.quantity ?? 0) * (item.unit_price_usd ?? 0)
}

export function calcQuoteTotals(items: QuoteItem[], usdKrw: number) {
  const totalUsd = items.reduce((sum, i) => sum + i.amount_usd, 0)
  const totalKrw = Math.round(totalUsd * usdKrw)

  const bySection = Object.keys(SECTION_META).reduce((acc, sec) => {
    const secItems = items.filter(i => i.section === sec)
    acc[sec as QuoteSection] = secItems.reduce((s, i) => s + i.amount_usd, 0)
    return acc
  }, {} as Record<QuoteSection, number>)

  return { totalUsd, totalKrw, bySection }
}

// ── Local cost adjustment ──────────────────────────────────────────────────
export function applyVenueFactor(baseUsd: number, venueId: string): number {
  const factor = VENUE_COST_FACTORS[venueId] ?? VENUE_COST_FACTORS['default']
  return Math.round(baseUsd * factor)
}

// ── File → base64 ─────────────────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // "data:image/png;base64,XXXX" → "XXXX"
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Exchange rate fetch ────────────────────────────────────────────────────
export async function fetchExchangeRates() {
  try {
    const res = await fetch('/api/exchange-rate', { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('fetch failed')
    return await res.json()
  } catch {
    return DEFAULT_EXCHANGE_RATES
  }
}

// ── Section grouping ──────────────────────────────────────────────────────
export function groupItemsBySection(items: QuoteItem[]) {
  return (Object.keys(SECTION_META) as QuoteSection[]).map(section => ({
    section,
    meta: SECTION_META[section],
    items: items.filter(i => i.section === section),
  })).filter(g => g.items.length > 0)
}

// ── ID generation ─────────────────────────────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID()
}
