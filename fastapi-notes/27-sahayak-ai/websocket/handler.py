"""
WebSocket Chat Handler
----------------------
Handles real-time bidirectional chat with SahayakAI.

Protocol:
  Client sends:   {"text": "...", "conversation_id": "..."}
  Server streams:  {"type": "thinking|tool_call|tool_result|chunk|done|error", "data": ...}

The handler accepts a connection, enters a receive loop, and for each
message it streams the agent's response back as a series of JSON events.
"""

import json
import logging
import time

from fastapi import WebSocket, WebSocketDisconnect

from models import WebSocketMessage

logger = logging.getLogger(__name__)


async def websocket_chat_handler(websocket: WebSocket) -> None:
    """Handle a WebSocket connection for real-time chat.

    Accepts the connection, then enters a loop:
    1. Receive a JSON message from the client
    2. Validate the message format
    3. Stream agent response events back to the client
    4. Continue until the client disconnects

    The agent and engine are accessed via websocket.app.state.
    """
    await websocket.accept()
    agent = websocket.app.state.agent
    engine = websocket.app.state.engine

    logger.info("WebSocket client connected")

    try:
        while True:
            # Receive and parse client message
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "data": "Invalid JSON. Expected: {\"text\": \"...\", \"conversation_id\": \"...\"}"
                })
                continue

            # Validate message
            text = data.get("text", "").strip()
            if not text:
                await websocket.send_json({
                    "type": "error",
                    "data": "Message text is required"
                })
                continue

            if len(text) > 2000:
                await websocket.send_json({
                    "type": "error",
                    "data": "Message too long (max 2000 characters)"
                })
                continue

            conversation_id = data.get("conversation_id")

            # Stream agent response
            start_time = time.monotonic()
            tools_used: list[str] = []

            async for event in agent.chat(text, conversation_id):
                await websocket.send_json(event)

                # Track tools used for logging
                if event.get("type") == "tool_call":
                    tool_data = event.get("data", {})
                    if isinstance(tool_data, dict):
                        tools_used.append(tool_data.get("tool", ""))

            # Log usage
            elapsed = (time.monotonic() - start_time) * 1000
            from database import log_usage

            log_usage(
                engine=engine,
                endpoint="/ws/chat",
                method="WEBSOCKET",
                response_time_ms=round(elapsed, 2),
                tool_calls_count=len(tools_used),
                tools_used=",".join(tools_used),
                conversation_id=conversation_id,
            )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as exc:
        logger.error("WebSocket error: %s", str(exc))
        try:
            await websocket.send_json({
                "type": "error",
                "data": f"Server error: {str(exc)}"
            })
        except Exception:
            pass  # Client may already be disconnected
