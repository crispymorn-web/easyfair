'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // 로그인 안 된 경우 → 로그인 페이지로 이동
      if (!session?.user?.email) {
        router.push(`/login?next=${pathname}`)
        return
      }

      // Authorization 헤더로 토큰 전달하여 관리자 권한 체크
      const res = await fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (!res.ok) { setStatus('denied'); return }
      setStatus('ok')
    }
    checkAccess()
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <ShieldAlert className="w-10 h-10 text-red-500" />
        <p className="text-sm font-semibold text-gray-700">관리자 권한이 필요합니다.</p>
        <p className="text-xs text-gray-400">ADMIN_EMAILS에 등록된 이메일로 로그인하세요.</p>
        <button onClick={() => router.push('/login?next=/admin/prices')} className="btn-primary text-xs px-4 py-2 mt-1">
          로그인하기
        </button>
      </div>
    )
  }

  return <>{children}</>
}
