import anthropic
import json
from typing import Optional
from app.core.config import settings
from app.schemas import AIAnalysisResult, AIExtractedItem, QuoteSection

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """당신은 15년 경력의 전시 부스 시공 전문 컨트랙터입니다.
제공된 3D 렌더링과 도면을 정밀 분석하여 시공에 필요한 모든 항목을 추출합니다.

분석 원칙:
1. 이미지에 보이는 모든 구조물·마감재·가구·AV·그래픽을 빠짐없이 목록화
2. 치수 정보가 있으면 반드시 활용해 면적·수량 산출
3. 불확실한 항목은 confidence를 낮게 설정 (70 미만)
4. JSON만 반환 — 마크다운, 설명 텍스트 절대 금지

섹션 코드:
- SPACE_VENUE    : 부스 임차·배지·반입출
- STRUCTURE      : 벽체·천장·바닥·목공·인건비
- GRAPHICS       : 그래픽 패널·사인물·레터링
- AV_ELECTRICAL  : TV·조명·전기
- FURNITURE      : 테이블·의자·진열대
- LOGISTICS      : PM·운송·철거·예비비"""


async def analyze_booth_images(
    rendering_base64: str,
    drawing_base64: Optional[str],
    venue_name: str,
    booth_sqm: float,
    country: str,
) -> AIAnalysisResult:
    """렌더링 + 도면 이미지를 Claude Vision으로 분석해 견적 항목 추출"""

    # 이미지 블록 구성
    content: list = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": rendering_base64,
            },
        }
    ]

    if drawing_base64:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": drawing_base64,
            },
        })

    user_prompt = f"""
전시 부스 정보:
- 전시장: {venue_name}
- 국가: {country}
- 부스 면적: {booth_sqm} sqm
- 이미지: 렌더링{'+ 도면' if drawing_base64 else ''}

이미지를 분석하여 다음 JSON 형식으로만 응답하세요:

{{
  "items": [
    {{
      "section": "STRUCTURE",
      "description": "System Wall Panel – White Paint Finish",
      "quantity": 28,
      "unit": "sqm",
      "confidence": 92,
      "notes": "3,800W 메인 벽체 + 측면 벽"
    }}
  ],
  "summary": "3×6m 부스 분석 완료. 총 N개 항목 추출.",
  "confidence_overall": 88,
  "warnings": ["모스 월 패널 수량 불확실 — 도면 재확인 권장"]
}}"""

    content.append({"type": "text", "text": user_prompt})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    raw_text = response.content[0].text.strip()

    # 방어적 JSON 파싱
    try:
        cleaned = (
            raw_text
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI 응답 JSON 파싱 실패: {e}\n원문: {raw_text[:300]}")

    # Pydantic 검증
    return AIAnalysisResult(
        items=[AIExtractedItem(**item) for item in data.get("items", [])],
        summary=data.get("summary", ""),
        confidence_overall=data.get("confidence_overall", 0),
        warnings=data.get("warnings", []),
    )
