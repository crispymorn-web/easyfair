import Link from 'next/link'
import { ArrowRight, Cpu, BarChart2, FileDown, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  {
    icon: Cpu,
    title: 'AI 도면 자동 분석',
    desc: '렌더링·도면을 업로드하면 Claude Vision이 구조물·그래픽·AV·가구 항목을 자동 추출합니다.',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: BarChart2,
    title: '실시간 다통화 환율',
    desc: 'USD·KRW·EUR·THB·SGD 실시간 환율 반영. 전시장별 현지 비용 계수를 자동 적용합니다.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: FileDown,
    title: 'Excel · PDF 1클릭 출력',
    desc: '전문 포맷의 견적서를 Excel·PDF로 즉시 출력. 클라이언트에게 바로 공유하세요.',
    color: 'bg-amber-50 text-amber-600',
  },
]

const STATS = [
  { value: '500+', label: '생성된 견적' },
  { value: '3분', label: '평균 완성 시간' },
  { value: '200+', label: '지원 전시장' },
]

const CHECKLIST = [
  'MWC · CES · KINTEX 등 글로벌 전시장 지원',
  '유니온 노동 규정 자동 반영 (LACC 등)',
  '항목별 AI 신뢰도 점수 표시',
  '견적 공유 링크로 클라이언트 리뷰 가능',
]

export default function LandingPage() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="bg-brand-900 text-white px-8 py-16">
        <div className="max-w-2xl">
          <span className="inline-block bg-brand-700 text-brand-200 text-xs font-semibold px-3 py-1 rounded-full mb-5">
            AI-Powered · 전시 부스 견적
          </span>
          <h1 className="text-3xl font-bold leading-snug mb-4">
            전시 부스 견적,<br />
            <span className="text-accent-400">3분</span>이면 충분합니다
          </h1>
          <p className="text-brand-300 text-sm leading-relaxed mb-8 max-w-lg">
            렌더링 이미지 하나만 올리세요. Claude AI가 구조물·그래픽·AV·가구 항목을
            자동으로 추출하고 전문가 수준의 견적서를 즉시 생성합니다.
          </p>
          <div className="flex gap-3">
            <Link
              href="/quote/new"
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-brand-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              무료로 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-brand-600 hover:border-brand-400 text-brand-200 hover:text-white px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              대시보드 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-800 text-white px-8 py-6">
        <div className="flex gap-12">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-accent-400">{value}</p>
              <p className="text-xs text-brand-300 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-12">
        <h2 className="text-lg font-bold text-gray-900 mb-6">핵심 기능</h2>
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-5">
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist */}
      <section className="px-8 pb-12">
        <div className="card p-6 max-w-3xl">
          <h2 className="text-sm font-bold text-gray-900 mb-4">easyfair가 지원하는 것들</h2>
          <ul className="space-y-2.5">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Link
              href="/quote/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              지금 견적 만들기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
