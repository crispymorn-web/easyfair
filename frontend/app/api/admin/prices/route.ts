import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (adminEmails.length === 0) return false

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false

  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user?.email) return false

  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin(req)) {
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

export async function POST(req: NextRequest) {
  if (!await checkAdmin(req)) {
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
