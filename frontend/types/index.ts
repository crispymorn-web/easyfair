// ── Quote Types ──────────────────────────────────────────────────────────
export interface QuoteItem {
  id: string
  no: string
  description: string
  quantity: number
  unit: string
  unit_price_usd: number
  amount_usd: number
  amount_krw: number
  notes: string
  ai_confidence?: number // 0-100, AI 추출 신뢰도
  section: QuoteSection
}

export type QuoteSection =
  | 'SPACE_VENUE'
  | 'STRUCTURE'
  | 'GRAPHICS'
  | 'AV_ELECTRICAL'
  | 'FURNITURE'
  | 'LOGISTICS'

export interface Quote {
  id: string
  user_id: string
  status: 'draft' | 'complete' | 'shared'
  // 전시 정보
  event_name: string
  venue_id: string
  venue_name: string
  country: string
  city: string
  show_month: string // "2026-05"
  booth_type: 'raw_space' | 'shell_scheme'
  booth_width: number  // meters
  booth_depth: number  // meters
  booth_sqm: number
  // 참가사 정보
  client_name: string
  contact_name?: string
  notes?: string
  // 환율
  exchange_rate_usd_krw: number
  exchange_rate_usd_thb?: number
  // 금액 합계
  total_usd: number
  total_krw: number
  // 파일
  rendering_urls: string[]
  drawing_urls: string[]
  // AI 분석
  ai_analyzed: boolean
  ai_extracted_items: Partial<QuoteItem>[]
  // 타임스탬프
  created_at: string
  updated_at: string
  // 아이템
  items?: QuoteItem[]
}

export interface QuoteCreateInput {
  event_name: string
  venue_id: string
  venue_name: string
  country: string
  city: string
  show_month: string
  booth_type: 'raw_space' | 'shell_scheme'
  booth_width: number
  booth_depth: number
  client_name: string
  contact_name?: string
  notes?: string
}

// ── Venue Types ───────────────────────────────────────────────────────────
export interface Venue {
  id: string
  name: string
  name_ko: string
  country: string
  country_code: string
  city: string
  website?: string
  // 시세
  raw_space_usd_sqm_min: number
  raw_space_usd_sqm_max: number
  shell_scheme_usd_sqm_min: number
  shell_scheme_usd_sqm_max: number
  // 규정
  max_height_m: number
  union_labor_required: boolean
  eac_required: boolean
  vat_rate: number        // 0.07 = 7%
  local_cost_factor: number // 1.0 = 기준, 0.4 = 40% 수준
  // 메타
  notes: string
  active: boolean
}

// ── AI Analysis Types ─────────────────────────────────────────────────────
export interface AIAnalysisRequest {
  rendering_base64: string
  drawing_base64?: string
  venue_name: string
  booth_sqm: number
  country: string
}

export interface AIAnalysisResult {
  items: AIExtractedItem[]
  summary: string
  confidence_overall: number
  warnings: string[]
}

export interface AIExtractedItem {
  section: QuoteSection
  description: string
  quantity: number
  unit: string
  confidence: number
  notes: string
}

// ── User & Auth ───────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  plan: 'free' | 'pro' | 'business'
  quotes_this_month: number
  created_at: string
}

// ── API Response Wrappers ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: { message: string; code: string }
}

export type Result<T> = ApiResponse<T> | ApiError

// ── Price Catalog ─────────────────────────────────────────────────────────
export interface PriceCatalogItem {
  id: string
  venue_id: string | null        // null = 전체 기본값
  section: QuoteSection
  item_key: string               // e.g. "wall_panel_sqm"
  label_ko: string
  label_en: string
  unit: string
  unit_price_usd: number
  price_type: 'base' | 'absolute'  // base=factor 적용, absolute=고정
  keywords: string[]
  active: boolean
  sort_order: number
  notes: string
  updated_at: string
}

// ── Exchange Rate ─────────────────────────────────────────────────────────
export interface ExchangeRates {
  USD_KRW: number
  USD_THB: number
  USD_JPY: number
  USD_EUR: number
  USD_SGD: number
  updated_at: string
}
