"""
FastAPI 백엔드 기본 테스트
pytest tests/ -v 로 실행
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)


# ── Health check ─────────────────────────────────────────────
def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ── Price service unit tests ─────────────────────────────────
from app.services.price_service import get_unit_price, apply_prices_to_items
from app.schemas import AIExtractedItem, QuoteSection


def test_get_unit_price_wall_panel_la():
    price = get_unit_price("System Wall Panel – White Paint Finish", "lacc")
    assert price == 95.0


def test_get_unit_price_wall_panel_bangkok():
    price_la  = get_unit_price("System Wall Panel", "lacc")
    price_bkk = get_unit_price("System Wall Panel", "impact_bkk")
    # 방콕은 LA의 38% 수준
    assert abs(price_bkk - price_la * 0.38) < 1


def test_get_unit_price_unknown_returns_zero():
    price = get_unit_price("완전히 알수없는 항목 XYZ", "lacc")
    assert price == 0.0


def test_apply_prices_to_items():
    items = [
        AIExtractedItem(
            section=QuoteSection.STRUCTURE,
            description="System Wall Panel – White",
            quantity=18,
            unit="sqm",
            confidence=90,
            notes="",
        )
    ]
    result = apply_prices_to_items(items, venue_id="impact_bkk", usd_krw=1370)
    assert len(result) == 1
    item = result[0]
    assert item["quantity"] == 18
    assert item["unit_price_usd"] > 0
    assert item["amount_usd"] == pytest.approx(item["quantity"] * item["unit_price_usd"], rel=0.01)
    assert item["amount_krw"] == round(item["amount_usd"] * 1370)


# ── Excel service unit test ───────────────────────────────────
from app.services.excel_service import generate_excel


def test_generate_excel_returns_bytes():
    quote = {
        "event_name": "HortEx Thailand 2026",
        "venue_name": "IMPACT Bangkok",
        "city": "Bangkok",
        "country": "Thailand",
        "client_name": "DONG-A ST",
        "booth_width": 6,
        "booth_depth": 3,
        "booth_sqm": 18,
        "exchange_rate_usd_krw": 1370,
    }
    items = [
        {
            "no": "2.1",
            "description": "System Wall Panel",
            "quantity": 18,
            "unit": "sqm",
            "unit_price_usd": 36.1,
            "amount_usd": 649.8,
            "amount_krw": 890226,
            "notes": "",
            "section": "STRUCTURE",
        }
    ]
    result = generate_excel(quote=quote, items=items)
    assert isinstance(result, bytes)
    assert len(result) > 1000  # 최소 크기 확인


# ── API endpoint tests (mock auth) ───────────────────────────
def test_analyze_requires_auth():
    res = client.post("/api/v1/analyze", json={
        "rendering_base64": "fake",
        "venue_name": "IMPACT",
        "booth_sqm": 18,
        "country": "Thailand",
        "venue_id": "impact_bkk",
    })
    assert res.status_code == 403  # 인증 없으면 403


def test_quotes_list_requires_auth():
    res = client.get("/api/v1/quotes")
    assert res.status_code == 403


def test_venues_public():
    """전시장 목록은 인증 없이 조회 가능"""
    # 실제 Supabase 연결이 없으므로 mock
    with patch("app.api.v1.endpoints.venues.get_supabase") as mock_sb:
        mock_execute = MagicMock()
        mock_execute.data = []
        mock_sb.return_value.table.return_value.select.return_value \
            .eq.return_value.ilike.return_value.order.return_value \
            .execute.return_value = mock_execute
        res = client.get("/api/v1/venues")
        assert res.status_code == 200
