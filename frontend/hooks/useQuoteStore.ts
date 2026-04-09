import { create } from 'zustand'
import { Quote, QuoteItem, QuoteCreateInput, AIAnalysisResult, PriceCatalogItem } from '@/types'
import { generateId, calcItemAmount } from '@/lib/utils'
import { SECTION_META, BASE_PRICES_USD, VENUE_COST_FACTORS } from '@/lib/constants'
import { lookupUnitPrice } from '@/lib/priceCatalog'

// AI 항목 설명 → 기준 단가 키워드 매핑 (catalog 없을 때 폴백)
function estimateUnitPrice(description: string, section: string, venueFactor: number): number {
  const d = description.toLowerCase()

  let base = 0

  if (section === 'SPACE_VENUE') {
    if (d.includes('clean'))                              base = BASE_PRICES_USD.cleaning_day
    else if (d.includes('badge') || d.includes('배지'))   base = BASE_PRICES_USD.exhibitor_badge_person
    else if (d.includes('move') || d.includes('반입'))    base = BASE_PRICES_USD.move_in_out
    else                                                   base = BASE_PRICES_USD.raw_space_sqm
  } else if (section === 'STRUCTURE') {
    if (d.includes('moss') || d.includes('모스'))         base = BASE_PRICES_USD.moss_wall
    else if (d.includes('counter') || d.includes('카운터')) base = BASE_PRICES_USD.display_counter
    else if (d.includes('laminate') || d.includes('라미네이트')) base = BASE_PRICES_USD.wood_laminate_sqm
    else if (d.includes('carpet') || d.includes('카펫'))  base = BASE_PRICES_USD.carpet_sqm
    else if (d.includes('storage') || d.includes('창고')) base = BASE_PRICES_USD.storage_room
    else if (d.includes('labor') || d.includes('인건') || d.includes('목공')) base = BASE_PRICES_USD.labor_day
    else if (d.includes('ceiling') || d.includes('천장')) base = BASE_PRICES_USD.ceiling_sqm
    else                                                   base = BASE_PRICES_USD.wall_panel_sqm
  } else if (section === 'GRAPHICS') {
    if (d.includes('design'))                             base = BASE_PRICES_USD.graphic_design
    else if (d.includes('header') || d.includes('헤더')) base = BASE_PRICES_USD.header_signage
    else if (d.includes('letter') || d.includes('레터') || d.includes('cut-out')) base = BASE_PRICES_USD.vinyl_lettering
    else if (d.includes('large') || d.includes('대형') || d.includes('main') || d.includes('메인')) base = BASE_PRICES_USD.graphic_large
    else if (d.includes('small') || d.includes('소형'))   base = BASE_PRICES_USD.graphic_small
    else                                                   base = BASE_PRICES_USD.graphic_medium
  } else if (section === 'AV_ELECTRICAL') {
    if (d.includes('tv') || d.includes('monitor') || d.includes('모니터') || d.includes('55')) base = BASE_PRICES_USD.tv_55_rental
    else if (d.includes('led') || d.includes('spot') || d.includes('조명')) base = BASE_PRICES_USD.led_spotlight
    else if (d.includes('power') || d.includes('전원') || d.includes('분전')) base = BASE_PRICES_USD.power_distribution
    else                                                   base = BASE_PRICES_USD.electrical_5kw
  } else if (section === 'FURNITURE') {
    if (d.includes('chair') || d.includes('의자'))        base = BASE_PRICES_USD.chair
    else if (d.includes('brochure') || d.includes('브로슈어')) base = BASE_PRICES_USD.brochure_stand
    else if (d.includes('table') || d.includes('테이블')) base = BASE_PRICES_USD.round_table
    else                                                   base = BASE_PRICES_USD.misc_accessories
  } else if (section === 'LOGISTICS') {
    if (d.includes('pm') || d.includes('manage') || d.includes('관리')) base = BASE_PRICES_USD.pm_day
    else if (d.includes('transport') || d.includes('운송') || d.includes('물류')) base = BASE_PRICES_USD.transport
    else if (d.includes('teardown') || d.includes('철거')) base = BASE_PRICES_USD.teardown
    else                                                   base = BASE_PRICES_USD.pm_day
  }

  return Math.round(base * venueFactor)
}

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
  applyAIItems: (aiItems: AIAnalysisResult['items'], venueId: string, catalog?: PriceCatalogItem[]) => void
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

  applyAIItems: (aiItems, venueId, catalog) => {
    const { usdKrw } = get()
    const venueFactor = VENUE_COST_FACTORS[venueId] ?? VENUE_COST_FACTORS['default']
    const items: QuoteItem[] = aiItems.map((ai, idx) => {
      // DB 단가표가 있으면 우선 사용, 없으면 폴백
      const unitPrice = catalog && catalog.length > 0
        ? lookupUnitPrice(ai.description, ai.section, catalog, venueFactor)
        : estimateUnitPrice(ai.description, ai.section, venueFactor)
      const amountUsd = ai.quantity * unitPrice
      return {
        id: generateId(),
        no: `AI.${idx + 1}`,
        description: ai.description,
        quantity: ai.quantity,
        unit: ai.unit,
        unit_price_usd: unitPrice,
        amount_usd: amountUsd,
        amount_krw: Math.round(amountUsd * usdKrw),
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
