from fastapi import APIRouter, Query
from app.core.database import get_supabase

router = APIRouter(prefix="/venues", tags=["Venues"])


@router.get("")
async def list_venues(
    country: str | None = Query(None),
    q: str | None = Query(None),
):
    """전시장 목록 조회 (국가·키워드 필터)"""
    sb = get_supabase()
    query = sb.table("venues").select("*").eq("active", True)
    if country:
        query = query.eq("country_code", country.upper())
    if q:
        query = query.ilike("name", f"%{q}%")
    res = query.order("country").execute()
    return res.data or []


@router.get("/{venue_id}")
async def get_venue(venue_id: str):
    sb = get_supabase()
    res = (
        sb.table("venues")
        .select("*")
        .eq("id", venue_id)
        .maybe_single()
        .execute()
    )
    return res.data or {}
