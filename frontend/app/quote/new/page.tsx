'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, Upload, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useQuoteStore } from '@/hooks/useQuoteStore'
import { fileToBase64 } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AIAnalysisResult } from '@/types'

// ── Step 1 스키마 ──────────────────────────────────────────
const step1Schema = z.object({
  event_name:   z.string().min(2, '전시회명을 입력하세요'),
  venue_id:     z.string().min(1, '전시장을 선택하세요'),
  venue_name:   z.string().min(1),
  country:      z.string().min(1, '국가를 선택하세요'),
  city:         z.string().min(1, '도시를 입력하세요'),
  show_month:   z.string().min(7, '개최 연월을 선택하세요'),
  booth_type:   z.enum(['raw_space', 'shell_scheme']),
  booth_width:  z.coerce.number().positive().max(100),
  booth_depth:  z.coerce.number().positive().max(100),
  client_name:  z.string().min(1, '참가사명을 입력하세요'),
  contact_name: z.string().optional(),
  notes:        z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>

// 전시장 목록 (실제로는 API에서 로드)
const VENUES = [
  { id: 'impact_bkk', name: 'IMPACT Muang Thong Thani', name_ko: 'IMPACT 방콕',   country: 'Thailand',     country_code: 'TH', city: 'Bangkok',      rate: '$90–100/sqm' },
  { id: 'lacc',       name: 'Los Angeles Conv. Center', name_ko: 'LA 컨벤션센터',  country: 'United States',country_code: 'US', city: 'Los Angeles',  rate: '$400–500/sqm' },
  { id: 'kintex',     name: 'KINTEX',                  name_ko: 'KINTEX',          country: 'South Korea',  country_code: 'KR', city: 'Goyang',       rate: '$120–150/sqm' },
  { id: 'coex',       name: 'COEX',                    name_ko: 'COEX 코엑스',     country: 'South Korea',  country_code: 'KR', city: 'Seoul',        rate: '$130–160/sqm' },
  { id: 'tokyo_bs',   name: 'Tokyo Big Sight',          name_ko: '도쿄 빅사이트',  country: 'Japan',        country_code: 'JP', city: 'Tokyo',        rate: '$200–250/sqm' },
  { id: 'messe_ffm',  name: 'Messe Frankfurt',          name_ko: '메세 프랑크푸르트',country:'Germany',      country_code: 'DE', city: 'Frankfurt',    rate: '$280–350/sqm' },
  { id: 'sg_expo',    name: 'Singapore Expo',           name_ko: '싱가포르 엑스포', country: 'Singapore',   country_code: 'SG', city: 'Singapore',    rate: '$160–200/sqm' },
]

const FLAG: Record<string, string> = {
  TH: '🇹🇭', US: '🇺🇸', KR: '🇰🇷', JP: '🇯🇵', DE: '🇩🇪', SG: '🇸🇬',
}

// ── Step indicator ──────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = ['전시 정보', '파일 업로드', 'AI 분석', '견적 편집']
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                done   ? 'bg-brand-600 text-white' :
                active ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                         'bg-gray-100 text-gray-400'
              )}>
                {done ? '✓' : num}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                active ? 'text-brand-600' : done ? 'text-gray-600' : 'text-gray-400'
              )}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-px mx-3', done ? 'bg-brand-600' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Wizard Page ─────────────────────────────────────────
export default function NewQuotePage() {
  const router = useRouter()
  const { currentStep, setStep, setDraft, setAnalyzing, isAnalyzing,
          setAnalysisResult, applyAIItems } = useQuoteStore()

  // Step 1 form
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { booth_type: 'raw_space', booth_width: 6, booth_depth: 3, client_name: 'DONG-A ST' },
  })
  const boothW = watch('booth_width') || 0
  const boothD = watch('booth_depth') || 0
  const sqm = Number((boothW * boothD).toFixed(1))
  const selectedVenueId = watch('venue_id')

  // Step 2 files
  const [renderingFile, setRenderingFile] = useState<File | null>(null)
  const [drawingFile,   setDrawingFile]   = useState<File | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisData,  setAnalysisData]  = useState<AIAnalysisResult | null>(null)

  const onDropRendering = useCallback((files: File[]) => {
    if (files[0]) setRenderingFile(files[0])
  }, [])
  const onDropDrawing = useCallback((files: File[]) => {
    if (files[0]) setDrawingFile(files[0])
  }, [])

  const { getRootProps: getRP1, getInputProps: getIP1, isDragActive: isDrag1 } =
    useDropzone({ onDrop: onDropRendering, accept: { 'image/*': ['.png','.jpg','.jpeg','.webp'] }, maxFiles: 1 })
  const { getRootProps: getRP2, getInputProps: getIP2, isDragActive: isDrag2 } =
    useDropzone({ onDrop: onDropDrawing,   accept: { 'image/*': ['.png','.jpg','.jpeg','.webp'], 'application/pdf': ['.pdf'] }, maxFiles: 1 })

  // Step 1 → Step 2
  const onStep1Submit = (data: Step1Data) => {
    setDraft({ ...data, booth_sqm: sqm })
    setStep(2)
  }

  // Step 2 → Step 3: AI 분석 실행
  const runAnalysis = async () => {
    if (!renderingFile) return
    setAnalysisError(null)
    setAnalyzing(true)
    setStep(3)

    try {
      const renderingB64 = await fileToBase64(renderingFile)
      const drawingB64   = drawingFile ? await fileToBase64(drawingFile) : undefined
      const draft = useQuoteStore.getState().draft!

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rendering_base64: renderingB64,
          drawing_base64:   drawingB64,
          venue_name:  draft.venue_name,
          booth_sqm:   draft.booth_sqm,
          country:     draft.country,
          venue_id:    draft.venue_id,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error?.message || 'AI 분석 실패')

      const result: AIAnalysisResult = json.data
      setAnalysisResult(result)
      setAnalysisData(result)
      applyAIItems(result.items, draft.venue_id!)
    } catch (e: any) {
      setAnalysisError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  // Step 3 → Step 4
  const goToEditor = async () => {
    const draft = useQuoteStore.getState().draft!

    // 견적 DB 저장
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const json = await res.json()
    if (json.data?.id) {
      router.push(`/quote/${json.data.id}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Steps current={currentStep as 1|2|3|4} />

      {/* ── STEP 1: 전시 정보 ── */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">전시 기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="label">전시회명 *</label>
                <input className="input" placeholder="예: HortEx Thailand 2026" {...register('event_name')} />
                {errors.event_name && <p className="text-xs text-red-500 mt-1">{errors.event_name.message}</p>}
              </div>

              <div>
                <label className="label">전시장 선택 *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VENUES.map(v => (
                    <button key={v.id} type="button"
                      onClick={() => {
                        setValue('venue_id',   v.id)
                        setValue('venue_name', v.name)
                        setValue('country',    v.country)
                        setValue('city',       v.city)
                      }}
                      className={cn(
                        'text-left p-3 rounded-lg border transition-all text-sm',
                        selectedVenueId === v.id
                          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20'
                          : 'border-gray-200 hover:border-brand-400'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span>{FLAG[v.country_code] || '🌐'}</span>
                        <span className="font-medium text-gray-900">{v.name_ko}</span>
                      </div>
                      <div className="text-xs text-gray-400">{v.city} · {v.rate}</div>
                    </button>
                  ))}
                </div>
                {errors.venue_id && <p className="text-xs text-red-500 mt-1">전시장을 선택하세요</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">개최 연월 *</label>
                  <input type="month" className="input" {...register('show_month')} />
                </div>
                <div>
                  <label className="label">부스 타입</label>
                  <select className="input" {...register('booth_type')}>
                    <option value="raw_space">Raw Space (원시 공간)</option>
                    <option value="shell_scheme">Shell Scheme</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">부스 규모</h2>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="label">폭 (m) *</label>
                <input type="number" min="1" max="100" step="0.5" className="input" {...register('booth_width')} />
              </div>
              <div>
                <label className="label">깊이 (m) *</label>
                <input type="number" min="1" max="100" step="0.5" className="input" {...register('booth_depth')} />
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-center border border-brand-200">
                <div className="text-xs text-brand-600 font-medium mb-0.5">총 면적</div>
                <div className="text-2xl font-bold text-brand-700 font-mono">{sqm}</div>
                <div className="text-xs text-brand-500">sqm</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">참가사 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">참가사명 *</label>
                <input className="input" placeholder="DONG-A ST" {...register('client_name')} />
                {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name.message}</p>}
              </div>
              <div>
                <label className="label">담당자</label>
                <input className="input" placeholder="홍길동" {...register('contact_name')} />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">특이사항</label>
              <textarea rows={2} className="input" placeholder="디자인 컨셉, 특수 요청사항 등" {...register('notes')} />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary flex items-center gap-2 px-6 py-2.5">
              다음 단계 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: 파일 업로드 ── */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">렌더링 이미지 업로드 *</h2>
            <p className="text-xs text-gray-400 mb-4">AI가 3D 렌더링을 분석해 구조물·그래픽·가구를 자동 인식합니다</p>

            {renderingFile ? (
              <div className="flex items-center gap-3 p-3 border border-brand-200 rounded-lg bg-brand-50">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-lg flex-shrink-0">🖼️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{renderingFile.name}</p>
                  <p className="text-xs text-gray-400">{(renderingFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <CheckCircle className="w-5 h-5 text-brand-600" />
                <button onClick={() => setRenderingFile(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div {...getRP1()} className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                isDrag1 ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-400'
              )}>
                <input {...getIP1()} />
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">드래그 또는 클릭해서 업로드</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · 최대 20MB</p>
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">필수</span>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">도면 파일 업로드</h2>
            <p className="text-xs text-gray-400 mb-4">Elevation A 등 CAD 도면을 추가하면 분석 정확도가 높아집니다</p>

            {drawingFile ? (
              <div className="flex items-center gap-3 p-3 border border-brand-200 rounded-lg bg-brand-50">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-lg flex-shrink-0">📐</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{drawingFile.name}</p>
                  <p className="text-xs text-gray-400">{(drawingFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <CheckCircle className="w-5 h-5 text-brand-600" />
                <button onClick={() => setDrawingFile(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div {...getRP2()} className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDrag2 ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-400'
              )}>
                <input {...getIP2()} />
                <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">도면 파일 드래그 또는 클릭</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF · 최대 30MB</p>
                <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">권장</span>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
            <button
              onClick={runAnalysis}
              disabled={!renderingFile}
              className="btn-primary flex items-center gap-2 px-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              AI 분석 시작 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: AI 분석 결과 ── */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="card p-6">
            {isAnalyzing ? (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-gray-700 mb-1">Claude AI 분석 중...</p>
                <p className="text-xs text-gray-400">렌더링과 도면을 동시에 분석하고 있습니다</p>
                <div className="mt-5 space-y-2 text-left max-w-xs mx-auto">
                  {['벽체 구조 인식', '그래픽 패널 크기 추출', 'AV·가구 위치 분석', '단가 DB 매핑 중'].map(t => (
                    <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-500 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            ) : analysisError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-red-600 mb-1">AI 분석 실패</p>
                <p className="text-xs text-gray-400 mb-4">{analysisError}</p>
                <button onClick={() => { setStep(2); setAnalysisError(null) }} className="btn-outline text-sm">
                  다시 시도
                </button>
              </div>
            ) : analysisData ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <CheckCircle className="w-6 h-6 text-brand-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">분석 완료</p>
                    <p className="text-xs text-gray-400">{analysisData.summary}</p>
                  </div>
                  <span className="ml-auto text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                    신뢰도 {analysisData.confidence_overall}%
                  </span>
                </div>

                {analysisData.warnings.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    {analysisData.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {analysisData.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className={cn(
                        'text-xs px-1.5 py-0.5 rounded font-mono font-medium flex-shrink-0',
                        item.confidence >= 85 ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {item.confidence}%
                      </div>
                      <span className="text-sm text-gray-800 flex-1">{item.description}</span>
                      <span className="text-xs text-gray-400 font-mono">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {!isAnalyzing && !analysisError && analysisData && (
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-outline flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> 파일 재업로드
              </button>
              <button onClick={goToEditor} className="btn-primary flex items-center gap-2 px-6">
                견적 편집기로 이동 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
