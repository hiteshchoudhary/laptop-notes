# ============================================================
# ChitraVarnan — Pydantic Models
# ============================================================
# All request/response schemas for the image analysis API.
# These models validate AI output and structure API responses.
# ============================================================

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ============================================================
# Enums
# ============================================================

class AnalysisMode(str, Enum):
    """Supported analysis modes for image processing."""
    DESCRIBE = "describe"
    TAG = "tag"
    OCR = "ocr"
    MODERATE = "moderate"
    FULL = "full"


# ============================================================
# Analysis Sub-Models
# ============================================================

class TagResult(BaseModel):
    """Structured tag extraction result from an image."""
    tags: list[str] = Field(default_factory=list, description="Relevant keywords")
    categories: list[str] = Field(
        default_factory=list, description="Product categories"
    )
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Confidence score"
    )


class OCRResult(BaseModel):
    """Optical Character Recognition result from an image."""
    extracted_text: str = Field(default="", description="All text found in image")
    language: str = Field(default="unknown", description="Detected language code")
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="OCR confidence"
    )


class ModerationResult(BaseModel):
    """Content moderation result for an image."""
    is_safe: bool = Field(default=True, description="Whether the image is safe")
    categories: dict[str, float] = Field(
        default_factory=dict,
        description="Category scores: violence, adult, hate, etc.",
    )
    reason: str = Field(
        default="", description="Reason if flagged as unsafe"
    )


# ============================================================
# Main Analysis Response
# ============================================================

class ImageAnalysis(BaseModel):
    """Complete image analysis response."""
    id: str = Field(..., description="Unique analysis ID (UUID)")
    filename: str = Field(..., description="Original filename")
    description: str = Field(default="", description="Natural language description")
    tags: TagResult | None = Field(default=None, description="Tag extraction result")
    ocr: OCRResult | None = Field(default=None, description="OCR result")
    moderation: ModerationResult | None = Field(
        default=None, description="Moderation result"
    )
    mode: AnalysisMode = Field(..., description="Analysis mode used")
    model_used: str = Field(default="gemini-1.5-flash")
    processing_time_ms: float = Field(
        default=0.0, description="Total processing time in milliseconds"
    )
    cached: bool = Field(default=False, description="Whether result was from cache")
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="Timestamp of analysis",
    )


# ============================================================
# Request Models
# ============================================================

class AnalyzeRequest(BaseModel):
    """Query parameters for analysis endpoint."""
    mode: AnalysisMode = Field(
        default=AnalysisMode.FULL,
        description="Analysis mode: describe, tag, ocr, moderate, or full",
    )


# ============================================================
# Health / Status Models
# ============================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str
    cache_stats: dict[str, int] = Field(default_factory=dict)


class CacheStats(BaseModel):
    """Cache statistics."""
    total_cached: int = 0
    expired: int = 0
    active: int = 0
