"""
SahayakAI Routes Package
------------------------
REST API endpoints for chat, conversations, admin, and health.
"""

from routes.chat import router as chat_router
from routes.conversations import router as conversations_router
from routes.admin import router as admin_router
from routes.health import router as health_router

__all__ = ["chat_router", "conversations_router", "admin_router", "health_router"]
