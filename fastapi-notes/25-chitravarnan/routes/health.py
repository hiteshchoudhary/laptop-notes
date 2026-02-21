# ============================================================
# ChitraVarnan — Health Check Route
# ============================================================
# Simple health check endpoint for monitoring and load balancers.
# ============================================================

from fastapi import APIRouter

from config import settings
from models import HealthResponse
from services.cache import CacheService

router = APIRouter(tags=["Health"])

cache_service = CacheService(
    db_path=settings.CACHE_DB_PATH,
    ttl_hours=settings.CACHE_TTL_HOURS,
)


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.

    Returns application status, version, and cache statistics.
    Used by Docker health checks, load balancers, and monitoring tools.
    """
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        cache_stats=cache_service.get_stats(),
    )
