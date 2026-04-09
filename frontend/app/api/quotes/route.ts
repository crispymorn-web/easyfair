import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QuoteCreateInput } from '@/types'
import { PLAN_LIMITS } from '@/lib/constants'

// GET /api/quotes — 내 견적 목록
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('quotes')
    .select('*, items:quote_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/quotes — 새 견적 생성
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 플랜별 월 한도 체크
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: { message: `월 견적 한도(${limit}건) 초과. 플랜 업그레이드가 필요합니다.`, code: 'LIMIT_EXCEEDED' } },
      { status: 429 }
    )
  }

  const body: QuoteCreateInput = await req.json()

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      status: 'draft',
      ...body,
      booth_sqm: body.booth_width * body.booth_depth,
      exchange_rate_usd_krw: 1370, // 실시간 환율은 클라이언트에서 별도 fetch
      total_usd: 0,
      total_krw: 0,
      ai_analyzed: false,
      ai_extracted_items: [],
      rendering_urls: [],
      drawing_urls: [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
