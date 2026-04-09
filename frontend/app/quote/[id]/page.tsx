'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, Download, Save, ArrowLeft } from 'lucide-react'
import { useQuoteStore } from '@/hooks/useQuoteStore'
import { formatUSD, formatKRW, groupItemsBySection, cn } from '@/lib/utils'
import { exportToExcel } from '@/lib/exportExcel'
import type { Quote, QuoteItem, QuoteSection } from '@/types'
import { SECTION_META } from '@/lib/constants'

export default function QuoteEditorPage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const { items, updateItem, removeItem, addItem, setDraft, getTotalUsd, getTotalKrw, usdKrw } = useQuoteStore()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // 견적 로드
  useEffect(() => {
    // draft 모드: Zustand store 데이터 사용 (DB 저장 생략)
    if (typeof window !== 'undefined') {
      const isDraft = new URLSearchParams(window.location.search).get('draft') === 'true'
      if (isDraft) {
        const storeDraft = useQuoteStore.getState().draft
        if (storeDraft) setQuote(storeDraft as Quote)
        return
      }
    }

    fetch(`/api/quotes/${params.id}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        setQuote(data)
        setDraft(data)
      })
  }, [params.id])

  const groups = groupItemsBySection(items)
  const totalUsd = getTotalUsd()
  const totalKrw = getTotalKrw()

  // 저장
  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/quotes/${params.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  // Excel 다운로드
  const handleExcelDownload = () => {
    if (!quote) return
    exportToExcel(
      { ...quote, exchange_rate_usd_krw: usdKrw, total_usd: totalUsd, total_krw: totalKrw },
      items
    )
  }

  // 서버 Excel 다운로드 (openpyxl 전문 포맷)
  const handleServerExcel = () => {
    window.open(`/api/v1/export/${params.id}/xlsx`, '_blank')
  }

  return (
    <div className="px-6 py-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">
            {quote?.client_name || '견적 편집'}
            {quote && <span className="font-normal text-gray-400"> — {quote.event_name}</span>}
          </h1>
          {quote && (
            <p className="text-xs text-gray-400 mt-0.5">
              {quote.venue_name} · {quote.booth_sqm}sqm
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving}
            className="btn-outline flex items-center gap-2 text-xs">
            <Save className="w-3.5 h-3.5" />
            {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
          </button>
          <button onClick={handleServerExcel}
            className="btn-primary flex items-center gap-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            Excel 다운로드
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 items-start">
        {/* 편집 테이블 */}
        <div className="col-span-2 card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-brand-600 text-white">
                <th className="px-3 py-2.5 text-left font-semibold w-10">No.</th>
                <th className="px-3 py-2.5 text-left font-semibold">항목명</th>
                <th className="px-3 py-2.5 text-center font-semibold w-16">수량</th>
                <th className="px-3 py-2.5 text-center font-semibold w-12">단위</th>
                <th className="px-3 py-2.5 text-right font-semibold w-24">단가(USD)</th>
                <th className="px-3 py-2.5 text-right font-semibold w-24">금액(USD)</th>
                <th className="px-3 py-2.5 text-center font-semibold w-8"></th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ section, meta, items: sItems }) => (
                <>
                  {/* 섹션 헤더 */}
                  <tr key={`hdr-${section}`}>
                    <td colSpan={7}
                      style={{ background: meta.color }}
                      className="px-3 py-1.5 text-white font-semibold text-xs">
                      {meta.label}
                    </td>
                  </tr>
                  {/* 아이템 */}
                  {sItems.map((item, idx) => (
                    <tr key={item.id}
                      className={cn('border-b border-gray-50 group', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <td className="px-3 py-2 text-gray-400">{item.no}</td>
                      <td className="px-3 py-2">
                        <input value={item.description}
                          onChange={e => updateItem(item.id, { description: e.target.value })}
                          className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-brand-400 rounded px-1 py-0.5 outline-none text-gray-800" />
                      </td>
                      <td className="px-1 py-2">
                        <input type="number" value={item.quantity}
                          onChange={e => updateItem(item.id, { quantity: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border border-transparent hover:border-gray-200 focus:border-brand-400 rounded px-1 py-0.5 outline-none" />
                      </td>
                      <td className="px-1 py-2 text-center text-gray-400">{item.unit}</td>
                      <td className="px-1 py-2">
                        <input type="number" value={item.unit_price_usd}
                          onChange={e => updateItem(item.id, { unit_price_usd: Number(e.target.value) })}
                          className="w-full text-right bg-transparent border border-transparent hover:border-gray-200 focus:border-brand-400 rounded px-1 py-0.5 outline-none font-mono" />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">
                        {formatUSD(item.amount_usd)}
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* 소계 */}
                  <tr key={`sub-${section}`}
                    style={{ background: meta.bg }}>
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-semibold"
                      style={{ color: meta.color }}>
                      소계
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs font-bold font-mono"
                      style={{ color: meta.color }}>
                      {formatUSD(sItems.reduce((s, i) => s + i.amount_usd, 0))}
                    </td>
                    <td />
                  </tr>
                  {/* 항목 추가 버튼 */}
                  <tr key={`add-${section}`}>
                    <td colSpan={7} className="px-3 py-1">
                      <button onClick={() => addItem(section as QuoteSection)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors">
                        <Plus className="w-3 h-3" /> 항목 추가
                      </button>
                    </td>
                  </tr>
                </>
              ))}

              {/* 합계 행 */}
              <tr className="bg-brand-700 text-white">
                <td colSpan={5} className="px-3 py-3 text-right font-bold text-sm">GRAND TOTAL</td>
                <td className="px-3 py-3 text-right font-bold font-mono text-sm">{formatUSD(totalUsd)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* 요약 패널 */}
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-700 p-5 text-white">
            <p className="text-xs text-brand-200 font-medium mb-3">
              {quote?.client_name} · {quote?.event_name}
            </p>
            {groups.map(({ section, meta, items: si }) => (
              <div key={section} className="flex justify-between text-xs py-1.5 border-b border-brand-600/50 last:border-0">
                <span className="text-brand-200">{meta.label.split('.')[1]?.trim()}</span>
                <span className="font-mono font-medium">{formatUSD(si.reduce((s,i)=>s+i.amount_usd,0))}</span>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-brand-600">
              <div className="text-xs text-brand-200 mb-1">TOTAL (USD)</div>
              <div className="text-2xl font-bold font-mono text-amber-300">{formatUSD(totalUsd)}</div>
              <div className="text-sm text-brand-300 font-mono mt-0.5">{formatKRW(totalKrw)}</div>
              <div className="text-xs text-brand-400 mt-1">1 USD = ₩{usdKrw.toLocaleString()}</div>
            </div>
          </div>

          <div className="card p-4 space-y-2">
            <button onClick={handleServerExcel}
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
              <Download className="w-4 h-4" /> Excel 다운로드 (전문 포맷)
            </button>
            <button onClick={handleExcelDownload}
              className="w-full btn-outline flex items-center justify-center gap-2 text-sm py-2">
              <Download className="w-4 h-4" /> Excel 빠른 출력
            </button>
          </div>

          {/* 전시장 규정 알림 */}
          {quote?.venue_id === 'lacc' && (
            <div className="card p-4 border-l-4 border-amber-400 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ LACC 주의사항</p>
              <p className="text-xs text-amber-600">Union Labor 의무 · EAC 사전 신청 필수 · Drayage 별도</p>
            </div>
          )}
          {quote?.venue_id === 'impact_bkk' && (
            <div className="card p-4 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-xs font-semibold text-blue-700 mb-1">🇹🇭 IMPACT Bangkok</p>
              <p className="text-xs text-blue-600">Thailand VAT 7% 현지 서비스에 적용 · 반입 D-2</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
