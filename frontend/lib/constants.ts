import { QuoteSection } from '@/types'

// 섹션 메타데이터
export const SECTION_META: Record<QuoteSection, { label: string; color: string; bg: string }> = {
  SPACE_VENUE:    { label: '1. Space & Venue Fees',        color: '#1B5E20', bg: '#E8F5E9' },
  STRUCTURE:      { label: '2. Structure & Construction',   color: '#0D47A1', bg: '#E3F2FD' },
  GRAPHICS:       { label: '3. Graphics & Signage',         color: '#1A5276', bg: '#EBF5FB' },
  AV_ELECTRICAL:  { label: '4. AV & Electrical',            color: '#4A148C', bg: '#F3E5F5' },
  FURNITURE:      { label: '5. Furniture & Accessories',    color: '#4E342E', bg: '#FBE9E7' },
  LOGISTICS:      { label: '6. Logistics & Project Mgmt',   color: '#263238', bg: '#ECEFF1' },
}

// 전시장별 로컬 단가 계수 (LA = 1.0 기준)
export const VENUE_COST_FACTORS: Record<string, number> = {
  'lacc':         1.00,  // LA Convention Center
  'impact_bkk':  0.38,  // Bangkok IMPACT
  'kintex':      0.52,  // 고양 KINTEX
  'coex':        0.55,  // 서울 COEX
  'tokyo_bs':    0.75,  // Tokyo Big Sight
  'messe_ffm':   0.82,  // Messe Frankfurt
  'sg_expo':     0.65,  // Singapore Expo
  'default':     0.60,  // 기본값
}

// 기준 단가표 (LA 기준 USD)
export const BASE_PRICES_USD = {
  // Space
  raw_space_sqm:              450,
  exhibitor_badge_person:     120,
  move_in_out:                600,
  cleaning_day:                30,
  // Structure (per sqm or per set)
  wall_panel_sqm:              95,
  wood_laminate_sqm:          130,
  ceiling_sqm:                 70,
  storage_room:              1200,
  carpet_sqm:                  35,
  display_counter:           1800,
  moss_wall:                  650,
  labor_day:                 1200,
  // Graphics
  header_signage:             850,
  graphic_large:              480,
  graphic_medium:             320,
  graphic_small:              250,
  vinyl_lettering:            180,
  graphic_design:            1200,
  // AV & Electrical
  tv_55_rental:               900,
  electrical_5kw:             650,
  led_spotlight:               65,
  power_distribution:         180,
  // Furniture
  round_table:                120,
  chair:                       45,
  brochure_stand:             150,
  misc_accessories:            80,
  // Logistics
  pm_day:                     500,
  transport:                  800,
  teardown:                   600,
  contingency_pct:           0.03, // 3%
}

// 환율 기본값 (API 실패 시 fallback)
export const DEFAULT_EXCHANGE_RATES = {
  USD_KRW: 1370,
  USD_THB:   36,
  USD_JPY:  153,
  USD_EUR: 0.93,
  USD_SGD: 1.35,
}

// 플랜별 견적 생성 한도
export const PLAN_LIMITS = {
  free:     3,
  pro:    999, // unlimited
  business: 999,
}
