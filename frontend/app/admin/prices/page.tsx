'use client'
import { useEffect, useState, useCallback } from 'react'
import { PriceCatalogItem, QuoteSection } from '@/types'
import { SECTION_META } from '@/lib/constants'
import {
  Plus, Save, RefreshCw, X, CheckCircle2,
  ToggleLeft, ToggleRight
} from 'lucide-react'

const SECTIONS = Object.keys(SECTION_META) as QuoteSection[]
const EMPTY_ITEM: Partial<PriceCatalogItem> = {
  section: 'STRUCTURE',
  item_key: '',
  label_ko: '',
  label_en: '',
  unit: 'sqm',
  unit_price_usd: 0,
  price_type: 'base',
  keywords: [],
  active: true,
  sort_order: 0,
  notes: '',
  venue_id: null,
}

type EditState = Record<string, Partial<PriceCatalogItem>>

export default function AdminPricesPage() {
  const [items, setItems] = useState<PriceCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<EditState>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<QuoteSection>('STRUCTURE')
  const [showNew, setShowNew] = useState(false)
  const [newItem, setNewItem] = useState<Partial<PriceCatalogItem>>({ ...EMPTY_ITEM })
  const [showInactive, setShowInactive] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const loadItems = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/prices')
    const json = await res.json()
    if (json.data) setItems(json.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const sectionItems = items.filter(i =>
    i.section === activeSection && (showInactive || i.active)
  )

  const edit = (id: string, field: keyof PriceCatalogItem, value: unknown) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const getValue = (item: PriceCatalogItem, field: keyof PriceCatalogItem) => {
    if (edits[item.id]?.[field] !== undefined) return edits[item.id][field]
    return item[field]
  }

  const saveItem = async (item: PriceCatalogItem) => {
    if (!edits[item.id]) return
    setSaving(s => ({ ...s, [item.id]: true }))
    const res = await fetch(`/api/admin/prices/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edits[item.id]),
    })
    const json = await res.json()
    setSaving(s => ({ ...s, [item.id]: false }))
    if (json.data) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...json.data } : i))
      setEdits(prev => { const n = { ...prev }; delete n[item.id]; return n })
      showToast('저장 완료')
    } else {
      showToast('저장 실패: ' + json.error)
    }
  }

  const toggleActive = async (item: PriceCatalogItem) => {
    const newActive = !item.active
    const res = await fetch(`/api/admin/prices/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: newActive }),
    })
    const json = await res.json()
    if (json.data) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: newActive } : i))
      showToast(newActive ? '항목 활성화됨' : '항목 비활성화됨')
    }
  }

  const createItem = async () => {
    if (!newItem.item_key || !newItem.label_ko) {
      showToast('item_key 와 한국어 이름을 입력해주세요')
      return
    }
    const res = await fetch('/api/admin/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, venue_id: null }),
    })
    const json = await res.json()
    if (json.data) {
      setItems(prev => [...prev, json.data])
      setNewItem({ ...EMPTY_ITEM })
      setShowNew(false)
      setActiveSection(json.data.section)
      showToast('새 항목 추가 완료')
    } else {
      showToast('추가 실패: ' + json.error)
    }
  }

  const sectionCount = (s: QuoteSection) =>
    items.filter(i => i.section === s && i.active).length

  return (
    <div className="px-8 py-8 max-w-7xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-brand-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent-400" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">단가표 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">전시장별 / 섹션별 견적 단가를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showInactive ? 'bg-gray-200 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {showInactive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            비활성 포함
          </button>
          <button onClick={loadItems} className="btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3">
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
          <button onClick={() => setShowNew(v => !v)} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> 항목 추가
          </button>
        </div>
      </div>

      {/* 섹션 탭 */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === s
                ? 'bg-brand-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-600 hover:text-brand-700'
            }`}
          >
            {SECTION_META[s].label.replace(/^\d+\.\s*/, '')}
            <span className={`ml-1.5 ${activeSection === s ? 'text-accent-400' : 'text-gray-400'}`}>
              {sectionCount(s)}
            </span>
          </button>
        ))}
      </div>

      {/* 신규 항목 폼 */}
      {showNew && (
        <div className="card p-5 mb-4 border-2 border-brand-600 bg-green-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-800">새 단가 항목 추가</h3>
            <button onClick={() => setShowNew(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="label">섹션</label>
              <select className="input text-xs" value={newItem.section}
                onChange={e => setNewItem(p => ({ ...p, section: e.target.value as QuoteSection }))}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">item_key</label>
              <input className="input text-xs" placeholder="wall_panel_sqm" value={newItem.item_key ?? ''}
                onChange={e => setNewItem(p => ({ ...p, item_key: e.target.value }))} />
            </div>
            <div>
              <label className="label">한국어명</label>
              <input className="input text-xs" placeholder="벽 패널" value={newItem.label_ko ?? ''}
                onChange={e => setNewItem(p => ({ ...p, label_ko: e.target.value }))} />
            </div>
            <div>
              <label className="label">English</label>
              <input className="input text-xs" placeholder="Wall Panel" value={newItem.label_en ?? ''}
                onChange={e => setNewItem(p => ({ ...p, label_en: e.target.value }))} />
            </div>
            <div>
              <label className="label">단위</label>
              <input className="input text-xs" placeholder="sqm" value={newItem.unit ?? ''}
                onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} />
            </div>
            <div>
              <label className="label">기준단가 (USD)</label>
              <input className="input text-xs" type="number" value={newItem.unit_price_usd ?? 0}
                onChange={e => setNewItem(p => ({ ...p, unit_price_usd: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">가격 유형</label>
              <select className="input text-xs" value={newItem.price_type}
                onChange={e => setNewItem(p => ({ ...p, price_type: e.target.value as 'base' | 'absolute' }))}>
                <option value="base">base (factor 적용)</option>
                <option value="absolute">absolute (고정)</option>
              </select>
            </div>
            <div>
              <label className="label">정렬 순서</label>
              <input className="input text-xs" type="number" value={newItem.sort_order ?? 0}
                onChange={e => setNewItem(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-3">
              <label className="label">키워드 (쉼표 구분)</label>
              <input className="input text-xs" placeholder="wall,벽,panel"
                value={newItem.keywords?.join(',') ?? ''}
                onChange={e => setNewItem(p => ({ ...p, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) }))} />
            </div>
            <div className="flex items-end">
              <button onClick={createItem} className="btn-primary text-xs w-full flex items-center justify-center gap-1.5 py-2">
                <Plus className="w-3.5 h-3.5" /> 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 단가 테이블 */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
          </div>
        ) : sectionItems.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">이 섹션에 단가 항목이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">item_key</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">한국어명</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">English</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">단위</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">기준단가 (USD)</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">유형</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">키워드</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">순서</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">상태</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">저장</th>
                </tr>
              </thead>
              <tbody>
                {sectionItems.map(item => {
                  const isDirty = !!edits[item.id]
                  const isSaving = saving[item.id]
                  return (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!item.active ? 'opacity-50' : ''} ${isDirty ? 'bg-yellow-50/40' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{item.item_key}</td>
                      <td className="px-4 py-2.5">
                        <input className="input text-xs py-1 px-2 w-28"
                          value={getValue(item, 'label_ko') as string}
                          onChange={e => edit(item.id, 'label_ko', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input className="input text-xs py-1 px-2 w-32"
                          value={getValue(item, 'label_en') as string}
                          onChange={e => edit(item.id, 'label_en', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input className="input text-xs py-1 px-2 w-14"
                          value={getValue(item, 'unit') as string}
                          onChange={e => edit(item.id, 'unit', e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <input className="input text-xs py-1 px-2 text-right w-20" type="number"
                          value={getValue(item, 'unit_price_usd') as number}
                          onChange={e => edit(item.id, 'unit_price_usd', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <select className="input text-xs py-1 px-2"
                          value={getValue(item, 'price_type') as string}
                          onChange={e => edit(item.id, 'price_type', e.target.value)}>
                          <option value="base">base</option>
                          <option value="absolute">absolute</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input className="input text-xs py-1 px-2 w-52"
                          value={(getValue(item, 'keywords') as string[]).join(', ')}
                          onChange={e => edit(item.id, 'keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <input className="input text-xs py-1 px-2 w-12 text-center" type="number"
                          value={getValue(item, 'sort_order') as number}
                          onChange={e => edit(item.id, 'sort_order', parseInt(e.target.value) || 0)} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => toggleActive(item)} className="inline-flex items-center gap-1">
                          {item.active
                            ? <ToggleRight className="w-5 h-5 text-brand-600" />
                            : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                          <span className={`text-xs ${item.active ? 'text-brand-700' : 'text-gray-400'}`}>
                            {item.active ? '활성' : '비활성'}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isDirty ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={() => setEdits(prev => { const n = { ...prev }; delete n[item.id]; return n })}
                              className="text-gray-400 hover:text-gray-600 p-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => saveItem(item)} disabled={isSaving}
                              className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1">
                              {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              저장
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="mt-6 card p-4 border border-blue-100 bg-blue-50">
        <p className="text-xs font-semibold text-blue-800 mb-2">사용 안내</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>price_type = base</strong>: 전시장의 local_cost_factor 를 곱해 최종 단가 산출 (LA=1.0 기준)</li>
          <li><strong>price_type = absolute</strong>: factor 무시, 입력 단가 그대로 적용</li>
          <li><strong>키워드</strong>: AI 추출 description 과 매핑됩니다. 정확할수록 자동 견적 정확도가 높아집니다</li>
          <li><strong>venue_id = null</strong>: 전체 전시장 기본값. 전시장별 재정의는 venue_id 를 지정하세요</li>
        </ul>
      </div>
    </div>
  )
}
