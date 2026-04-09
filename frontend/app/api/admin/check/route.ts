import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** GET /api/admin/check — Authorization 헤더 토큰으로 관리자 여부 확인 */
export async function GET(req: NextRequest) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

  if (adminEmails.length === 0) {
    return NextResponse.json({ error: 'ADMIN_EMAILS not configured' }, { status: 403 })
  }

  // Authorization 헤더에서 토큰 추출
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 })
  }

  // service_role 클라이언트로 토큰 검증
  const supabase = createAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user?.email) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const isAdmin = adminEmails.includes(user.email.toLowerCase())
  if (!isAdmin) {
    return NextResponse.json({ error: 'Not admin', email: user.email }, { status: 403 })
  }

  return NextResponse.json({ ok: true, email: user.email })
}
