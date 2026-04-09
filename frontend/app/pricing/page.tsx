import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/ 월',
    desc: '개인 및 소규모 테스트용',
    color: 'border-gray-200',
    badge: '',
    features: [
      '월 견적 3건',
      'AI 분석 기본 제공',
      'Excel 다운로드',
      '7개 전시장 지원',
    ],
    cta: '무료 시작',
    href: '/quote/new',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/ 월',
    desc: '전시 기획사 · 컨트랙터',
    color: 'border-brand-600',
    badge: '가장 인기',
    features: [
      '월 견적 무제한',
      'AI 분석 고급 모드',
      'Excel · PDF 전문 포맷',
      '200+ 전시장 지원',
      '실시간 다통화 환율',
      '견적 공유 링크',
    ],
    cta: 'Pro 시작하기',
    href: '/quote/new',
    primary: true,
  },
  {
    name: 'Business',
    price: '$149',
    period: '/ 월',
    desc: '팀 · 대형 전시 대행사',
    color: 'border-gray-200',
    badge: '',
    features: [
      'Pro 모든 기능',
      '팀 멤버 5명',
      '우선 AI 처리',
      '전담 고객 지원',
      'API 액세스',
      '커스텀 브랜딩',
    ],
    cta: '문의하기',
    href: 'mailto:hello@easyfair.co.kr',
    primary: false,
  },
]

export default function PricingPage() {
  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">플랜 &amp; 결제</h1>
        <p className="text-sm text-gray-500 mt-1">필요에 맞는 플랜을 선택하세요. 언제든 변경 가능합니다.</p>
      </div>

      {/* 플랜 카드 */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`card p-6 flex flex-col border-2 ${plan.color} ${plan.primary ? 'shadow-lg' : ''}`}
          >
            {plan.badge && (
              <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-3 self-start">
                {plan.badge}
              </span>
            )}
            <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">{plan.desc}</p>
            <div className="flex items-end gap-1 mb-5">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-400 mb-0.5">{plan.period}</span>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                plan.primary
                  ? 'bg-brand-600 hover:bg-brand-700 text-white'
                  : 'border border-gray-200 hover:border-brand-600 hover:text-brand-600 text-gray-700'
              }`}
            >
              {plan.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="card p-6 max-w-2xl">
        <h2 className="text-sm font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
        <div className="space-y-4">
          {[
            { q: '무료 플랜에서 Pro로 업그레이드하면 기존 견적은 유지되나요?', a: '네, 모든 견적 데이터는 그대로 유지됩니다.' },
            { q: '결제는 어떻게 이루어지나요?', a: '신용카드 또는 PayPal로 결제 가능합니다. 월 단위 구독이며 언제든 해지할 수 있습니다.' },
            { q: '환불 정책이 있나요?', a: '결제 후 7일 이내 전액 환불이 가능합니다.' },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
              <p className="text-xs text-gray-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
