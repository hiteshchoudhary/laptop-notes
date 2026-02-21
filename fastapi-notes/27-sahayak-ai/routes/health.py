"""
Health Check Route
------------------
Simple endpoint for monitoring and load balancer health checks.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from config import settings
from models import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check if the application is running and healthy."""
    return HealthResponse(
        status="healthy",
        app=settings.APP_NAME,
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
