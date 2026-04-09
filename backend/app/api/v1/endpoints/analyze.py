from fastapi import APIRouter, Depends, HTTPException
from app.schemas import AIAnalysisRequest, AIAnalysisResult
from app.services.ai_service import analyze_booth_images
from app.services.price_service import apply_prices_to_items, VENUE_FACTORS
from app.core.security import get_current_user_id
import httpx
import os

router = APIRouter(prefix="/analyze", tags=["AI Analysis"])


async def _get_usd_krw() -> float:
    """환율 API에서 실시간 환율 조회 (실패 시 1370 fallback)"""
    api_key = os.getenv("EXCHANGE_RATE_API_KEY", "")
    if not api_key:
        return 1370.0
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            res = await c.get(
                f"https://v6.exchangerate-api.com/v6/{api_key}/latest/USD"
            )
            data = res.json()
            return float(data["conversion_rates"]["KRW"])
    except Exception:
        return 1370.0


@router.post("", response_model=dict)
async def analyze(
    body: AIAnalysisRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    렌더링+도면 이미지 → Claude Vision 분석 → 단가 적용 → 견적 항목 반환

    Request body:
    - rendering_base64: PNG base64 (필수)
    - drawing_base64:   PNG base64 (선택)
    - venue_name, booth_sqm, country, venue_id
    """
    try:
        # 1) Claude Vision 분석
        result: AIAnalysisResult = await analyze_booth_images(
            rendering_base64=body.rendering_base64,
            drawing_base64=body.drawing_base64,
            venue_name=body.venue_name,
            booth_sqm=body.booth_sqm,
            country=body.country,
        )

        # 2) 실시간 환율
        usd_krw = await _get_usd_krw()

        # 3) 단가 매핑
        priced_items = apply_prices_to_items(
            items=result.items,
            venue_id=body.venue_id,
            usd_krw=usd_krw,
        )

        return {
            "data": {
                "items": priced_items,
                "summary": result.summary,
                "confidence_overall": result.confidence_overall,
                "warnings": result.warnings,
                "usd_krw": usd_krw,
                "venue_factor": VENUE_FACTORS.get(body.venue_id, 0.6),
            },
            "error": None,
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 분석 오류: {e}")
