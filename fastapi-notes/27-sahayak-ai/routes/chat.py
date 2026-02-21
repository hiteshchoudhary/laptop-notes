"""
Chat Routes
-----------
REST endpoints for chatting with SahayakAI.
- POST /chat          — Send a message, get the full response
- POST /chat/stream   — Send a message, get Server-Sent Events (SSE) stream
"""

import json
import time
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from models import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest) -> ChatResponse:
    """Send a message to SahayakAI and get the complete response.

    This is the simple, non-streaming endpoint. The entire agent loop
    runs to completion, then the full response is returned.
    """
    agent = request.app.state.agent
    engine = request.app.state.engine

    start_time = time.monotonic()
    result = await agent.chat_sync(body.message, body.conversation_id)
    elapsed = (time.monotonic() - start_time) * 1000

    # Log usage
    from database import log_usage

    log_usage(
        engine=engine,
        endpoint="/chat",
        method="POST",
        response_time_ms=round(elapsed, 2),
        tool_calls_count=len(result.get("tools_used", [])),
        tools_used=",".join(result.get("tools_used", [])),
        conversation_id=result.get("conversation_id"),
    )

    return ChatResponse(
        response=result["response"],
        conversation_id=result["conversation_id"],
        tools_used=result.get("tools_used", []),
        tool_details=result.get("tool_details", []),
        response_time_ms=round(elapsed, 2),
    )


@router.post("/stream")
async def chat_stream(request: Request, body: ChatRequest) -> StreamingResponse:
    """Send a message to SahayakAI and get a Server-Sent Events stream.

    Each event is a JSON object with type and data fields.
    Types: thinking, tool_call, tool_result, chunk, done, error.

    This endpoint is useful for web frontends that want to show
    real-time progress without WebSocket complexity.
    """
    agent = request.app.state.agent

    async def event_generator():
        async for event in agent.chat(body.message, body.conversation_id):
            # Format as SSE: data: {json}\n\n
            event_json = json.dumps(event, default=str)
            yield f"data: {event_json}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
