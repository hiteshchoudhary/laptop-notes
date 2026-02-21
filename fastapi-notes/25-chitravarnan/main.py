# ============================================================
# ChitraVarnan — Main Application Entry Point
# ============================================================
# AI-powered image analysis API built with FastAPI and Gemini.
#
# This is where everything comes together:
#   - FastAPI app initialization with lifespan
#   - CORS middleware for cross-origin requests
#   - Router inclusion for all endpoints
#   - Root endpoint with API info
#
# Run with: uvicorn main:app --reload
# ============================================================

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from services.cache import CacheService

# --- Import routers ---
from routes.analyze import router as analyze_router
from routes.health import router as health_router

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ============================================================
# Lifespan: startup and shutdown logic
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    Startup:
    - Initialize the cache database
    - Validate configuration
    - Log startup info

    Shutdown:
    - Clear expired cache entries
    """
    logger.info("Starting ChitraVarnan...")

    # Initialize cache
    cache = CacheService(
        db_path=settings.CACHE_DB_PATH,
        ttl_hours=settings.CACHE_TTL_HOURS,
    )
    stats = cache.get_stats()
    logger.info("Cache initialized: %d active entries", stats["active"])

    # Validate Gemini API key
    if not settings.GEMINI_API_KEY:
        logger.warning(
            "GEMINI_API_KEY not set! Analysis endpoints will fail. "
            "Set it in .env or as an environment variable."
        )

    logger.info(
        "ChitraVarnan v%s is ready! Docs at /docs",
        settings.APP_VERSION,
    )
    yield

    # Shutdown cleanup
    logger.info("Shutting down ChitraVarnan...")
    deleted = cache.clear_expired()
    logger.info("Cleared %d expired cache entries", deleted)


# ============================================================
# App initialization
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered image analysis API. Upload images and get structured "
        "analysis: descriptions, tags, OCR text extraction, and content "
        "moderation — powered by Google Gemini Vision."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


# ============================================================
# Middleware
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Include routers
# ============================================================
app.include_router(analyze_router)
app.include_router(health_router)


# ============================================================
# Root endpoint
# ============================================================
@app.get("/", tags=["Root"])
async def root() -> dict:
    """API root — basic info about ChitraVarnan."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "AI Image Analysis API powered by Gemini Vision",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "analyze": "POST /analyze (single image)",
            "batch": "POST /analyze/batch (up to 10 images)",
            "retrieve": "GET /analyze/{id} (previous result)",
        },
    }
