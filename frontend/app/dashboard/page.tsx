'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { Quote } from '@/types'
import { formatUSD, formatKRW } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setQuotes(data ?? [])
        setLoading(false)
      })
  }, [])

  const totalUsd = quotes.reduce((s, q) => s + q.total_usd, 0)
  const thisMonth = quotes.filter(q =>
    new Date(q.created_at).getMonth() === new Date().getMonth()
  ).length

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">AI 견적 생성 및 관리</p>
        </div>
        <Link href="/quote/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 견적 만들기
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-sm text-gray-500">총 견적</span>
          </div>
          <p className="text-3xl font-bold text-brand-600 font-mono">{quotes.length}</p>
          <p className="text-xs text-gray-400 mt-1">이번 달 {thisMonth}건</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">총 견적 금액</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 font-mono">{formatUSD(totalUsd)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatKRW(totalUsd * 1370)}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">현재 플랜</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">Pro</p>
          <p className="text-xs text-gray-400 mt-1">무제한 견적 가능</p>
        </div>
      </div>

      {/* 견적 목록 */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">최근 견적</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : quotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">아직 견적이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">렌더링을 업로드하면 AI가 자동으로 견적을 만들어드립니다</p>
            <Link href="/quote/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-xs">
              <Plus className="w-3 h-3" /> 첫 견적 만들기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {quotes.map(q => (
              <li key={q.id}>
                <Link href={`/quote/${q.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{q.client_name} — {q.event_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{q.city} · {q.venue_name} · {q.booth_sqm}sqm</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-brand-600 font-mono">{formatUSD(q.total_usd)}</p>
                    <p className="text-xs text-gray-400">{formatKRW(q.total_krw)}</p>
                  </div>
                  <StatusBadge status={q.status} />
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Quote['status'] }) {
  const map = {
    draft:    { label: '초안',  cls: 'bg-amber-100 text-amber-700' },
    complete: { label: '완료',  cls: 'bg-green-100 text-green-700' },
    shared:   { label: '공유됨', cls: 'bg-blue-100 text-blue-700' },
  }
  const { label, cls } = map[status]
  return <span className={`badge text-xs ${cls}`}>{label}</span>
}
