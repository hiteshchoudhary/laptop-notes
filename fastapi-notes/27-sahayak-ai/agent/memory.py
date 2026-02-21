"""
SahayakAI Conversation Memory
------------------------------
Manages conversation history in SQLite. Provides methods to save messages,
load history, and manage conversations. Uses a sliding window to keep
context within the LLM's limits.
"""

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Session, select

from database import Conversation, Message


class ConversationMemory:
    """Persist and retrieve conversation history from SQLite."""

    def __init__(self, engine, max_history: int = 20):
        self._engine = engine
        self._max_history = max_history

    def create_conversation(self, conversation_id: str | None = None) -> str:
        """Create a new conversation. Returns the conversation ID."""
        conv_id = conversation_id or f"conv_{uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        with Session(self._engine) as session:
            existing = session.get(Conversation, conv_id)
            if existing:
                return conv_id

            conversation = Conversation(
                id=conv_id,
                title="New Conversation",
                message_count=0,
                created_at=now,
                updated_at=now,
            )
            session.add(conversation)
            session.commit()

        return conv_id

    def get_or_create_conversation(self, conversation_id: str | None = None) -> str:
        """Get existing conversation or create a new one."""
        if conversation_id:
            with Session(self._engine) as session:
                existing = session.get(Conversation, conversation_id)
                if existing:
                    return conversation_id
        return self.create_conversation(conversation_id)

    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        tool_name: str | None = None,
        tool_args: dict | None = None,
    ) -> None:
        """Save a message to the conversation history."""
        now = datetime.now(timezone.utc).isoformat()
        args_json = json.dumps(tool_args) if tool_args else None

        with Session(self._engine) as session:
            message = Message(
                conversation_id=conversation_id,
                role=role,
                content=content,
                tool_name=tool_name,
                tool_args=args_json,
                created_at=now,
            )
            session.add(message)

            # Update conversation metadata
            conversation = session.get(Conversation, conversation_id)
            if conversation:
                conversation.message_count += 1
                conversation.updated_at = now

                # Auto-title from first user message
                if conversation.title == "New Conversation" and role == "user":
                    title = content[:60]
                    if len(content) > 60:
                        title += "..."
                    conversation.title = title

            session.commit()

    async def load_history(self, conversation_id: str) -> list[dict]:
        """Load conversation history, applying the sliding window limit.

        Returns a list of dicts with keys: role, content.
        Only returns the most recent N messages (configurable via max_history).
        """
        with Session(self._engine) as session:
            statement = (
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)  # type: ignore[arg-type]
            )
            results = session.exec(statement)
            all_messages = list(results.all())

        # Apply sliding window — keep only the most recent messages
        if len(all_messages) > self._max_history:
            all_messages = all_messages[-self._max_history:]

        history = []
        for msg in all_messages:
            entry = {"role": msg.role, "content": msg.content}
            if msg.tool_name:
                entry["tool_name"] = msg.tool_name
            if msg.tool_args:
                entry["tool_args"] = msg.tool_args
            history.append(entry)

        return history

    async def get_conversation_messages(
        self, conversation_id: str
    ) -> list[dict]:
        """Get ALL messages for a conversation (for API display, not LLM context)."""
        with Session(self._engine) as session:
            statement = (
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)  # type: ignore[arg-type]
            )
            results = session.exec(statement)
            messages = list(results.all())

        return [
            {
                "role": msg.role,
                "content": msg.content,
                "tool_name": msg.tool_name,
                "tool_args": msg.tool_args,
                "created_at": msg.created_at,
            }
            for msg in messages
        ]
