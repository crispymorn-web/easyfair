import { create } from 'zustand'
import { Quote, QuoteItem, QuoteCreateInput, AIAnalysisResult } from '@/types'
import { generateId, calcItemAmount } from '@/lib/utils'
import { SECTION_META } from '@/lib/constants'

interface QuoteStore {
  // 현재 작업 중인 견적
  draft: Partial<Quote> | null
  items: QuoteItem[]
  usdKrw: number
  isAnalyzing: boolean
  analysisResult: AIAnalysisResult | null

  // Step 추적
  currentStep: 1 | 2 | 3 | 4

  // Actions
  setDraft: (data: Partial<Quote>) => void
  setStep: (step: 1 | 2 | 3 | 4) => void
  setUsdKrw: (rate: number) => void
  setAnalyzing: (v: boolean) => void
  setAnalysisResult: (r: AIAnalysisResult) => void

  // 아이템 CRUD
  applyAIItems: (aiItems: AIAnalysisResult['items'], venueId: string) => void
  addItem: (section: keyof typeof SECTION_META) => void
  updateItem: (id: string, patch: Partial<QuoteItem>) => void
  removeItem: (id: string) => void

  // 계산
  getTotalUsd: () => number
  getTotalKrw: () => number

  reset: () => void
}

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  draft: null,
  items: [],
  usdKrw: 1370,
  isAnalyzing: false,
  analysisResult: null,
  currentStep: 1,

  setDraft: (data) => set(s => ({ draft: { ...s.draft, ...data } })),
  setStep: (step) => set({ currentStep: step }),
  setUsdKrw: (rate) => set({ usdKrw: rate }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysisResult: (r) => set({ analysisResult: r }),

  applyAIItems: (aiItems, venueId) => {
    const { usdKrw } = get()
    // venue factor는 서버에서 적용됐다고 가정, 여기선 그대로 사용
    const items: QuoteItem[] = aiItems.map((ai, idx) => {
      const unitPrice = 0 // 단가는 서버 price DB에서 매핑 (추후 구현)
      return {
        id: generateId(),
        no: `AI.${idx + 1}`,
        description: ai.description,
        quantity: ai.quantity,
        unit: ai.unit,
        unit_price_usd: unitPrice,
        amount_usd: ai.quantity * unitPrice,
        amount_krw: Math.round(ai.quantity * unitPrice * usdKrw),
        notes: ai.notes,
        ai_confidence: ai.confidence,
        section: ai.section,
      }
    })
    set({ items })
  },

  addItem: (section) => {
    const { usdKrw } = get()
    const sectionItems = get().items.filter(i => i.section === section)
    const prefix = Object.keys(SECTION_META).indexOf(section) + 1
    const newItem: QuoteItem = {
      id: generateId(),
      no: `${prefix}.${sectionItems.length + 1}`,
      description: '새 항목',
      quantity: 1,
      unit: '식',
      unit_price_usd: 0,
      amount_usd: 0,
      amount_krw: 0,
      notes: '',
      section,
    }
    set(s => ({ items: [...s.items, newItem] }))
  },

  updateItem: (id, patch) => {
    const { usdKrw } = get()
    set(s => ({
      items: s.items.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, ...patch }
        updated.amount_usd = updated.quantity * updated.unit_price_usd
        updated.amount_krw = Math.round(updated.amount_usd * usdKrw)
        return updated
      })
    }))
  },

  removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),

  getTotalUsd: () => get().items.reduce((s, i) => s + i.amount_usd, 0),
  getTotalKrw: () => {
    const { usdKrw } = get()
    return Math.round(get().getTotalUsd() * usdKrw)
  },

  reset: () => set({ draft: null, items: [], isAnalyzing: false, analysisResult: null, currentStep: 1 }),
}))
