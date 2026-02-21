# ============================================================
# GyanSetu — Health and Stats Routes
# ============================================================
# Health check for monitoring and stats for the dashboard.
# ============================================================

import logging
import os

from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from config import settings
from database import Document, get_session
from models import HealthResponse, StatsResponse
from services.vector_store import VectorStore

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])

vector_store = VectorStore(
    persist_path=settings.CHROMA_PERSIST_PATH,
    collection_name=settings.CHROMA_COLLECTION_NAME,
)


# ============================================================
# GET /health — Health check
# ============================================================
@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint for Docker, load balancers, and monitoring.

    Reports the status of the application and its dependencies:
    - app: FastAPI server status
    - chromadb: Vector store connectivity
    - gemini: API key configuration status
    """
    services_status: dict[str, str] = {
        "app": "healthy",
    }

    # Check ChromaDB
    try:
        count = vector_store.get_count()
        services_status["chromadb"] = f"healthy ({count} chunks)"
    except Exception as e:
        services_status["chromadb"] = f"unhealthy: {str(e)}"

    # Check Gemini API key
    if settings.GEMINI_API_KEY:
        services_status["gemini"] = "configured"
    else:
        services_status["gemini"] = "not configured (set GEMINI_API_KEY)"

    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        services=services_status,
    )


# ============================================================
# GET /stats — System statistics
# ============================================================
@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    session: Session = Depends(get_session),
) -> StatsResponse:
    """
    Get system statistics: document count, chunk count, storage size.
    """
    # Count documents from SQLite
    total_docs_result = session.exec(
        select(func.count()).select_from(Document)
    ).one()
    total_docs = total_docs_result or 0

    # Count chunks from ChromaDB
    chroma_count = vector_store.get_count()

    # Get database file size
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_size = 0
    if os.path.exists(db_path):
        db_size = os.path.getsize(db_path)

    return StatsResponse(
        total_documents=total_docs,
        total_chunks=chroma_count,
        database_size_bytes=db_size,
        chroma_collection_count=chroma_count,
    )
