"""
전시장별 시세 DB 서비스
AI가 추출한 항목 description을 읽어 적절한 기준 단가를 반환합니다.
venue_factor를 곱해 현지 시세로 변환합니다.
"""
from typing import Optional
from app.schemas import AIExtractedItem, QuoteSection

# ── LA 기준 단가 (USD) ────────────────────────────────────────────────────
BASE_PRICES: dict[str, float] = {
    # SPACE_VENUE
    "raw_space_sqm": 450,
    "shell_scheme_sqm": 280,
    "exhibitor_badge": 120,
    "move_in_out": 600,
    "cleaning_day": 30,

    # STRUCTURE
    "wall_panel_sqm": 95,
    "wood_laminate_sqm": 130,
    "ceiling_sqm": 70,
    "storage_room": 1200,
    "carpet_sqm": 35,
    "display_counter": 1800,
    "moss_wall": 650,
    "labor_carpenter_day": 1200,
    "header_box_sqm": 70,
    "flooring_sqm": 35,

    # GRAPHICS
    "header_signage_set": 850,
    "graphic_large_pc": 480,
    "graphic_medium_pc": 320,
    "graphic_small_pc": 250,
    "vinyl_lettering_set": 180,
    "graphic_design_lot": 1200,
    "forex_foam_sqm": 85,

    # AV_ELECTRICAL
    "tv_55_rental": 900,
    "tv_65_rental": 1200,
    "electrical_5kw": 650,
    "electrical_3kw": 450,
    "led_spotlight_pc": 65,
    "power_distribution_lot": 180,

    # FURNITURE
    "round_table_rental": 120,
    "chair_rental": 45,
    "brochure_stand": 150,
    "misc_accessories_lot": 80,
    "reception_counter": 1800,

    # LOGISTICS
    "pm_day": 500,
    "transport_lot": 800,
    "teardown_lot": 600,
    "contingency_lot": 750,
    "vat_lot": 280,
}

# 전시장별 비용 계수 (LA = 1.0)
VENUE_FACTORS: dict[str, float] = {
    "lacc":         1.00,
    "impact_bkk":   0.38,
    "kintex":       0.52,
    "coex":         0.55,
    "tokyo_bs":     0.75,
    "messe_ffm":    0.82,
    "sg_expo":      0.65,
    "bitec_bkk":    0.36,
    "default":      0.60,
}

# 키워드 → 단가 키 매핑
KEYWORD_MAP: list[tuple[list[str], str]] = [
    (["raw space", "space rental", "임차"],            "raw_space_sqm"),
    (["shell scheme"],                                  "shell_scheme_sqm"),
    (["badge", "배지"],                                 "exhibitor_badge"),
    (["move-in", "move in", "handling", "반입"],        "move_in_out"),
    (["cleaning", "청소"],                              "cleaning_day"),
    (["wall panel", "system wall", "벽체"],             "wall_panel_sqm"),
    (["wood laminate", "wood feature", "우드"],         "wood_laminate_sqm"),
    (["ceiling", "header box", "천장"],                 "ceiling_sqm"),
    (["storage", "lockable", "보관실"],                  "storage_room"),
    (["carpet", "flooring", "바닥"],                    "carpet_sqm"),
    (["display counter", "reception", "카운터"],        "display_counter"),
    (["moss", "green wall", "모스"],                    "moss_wall"),
    (["labor", "carpenter", "인력", "인건"],             "labor_carpenter_day"),
    (["header sign", "sticker cut", "signage"],         "header_signage_set"),
    (["graphic", "forex", "그래픽"],                    "graphic_large_pc"),
    (["vinyl", "lettering", "레터링"],                  "vinyl_lettering_set"),
    (["design", "artwork", "디자인"],                   "graphic_design_lot"),
    (["55", 'tv', 'display'],                           "tv_55_rental"),
    (["65", "large tv"],                                "tv_65_rental"),
    (["electrical", "power", "전기"],                   "electrical_5kw"),
    (["spotlight", "led", "조명"],                      "led_spotlight_pc"),
    (["extension", "distribution", "배전"],             "power_distribution_lot"),
    (["round table", "테이블"],                         "round_table_rental"),
    (["chair", "의자"],                                 "chair_rental"),
    (["brochure", "literature", "팸플릿"],              "brochure_stand"),
    (["pm", "project management", "supervision"],       "pm_day"),
    (["transport", "freight", "운송"],                  "transport_lot"),
    (["teardown", "dismantling", "철거"],               "teardown_lot"),
    (["vat", "tax", "부가세"],                          "vat_lot"),
    (["contingency", "miscellaneous", "예비"],          "contingency_lot"),
]


def get_unit_price(description: str, venue_id: str) -> float:
    """description 키워드 매칭으로 기준 단가 찾고 venue_factor 적용"""
    desc_lower = description.lower()
    factor = VENUE_FACTORS.get(venue_id, VENUE_FACTORS["default"])

    for keywords, price_key in KEYWORD_MAP:
        if any(kw in desc_lower for kw in keywords):
            base = BASE_PRICES.get(price_key, 0)
            return round(base * factor, 2)

    # 매칭 실패 시 0 반환 (사용자가 수동 입력)
    return 0.0


def apply_prices_to_items(
    items: list[AIExtractedItem],
    venue_id: str,
    usd_krw: float,
) -> list[dict]:
    """AI 추출 항목에 단가 적용 → QuoteItem dict 목록 반환"""
    result = []
    for i, item in enumerate(items):
        unit_price = get_unit_price(item.description, venue_id)
        amount_usd = round(item.quantity * unit_price, 2)
        amount_krw = round(amount_usd * usd_krw)

        # 섹션 접두어 추출 (1~6)
        section_order = [
            "SPACE_VENUE", "STRUCTURE", "GRAPHICS",
            "AV_ELECTRICAL", "FURNITURE", "LOGISTICS",
        ]
        sec_idx = section_order.index(item.section.value) + 1

        result.append({
            "no": f"{sec_idx}.{i + 1}",
            "description": item.description,
            "quantity": item.quantity,
            "unit": item.unit,
            "unit_price_usd": unit_price,
            "amount_usd": amount_usd,
            "amount_krw": amount_krw,
            "notes": item.notes,
            "section": item.section.value,
            "ai_confidence": item.confidence,
        })

    return result
