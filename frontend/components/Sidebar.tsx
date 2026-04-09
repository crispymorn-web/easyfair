'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  LayoutDashboard,
  Building2,
  CreditCard,
  FileText,
  Upload,
  Cpu,
  PenLine,
  ChevronRight,
} from 'lucide-react'

const NAV = [
  {
    section: '메인',
    items: [
      { label: '랜딩 페이지', href: '/', icon: Home, exact: true },
      { label: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'AI 견적 생성',
    items: [
      { label: '1. 전시 정보 입력', href: '/quote/new', icon: FileText },
      { label: '2. 파일 업로드', href: '/quote/new', icon: Upload },
      { label: '3. AI 분석', href: '/quote/new', icon: Cpu },
      { label: '4. 견적 편집', href: '/quote/new', icon: PenLine },
    ],
  },
  {
    section: '기타',
    items: [
      { label: '전시장 검색', href: '/venues', icon: Building2 },
      { label: '플랜 & 결제', href: '/pricing', icon: CreditCard },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-brand-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent-500 rounded-lg flex items-center justify-center text-xs font-bold text-brand-900">
            ef
          </div>
          <span className="font-bold text-base tracking-tight">easyfair</span>
        </Link>
        <p className="text-[10px] text-brand-400 mt-1 ml-9">AI 전시 견적 플랫폼</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-500 px-2 mb-1.5">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ label, href, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-brand-700 text-white font-medium'
                          : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-brand-400" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-brand-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">사용자</p>
            <p className="text-[10px] text-brand-400">Free 플랜</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
