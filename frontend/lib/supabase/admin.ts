import { createClient } from '@supabase/supabase-js'

/** Service Role 클라이언트 — RLS 우회, 서버(API Route)에서만 사용 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
