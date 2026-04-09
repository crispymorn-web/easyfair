'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { setStatus('denied'); return }

      // API에서 체크 (ADMIN_EMAILS env 기반)
      const res = await fetch('/api/admin/prices', { method: 'GET' })
      if (res.status === 403) { setStatus('denied'); return }
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
        <button onClick={() => router.push('/')} className="btn-outline text-xs">홈으로</button>
      </div>
    )
  }

  return <>{children}</>
}
