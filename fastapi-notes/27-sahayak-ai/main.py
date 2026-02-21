"""
SahayakAI — AI Agent with Function Calling & Tools
===================================================
FastAPI application entry point.

Startup:
    uvicorn main:app --reload

Features:
    - Multi-turn AI chat with Gemini function calling
    - Built-in tools: weather, currency, calculator, search, datetime
    - WebSocket streaming for real-time responses
    - Conversation memory with SQLite
    - Admin dashboard API for monitoring usage
    - Docker-ready deployment
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket

from agent.core import SahayakAgent
from agent.memory import ConversationMemory
from agent.tools import create_default_tools
from config import settings
from database import create_db_and_tables, get_engine
from middleware.usage_tracker import UsageTrackerMiddleware
from routes.admin import router as admin_router
from routes.chat import router as chat_router
from routes.conversations import router as conversations_router
from routes.health import router as health_router
from websocket.handler import websocket_chat_handler

# ─── Logging ──────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: runs on startup and shutdown.

    Startup:
        - Create database engine and tables
        - Initialize the tool registry with built-in tools
        - Create the conversation memory manager
        - Create the SahayakAgent instance
        - Store everything in app.state for access in routes

    Shutdown:
        - Clean up resources
    """
    logger.info("Starting %s...", settings.APP_NAME)

    # Database
    engine = get_engine()
    create_db_and_tables(engine)
    app.state.engine = engine
    logger.info("Database initialized at %s", settings.DB_PATH)

    # Tools
    tool_registry = create_default_tools()
    logger.info("Registered %d tools: %s", len(tool_registry), tool_registry.list_tools())

    # Memory
    memory = ConversationMemory(
        engine=engine,
        max_history=settings.MAX_HISTORY_MESSAGES,
    )

    # Agent
    agent = SahayakAgent(
        tool_registry=tool_registry,
        memory=memory,
        system_prompt=settings.SYSTEM_PROMPT,
        model_name=settings.GEMINI_MODEL,
    )
    app.state.agent = agent
    logger.info("SahayakAgent initialized with model: %s", settings.GEMINI_MODEL)

    # Track start time for uptime calculation
    app.state.start_time = time.monotonic()

    logger.info("%s is ready!", settings.APP_NAME)

    yield

    # Shutdown
    logger.info("Shutting down %s...", settings.APP_NAME)
    app.state.engine = None
    app.state.agent = None


# ─── App ──────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI Agent for Indian small businesses. Ask about weather, "
        "convert currencies, do calculations, search the web, and more. "
        "SahayakAI uses Gemini function calling to decide which tools to "
        "invoke and streams real-time responses via WebSocket."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Middleware ───────────────────────────────────────────────

app.add_middleware(UsageTrackerMiddleware)


# ─── REST Routes ──────────────────────────────────────────────

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(admin_router)


# ─── WebSocket Route ─────────────────────────────────────────

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time chat with SahayakAI.

    Send: {"text": "your message", "conversation_id": "optional_id"}
    Receive: {"type": "thinking|tool_call|tool_result|chunk|done|error", "data": ...}
    """
    await websocket_chat_handler(websocket)


# ─── Root ─────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    """Welcome endpoint with API information."""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "description": "AI Agent for Indian small businesses",
        "endpoints": {
            "chat": "POST /chat",
            "stream": "POST /chat/stream",
            "websocket": "ws://localhost:8000/ws/chat",
            "conversations": "GET /conversations",
            "admin": "GET /admin/stats",
            "health": "GET /health",
            "docs": "GET /docs",
        },
    }
