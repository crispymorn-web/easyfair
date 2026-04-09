from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import QuoteCreate, QuoteUpdate, QuoteRead
from app.core.security import get_current_user_id
from app.core.database import get_supabase
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/quotes", tags=["Quotes"])


def _recalc_totals(items: list[dict], usd_krw: float) -> tuple[float, int]:
    total_usd = sum(i.get("amount_usd", 0) for i in items)
    total_krw = round(total_usd * usd_krw)
    return total_usd, total_krw


@router.get("", response_model=List[dict])
async def list_quotes(user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    res = (
        sb.table("quotes")
        .select("*, quote_items(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.post("", response_model=dict, status_code=201)
async def create_quote(
    body: QuoteCreate,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()

    # 월 한도 체크
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0).isoformat()
    count_res = (
        sb.table("quotes")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", month_start)
        .execute()
    )
    count = count_res.count or 0

    profile_res = (
        sb.table("user_profiles")
        .select("plan")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    plan = (profile_res.data or {}).get("plan", "free")
    limits = {"free": 3, "pro": 9999, "business": 9999}
    if count >= limits.get(plan, 3):
        raise HTTPException(
            status_code=429,
            detail=f"월 견적 한도({limits.get(plan,3)}건) 초과. 플랜 업그레이드가 필요합니다.",
        )

    row = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "status": "draft",
        "booth_sqm": body.booth_width * body.booth_depth,
        "exchange_rate_usd_krw": 1370,
        "total_usd": 0,
        "total_krw": 0,
        "ai_analyzed": False,
        "rendering_urls": [],
        "drawing_urls": [],
        **body.model_dump(),
    }
    res = sb.table("quotes").insert(row).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="견적 생성 실패")
    return res.data[0]


@router.get("/{quote_id}", response_model=dict)
async def get_quote(
    quote_id: str,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    res = (
        sb.table("quotes")
        .select("*, quote_items(*)")
        .eq("id", quote_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="견적을 찾을 수 없습니다.")
    return res.data


@router.patch("/{quote_id}", response_model=dict)
async def update_quote(
    quote_id: str,
    body: QuoteUpdate,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    patch = body.model_dump(exclude_none=True)
    patch["updated_at"] = datetime.utcnow().isoformat()
    res = (
        sb.table("quotes")
        .update(patch)
        .eq("id", quote_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="견적을 찾을 수 없습니다.")
    return res.data[0]


@router.delete("/{quote_id}", status_code=204)
async def delete_quote(
    quote_id: str,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    sb.table("quotes").delete().eq("id", quote_id).eq("user_id", user_id).execute()


@router.post("/{quote_id}/items", response_model=dict, status_code=201)
async def upsert_items(
    quote_id: str,
    items: list[dict],
    user_id: str = Depends(get_current_user_id),
):
    """견적 아이템 일괄 저장 (replace)"""
    sb = get_supabase()

    # 기존 아이템 삭제 후 재삽입
    sb.table("quote_items").delete().eq("quote_id", quote_id).execute()

    rows = [
        {**item, "id": str(uuid.uuid4()), "quote_id": quote_id}
        for item in items
    ]
    if rows:
        sb.table("quote_items").insert(rows).execute()

    # 합계 재계산
    usd_krw_res = (
        sb.table("quotes")
        .select("exchange_rate_usd_krw")
        .eq("id", quote_id)
        .single()
        .execute()
    )
    usd_krw = (usd_krw_res.data or {}).get("exchange_rate_usd_krw", 1370)
    total_usd, total_krw = _recalc_totals(rows, usd_krw)

    sb.table("quotes").update({
        "total_usd": total_usd,
        "total_krw": total_krw,
        "status": "complete",
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", quote_id).execute()

    return {"saved": len(rows), "total_usd": total_usd, "total_krw": total_krw}
