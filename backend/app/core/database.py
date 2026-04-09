from supabase import create_client, Client
from app.core.config import settings
from functools import lru_cache


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Service role 클라이언트 — 서버 전용, 절대 프론트엔드에 노출 금지"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )
