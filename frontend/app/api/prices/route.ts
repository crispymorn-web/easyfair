import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** GET /api/prices?venue_id=xxx  — 전체 단가표 공개 조회 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const venueId = searchParams.get('venue_id')

  const supabase = createAdminClient()

  let query = supabase
    .from('price_catalog')
    .select('*')
    .eq('active', true)
    .order('section')
    .order('sort_order')

  // venue_id가 있으면 해당 전시장 + 전체 기본값(null) 모두 조회
  if (venueId) {
    query = query.or(`venue_id.eq.${venueId},venue_id.is.null`)
  } else {
    query = query.is('venue_id', null)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ data: null, error: { message: error.message, code: 'DB_ERROR' } }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
