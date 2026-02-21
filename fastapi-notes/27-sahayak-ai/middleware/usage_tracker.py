"""
Usage Tracker Middleware
-----------------------
Tracks API usage (request count, response time) for monitoring purposes.
Logs each HTTP request to the usage_logs table in SQLite.

Note: WebSocket usage is tracked separately in the WebSocket handler,
since middleware does not intercept WebSocket frames.
"""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Endpoints to skip tracking (health checks generate too much noise)
_SKIP_ENDPOINTS = {"/health", "/docs", "/redoc", "/openapi.json", "/favicon.ico"}


class UsageTrackerMiddleware(BaseHTTPMiddleware):
    """Middleware that logs request timing and metadata to SQLite.

    For each HTTP request (except health/docs), records:
    - Endpoint path
    - HTTP method
    - Response time in milliseconds

    Tool call counts are tracked at the route level (in chat routes)
    because middleware cannot inspect the response body efficiently.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip tracking for noise endpoints
        path = request.url.path
        if path in _SKIP_ENDPOINTS:
            return await call_next(request)

        start_time = time.monotonic()
        response = await call_next(request)
        elapsed_ms = (time.monotonic() - start_time) * 1000

        # Log usage asynchronously (best effort — do not fail the request)
        try:
            engine = request.app.state.engine
            if engine is not None:
                from database import log_usage

                log_usage(
                    engine=engine,
                    endpoint=path,
                    method=request.method,
                    response_time_ms=round(elapsed_ms, 2),
                )
        except Exception as exc:
            logger.warning("Failed to log usage: %s", str(exc))

        return response
