'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [sent, setSent]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setSent(true)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); return }

    // 이전 페이지로 돌아가거나 admin으로
    const next = new URLSearchParams(window.location.search).get('next') ?? '/admin/prices'
    router.push(next)
  }

  if (sent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">이메일을 확인하세요</h2>
          <p className="text-sm text-gray-500">
            {email} 로 인증 링크를 보냈습니다.<br />
            링크를 클릭하면 자동으로 로그인됩니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="card p-8 max-w-sm w-full">
        {/* 로고 */}
        <div className="text-center mb-6">
          <svg viewBox="0 0 176 52" xmlns="http://www.w3.org/2000/svg" className="w-36 mx-auto">
            <text x="1" y="36" fontFamily="'Helvetica Neue', sans-serif" fontWeight="800" fontSize="33" fill="#1B5E20">EASY</text>
            <rect x="90" y="1" width="85" height="37" fill="#1B5E20" rx="1"/>
            <text x="92" y="36" fontFamily="'Helvetica Neue', sans-serif" fontWeight="800" fontSize="33" fill="white">FAIR</text>
          </svg>
          <p className="text-sm text-gray-500 mt-2">
            {mode === 'login' ? '관리자 로그인' : '계정 만들기'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">이메일</label>
            <input
              className="input"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <LogIn className="w-4 h-4" />}
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === 'login' ? (
            <button onClick={() => setMode('signup')} className="text-xs text-brand-600 hover:underline">
              계정이 없으신가요? 회원가입
            </button>
          ) : (
            <button onClick={() => setMode('login')} className="text-xs text-brand-600 hover:underline">
              이미 계정이 있으신가요? 로그인
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
