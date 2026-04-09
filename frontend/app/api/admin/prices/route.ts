import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** 관리자 권한 체크 */
async function checkAdmin(): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  if (adminEmails.length === 0) return false

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  return adminEmails.includes(user.email)
}

/** GET /api/admin/prices — 전체 단가표 (비활성 포함) */
export async function GET(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section')
  const venueId = searchParams.get('venue_id')

  const supabase = createAdminClient()
  let query = supabase
    .from('price_catalog')
    .select('*')
    .order('section')
    .order('sort_order')

  if (section) query = query.eq('section', section)
  if (venueId === 'null') query = query.is('venue_id', null)
  else if (venueId) query = query.eq('venue_id', venueId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, error: null })
}

/** POST /api/admin/prices — 새 단가 항목 생성 */
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('price_catalog')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null }, { status: 201 })
}
