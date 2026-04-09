import { Building2, MapPin, Users, Zap } from 'lucide-react'

const VENUES = [
  { id: 'lacc',      name: 'Los Angeles Convention Center', nameKo: 'LA 컨벤션센터',     flag: '🇺🇸', city: 'Los Angeles', country: 'USA',       factor: 1.00, union: true,  height: '6.1m', sqm: '$400–500' },
  { id: 'impact_bkk',name: 'IMPACT Muang Thong Thani',      nameKo: 'IMPACT 방콕',        flag: '🇹🇭', city: 'Bangkok',     country: 'Thailand',  factor: 0.38, union: false, height: '4.0m', sqm: '$90–100' },
  { id: 'kintex',    name: 'KINTEX',                         nameKo: 'KINTEX 킨텍스',      flag: '🇰🇷', city: 'Goyang',      country: 'Korea',     factor: 0.52, union: false, height: '5.0m', sqm: '$120–150' },
  { id: 'coex',      name: 'COEX',                           nameKo: 'COEX 코엑스',        flag: '🇰🇷', city: 'Seoul',       country: 'Korea',     factor: 0.55, union: false, height: '4.5m', sqm: '$130–160' },
  { id: 'tokyo_bs',  name: 'Tokyo Big Sight',                nameKo: '도쿄 빅사이트',      flag: '🇯🇵', city: 'Tokyo',       country: 'Japan',     factor: 0.75, union: false, height: '6.0m', sqm: '$200–250' },
  { id: 'messe_ffm', name: 'Messe Frankfurt',                 nameKo: '메세 프랑크푸르트', flag: '🇩🇪', city: 'Frankfurt',   country: 'Germany',   factor: 0.82, union: false, height: '7.0m', sqm: '$280–350' },
  { id: 'sg_expo',   name: 'Singapore Expo',                  nameKo: '싱가포르 엑스포',   flag: '🇸🇬', city: 'Singapore',   country: 'Singapore', factor: 0.65, union: false, height: '5.0m', sqm: '$160–200' },
  { id: 'bitec_bkk', name: 'BITEC Bangkok',                   nameKo: 'BITEC 방콕',         flag: '🇹🇭', city: 'Bangkok',     country: 'Thailand',  factor: 0.36, union: false, height: '4.0m', sqm: '$85–95' },
]

export default function VenuesPage() {
  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">전시장 검색</h1>
        <p className="text-sm text-gray-500 mt-1">지원 전시장 목록 및 비용 계수 정보</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {VENUES.map((v) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{v.flag}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900">{v.nameKo}</h2>
                <p className="text-xs text-gray-400 truncate">{v.name}</p>
              </div>
              <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                ×{v.factor.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                {v.city}, {v.country}
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-gray-400" />
                최대 {v.height}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-gray-400" />
                공간 {v.sqm}/sqm
              </div>
              {v.union && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-600 font-medium">유니온 필수</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        비용 계수는 LA 컨벤션센터(×1.00) 대비 상대 단가입니다. 새 전시장 추가 요청: hello@easyfair.co.kr
      </p>
    </div>
  )
}
