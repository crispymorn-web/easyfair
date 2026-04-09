from fastapi import APIRouter
from app.api.v1.endpoints import analyze, quotes, export, venues

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(analyze.router)
api_router.include_router(quotes.router)
api_router.include_router(export.router)
api_router.include_router(venues.router)
