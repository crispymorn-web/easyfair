import * as XLSX from 'xlsx'
import { Quote, QuoteItem } from '@/types'
import { SECTION_META } from '@/lib/constants'
import { formatUSD, formatKRW, groupItemsBySection } from '@/lib/utils'

export function exportToExcel(quote: Quote, items: QuoteItem[]): void {
  const wb = XLSX.utils.book_new()
  const ws_data: (string | number)[][] = []

  // 헤더
  ws_data.push(['easyfair — 전시 부스 시공 견적서'])
  ws_data.push([`${quote.event_name} | ${quote.venue_name}, ${quote.city}`])
  ws_data.push([])
  ws_data.push(['항목', '설명', '수량', '단위', '단가(USD)', '금액(USD)', '금액(KRW)', '비고'])

  const groups = groupItemsBySection(items)

  for (const group of groups) {
    ws_data.push([group.meta.label])

    for (const item of group.items) {
      ws_data.push([
        item.no,
        item.description,
        item.quantity,
        item.unit,
        item.unit_price_usd,
        item.amount_usd,
        item.amount_krw,
        item.notes,
      ])
    }

    const subtotalUsd = group.items.reduce((s, i) => s + i.amount_usd, 0)
    const subtotalKrw = group.items.reduce((s, i) => s + i.amount_krw, 0)
    ws_data.push(['', `소계 — ${group.meta.label}`, '', '', '', subtotalUsd, subtotalKrw, ''])
  }

  ws_data.push([])
  ws_data.push([
    '', 'GRAND TOTAL', '', '', '',
    items.reduce((s, i) => s + i.amount_usd, 0),
    items.reduce((s, i) => s + i.amount_krw, 0),
    `환율: 1 USD = ₩${quote.exchange_rate_usd_krw.toLocaleString()}`,
  ])

  ws_data.push([])
  ws_data.push(['참고사항'])
  ws_data.push([`환율 기준일: ${new Date().toLocaleDateString('ko-KR')}`])
  ws_data.push([`견적 유효기간: 발행일로부터 30일`])
  ws_data.push([`부스 규모: ${quote.booth_width}m × ${quote.booth_depth}m = ${quote.booth_sqm}sqm`])

  const ws = XLSX.utils.aoa_to_sheet(ws_data)

  // 컬럼 너비
  ws['!cols'] = [
    { wch: 6 }, { wch: 42 }, { wch: 8 }, { wch: 8 },
    { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 30 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, '견적서')
  XLSX.writeFile(wb, `easyfair_${quote.client_name}_${quote.event_name}.xlsx`)
}
