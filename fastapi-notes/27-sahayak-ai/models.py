"""
SahayakAI Data Models
---------------------
Pydantic models for request/response schemas.
SQLModel tables are defined in database.py.
"""

from datetime import datetime
from pydantic import BaseModel, Field


# ─── Request Models ──────────────────────────────────────────

class ChatRequest(BaseModel):
    """Request body for POST /chat and POST /chat/stream."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's message to the AI agent"
    )
    conversation_id: str | None = Field(
        default=None,
        description="Optional conversation ID for multi-turn chat"
    )


class WebSocketMessage(BaseModel):
    """Message format for WebSocket communication (client to server)."""
    text: str = Field(..., min_length=1, max_length=2000)
    conversation_id: str | None = None


# ─── Response Models ─────────────────────────────────────────

class ToolCallInfo(BaseModel):
    """Information about a single tool call made by the agent."""
    tool: str
    args: dict
    result: str | None = None
    error: str | None = None
    duration_ms: float = 0.0


class ChatResponse(BaseModel):
    """Response body for POST /chat."""
    response: str
    conversation_id: str
    tools_used: list[str] = []
    tool_details: list[ToolCallInfo] = []
    response_time_ms: float = 0.0


class StreamEvent(BaseModel):
    """A single event in the streaming response (WebSocket or SSE)."""
    type: str = Field(
        ...,
        description="Event type: thinking, tool_call, tool_result, chunk, done, error"
    )
    data: str | dict


class ConversationSummary(BaseModel):
    """Summary of a conversation for listing."""
    id: str
    title: str
    message_count: int
    created_at: datetime
    updated_at: datetime


class ConversationDetail(BaseModel):
    """Full conversation with messages."""
    id: str
    title: str
    messages: list[dict]
    message_count: int
    created_at: datetime
    updated_at: datetime


class MessageInfo(BaseModel):
    """A single message in a conversation."""
    role: str
    content: str
    tool_name: str | None = None
    tool_args: str | None = None
    created_at: datetime


# ─── Admin Models ────────────────────────────────────────────

class AdminStats(BaseModel):
    """Overall usage statistics."""
    total_conversations: int
    total_messages: int
    total_tool_calls: int
    avg_response_time_ms: float
    uptime_seconds: float


class DailyUsage(BaseModel):
    """Usage data for a single day."""
    date: str
    request_count: int
    tool_calls_count: int


class ToolUsageStats(BaseModel):
    """Tool call frequency statistics."""
    tool_name: str
    call_count: int
    avg_duration_ms: float
    error_count: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    app: str
    version: str = "1.0.0"
    timestamp: str
