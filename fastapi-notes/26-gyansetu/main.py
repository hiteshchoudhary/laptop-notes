# ============================================================
# GyanSetu — Main Application Entry Point
# ============================================================
# RAG-powered knowledge base API built with FastAPI, Gemini,
# and ChromaDB.
#
# This is where everything comes together:
#   - FastAPI app initialization with lifespan
#   - Database and ChromaDB initialization
#   - CORS middleware
#   - Router inclusion for all endpoints
#
# Run with: uvicorn main:app --reload
# ============================================================

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_db_and_tables

# --- Import routers ---
from routes.documents import router as documents_router
from routes.query import router as query_router
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
    - Create SQLite tables for document metadata
    - Verify ChromaDB connectivity
    - Validate Gemini API key

    Shutdown:
    - Log shutdown (ChromaDB persistence is automatic)
    """
    logger.info("Starting GyanSetu...")

    # Create metadata tables
    create_db_and_tables()
    logger.info("Database tables created/verified")

    # Validate Gemini API key
    if not settings.GEMINI_API_KEY:
        logger.warning(
            "GEMINI_API_KEY not set! Upload and query endpoints will fail. "
            "Set it in .env or as an environment variable."
        )

    # Log ChromaDB status
    logger.info("ChromaDB persist path: %s", settings.CHROMA_PERSIST_PATH)

    logger.info(
        "GyanSetu v%s is ready! Docs at /docs",
        settings.APP_VERSION,
    )
    yield

    logger.info("Shutting down GyanSetu...")


# ============================================================
# App initialization
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "RAG-powered knowledge base API. Upload documents, ask questions "
        "in natural language, and get AI-generated answers with source "
        "citations — powered by Gemini embeddings and ChromaDB."
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
app.include_router(documents_router)
app.include_router(query_router)
app.include_router(health_router)


# ============================================================
# Root endpoint
# ============================================================
@app.get("/", tags=["Root"])
async def root() -> dict:
    """API root — basic info about GyanSetu."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "RAG Knowledge Base API powered by Gemini and ChromaDB",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "upload": "POST /documents/upload",
            "documents": "GET /documents",
            "query": "POST /query",
            "chat": "POST /chat",
            "stats": "GET /stats",
        },
    }
