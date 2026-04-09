from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────
class QuoteSection(str, Enum):
    SPACE_VENUE   = "SPACE_VENUE"
    STRUCTURE     = "STRUCTURE"
    GRAPHICS      = "GRAPHICS"
    AV_ELECTRICAL = "AV_ELECTRICAL"
    FURNITURE     = "FURNITURE"
    LOGISTICS     = "LOGISTICS"


class QuoteStatus(str, Enum):
    DRAFT    = "draft"
    COMPLETE = "complete"
    SHARED   = "shared"


class BoothType(str, Enum):
    RAW_SPACE    = "raw_space"
    SHELL_SCHEME = "shell_scheme"


# ── Quote Item ─────────────────────────────────────────────────────────────
class QuoteItemBase(BaseModel):
    no: str
    description: str
    quantity: float
    unit: str
    unit_price_usd: float
    notes: str = ""
    section: QuoteSection
    ai_confidence: Optional[int] = None  # 0-100


class QuoteItemCreate(QuoteItemBase):
    pass


class QuoteItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price_usd: Optional[float] = None
    notes: Optional[str] = None


class QuoteItem(QuoteItemBase):
    id: str
    quote_id: str
    amount_usd: float
    amount_krw: int

    class Config:
        from_attributes = True


# ── Quote ──────────────────────────────────────────────────────────────────
class QuoteCreate(BaseModel):
    event_name: str
    venue_id: str
    venue_name: str
    country: str
    city: str
    show_month: str                          # "2026-05"
    booth_type: BoothType = BoothType.RAW_SPACE
    booth_width: float = Field(gt=0, le=100)
    booth_depth: float = Field(gt=0, le=100)
    client_name: str
    contact_name: Optional[str] = None
    notes: Optional[str] = None


class QuoteUpdate(BaseModel):
    status: Optional[QuoteStatus] = None
    client_name: Optional[str] = None
    notes: Optional[str] = None
    exchange_rate_usd_krw: Optional[float] = None


class QuoteRead(BaseModel):
    id: str
    user_id: str
    status: QuoteStatus
    event_name: str
    venue_id: str
    venue_name: str
    country: str
    city: str
    show_month: str
    booth_type: BoothType
    booth_width: float
    booth_depth: float
    booth_sqm: float
    client_name: str
    contact_name: Optional[str]
    notes: Optional[str]
    exchange_rate_usd_krw: float
    total_usd: float
    total_krw: int
    ai_analyzed: bool
    rendering_urls: List[str]
    drawing_urls: List[str]
    created_at: datetime
    updated_at: datetime
    items: List[QuoteItem] = []

    class Config:
        from_attributes = True


# ── AI Analysis ────────────────────────────────────────────────────────────
class AIAnalysisRequest(BaseModel):
    rendering_base64: str
    drawing_base64: Optional[str] = None
    venue_name: str
    booth_sqm: float
    country: str
    venue_id: str


class AIExtractedItem(BaseModel):
    section: QuoteSection
    description: str
    quantity: float
    unit: str
    confidence: int = Field(ge=0, le=100)
    notes: str = ""


class AIAnalysisResult(BaseModel):
    items: List[AIExtractedItem]
    summary: str
    confidence_overall: int
    warnings: List[str] = []


# ── Venue ──────────────────────────────────────────────────────────────────
class VenueRead(BaseModel):
    id: str
    name: str
    name_ko: str
    country: str
    country_code: str
    city: str
    raw_space_usd_sqm_min: float
    raw_space_usd_sqm_max: float
    max_height_m: float
    union_labor_required: bool
    eac_required: bool
    vat_rate: float
    local_cost_factor: float
    notes: str

    class Config:
        from_attributes = True


# ── Excel Export Request ───────────────────────────────────────────────────
class ExportRequest(BaseModel):
    quote_id: str
    format: Literal["xlsx", "pdf"] = "xlsx"
