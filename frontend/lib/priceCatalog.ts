import { PriceCatalogItem, QuoteSection } from '@/types'
import { BASE_PRICES_USD, VENUE_COST_FACTORS } from '@/lib/constants'

/**
 * DB 단가표에서 description+section으로 단가를 매핑합니다.
 * DB 조회 실패 시 constants.ts의 하드코딩 값으로 폴백합니다.
 */
export function lookupUnitPrice(
  description: string,
  section: QuoteSection,
  catalog: PriceCatalogItem[],
  venueFactor: number
): number {
  const d = description.toLowerCase()
  const sectionItems = catalog.filter(c => c.section === section && c.active)

  // keywords 배열로 매칭
  const matched = sectionItems.find(item =>
    item.keywords.some(kw => kw && d.includes(kw.toLowerCase()))
  )

  if (matched) {
    return matched.price_type === 'absolute'
      ? Math.round(matched.unit_price_usd)
      : Math.round(matched.unit_price_usd * venueFactor)
  }

  // 폴백: constants.ts 키워드 매핑
  return fallbackEstimate(d, section, venueFactor)
}

/** DB 조회 실패 시 기존 하드코딩 로직으로 폴백 */
function fallbackEstimate(d: string, section: string, vf: number): number {
  let base = 0
  if (section === 'SPACE_VENUE') {
    if (d.includes('clean'))                             base = BASE_PRICES_USD.cleaning_day
    else if (d.includes('badge'))                        base = BASE_PRICES_USD.exhibitor_badge_person
    else if (d.includes('move') || d.includes('반입'))   base = BASE_PRICES_USD.move_in_out
    else                                                  base = BASE_PRICES_USD.raw_space_sqm
  } else if (section === 'STRUCTURE') {
    if (d.includes('moss') || d.includes('모스'))        base = BASE_PRICES_USD.moss_wall
    else if (d.includes('counter') || d.includes('카운터')) base = BASE_PRICES_USD.display_counter
    else if (d.includes('laminate'))                     base = BASE_PRICES_USD.wood_laminate_sqm
    else if (d.includes('carpet') || d.includes('카펫')) base = BASE_PRICES_USD.carpet_sqm
    else if (d.includes('storage') || d.includes('창고')) base = BASE_PRICES_USD.storage_room
    else if (d.includes('labor') || d.includes('인건') || d.includes('목공')) base = BASE_PRICES_USD.labor_day
    else if (d.includes('ceiling') || d.includes('천장')) base = BASE_PRICES_USD.ceiling_sqm
    else                                                  base = BASE_PRICES_USD.wall_panel_sqm
  } else if (section === 'GRAPHICS') {
    if (d.includes('design'))                            base = BASE_PRICES_USD.graphic_design
    else if (d.includes('header'))                       base = BASE_PRICES_USD.header_signage
    else if (d.includes('letter') || d.includes('cut-out')) base = BASE_PRICES_USD.vinyl_lettering
    else if (d.includes('large') || d.includes('대형')) base = BASE_PRICES_USD.graphic_large
    else if (d.includes('small') || d.includes('소형')) base = BASE_PRICES_USD.graphic_small
    else                                                  base = BASE_PRICES_USD.graphic_medium
  } else if (section === 'AV_ELECTRICAL') {
    if (d.includes('tv') || d.includes('55') || d.includes('모니터')) base = BASE_PRICES_USD.tv_55_rental
    else if (d.includes('led') || d.includes('조명')) base = BASE_PRICES_USD.led_spotlight
    else if (d.includes('power') || d.includes('분전')) base = BASE_PRICES_USD.power_distribution
    else                                                 base = BASE_PRICES_USD.electrical_5kw
  } else if (section === 'FURNITURE') {
    if (d.includes('chair') || d.includes('의자'))       base = BASE_PRICES_USD.chair
    else if (d.includes('brochure'))                     base = BASE_PRICES_USD.brochure_stand
    else if (d.includes('table') || d.includes('테이블')) base = BASE_PRICES_USD.round_table
    else                                                  base = BASE_PRICES_USD.misc_accessories
  } else if (section === 'LOGISTICS') {
    if (d.includes('transport') || d.includes('운송'))   base = BASE_PRICES_USD.transport
    else if (d.includes('teardown') || d.includes('철거')) base = BASE_PRICES_USD.teardown
    else                                                  base = BASE_PRICES_USD.pm_day
  }
  return Math.round(base * vf)
}
