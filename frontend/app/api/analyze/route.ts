import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AIAnalysisRequest, AIAnalysisResult, AIExtractedItem, QuoteSection } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// 전시 부스 시공 전문가 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 15년 경력의 전시 부스 시공 전문 컨트랙터입니다.
제공된 렌더링 이미지와 도면을 분석하여 시공에 필요한 항목을 정확하게 추출합니다.

분석 원칙:
- 이미지에서 보이는 구조물, 그래픽, 가구, AV 장비를 빠짐없이 추출
- 각 항목의 수량과 단위를 최대한 정확하게 추정
- 확실하지 않은 항목은 낮은 confidence 값 부여
- 반드시 JSON 형식으로만 응답 (마크다운, 설명 텍스트 금지)

섹션 분류:
- SPACE_VENUE: 부스 임차료, 배지, 반입/출 비용
- STRUCTURE: 벽체, 천장, 바닥, 목공, 인력
- GRAPHICS: 그래픽 패널, 사인물, 레터링
- AV_ELECTRICAL: TV, 조명, 전기
- FURNITURE: 테이블, 의자, 진열대
- LOGISTICS: PM, 운송, 철거, 예비비`

export async function POST(req: NextRequest) {
  try {
    const body: AIAnalysisRequest = await req.json()
    const { rendering_base64, drawing_base64, venue_name, booth_sqm, country } = body

    // 이미지 콘텐츠 구성
    const imageContent: Anthropic.ImageBlockParam[] = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: rendering_base64,
        },
      },
    ]

    if (drawing_base64) {
      imageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: drawing_base64,
        },
      })
    }

    const userPrompt = `
전시 부스 정보:
- 전시장: ${venue_name}
- 국가: ${country}
- 부스 면적: ${booth_sqm} sqm
- 첨부 이미지: 렌더링${drawing_base64 ? ' + 도면' : ''}

위 이미지를 분석하여 시공 필요 항목을 추출하고 다음 JSON 형식으로 응답하세요:

{
  "items": [
    {
      "section": "STRUCTURE",
      "description": "System Wall Panel – White Paint Finish",
      "quantity": 28,
      "unit": "sqm",
      "confidence": 92,
      "notes": "3,800W 메인 벽체 + 측면 벽"
    }
  ],
  "summary": "3×6m 부스 분석 완료. 총 N개 항목 추출.",
  "confidence_overall": 88,
  "warnings": ["모스 월 패널 수량 불확실 - 도면 재확인 권장"]
}

주의: JSON만 반환. 마크다운 코드블록 사용 금지.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('AI 응답에서 텍스트를 찾을 수 없습니다.')
    }

    // JSON 파싱 (방어적 처리)
    let result: AIAnalysisResult
    try {
      const cleaned = textContent.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      result = JSON.parse(cleaned)
    } catch {
      throw new Error('AI 응답 JSON 파싱 실패')
    }

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 분석 중 오류 발생'
    return NextResponse.json(
      { data: null, error: { message, code: 'AI_ANALYSIS_ERROR' } },
      { status: 500 }
    )
  }
}
