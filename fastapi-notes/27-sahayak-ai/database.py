"""
SahayakAI Database
------------------
SQLModel tables for conversations, messages, and usage logs.
Uses SQLite for simplicity — no external database server needed.
"""

import os
from datetime import datetime, timezone

from sqlmodel import Field, Session, SQLModel, create_engine, select

from config import settings


# ─── Table Definitions ───────────────────────────────────────

class Conversation(SQLModel, table=True):
    """A conversation session between a user and SahayakAI."""
    __tablename__ = "conversations"

    id: str = Field(primary_key=True)
    title: str = Field(default="New Conversation")
    message_count: int = Field(default=0)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class Message(SQLModel, table=True):
    """A single message in a conversation."""
    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: str = Field(index=True)
    role: str = Field(description="user, assistant, or tool")
    content: str
    tool_name: str | None = Field(default=None)
    tool_args: str | None = Field(default=None)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class UsageLog(SQLModel, table=True):
    """Log entry for tracking API usage and performance."""
    __tablename__ = "usage_logs"

    id: int | None = Field(default=None, primary_key=True)
    endpoint: str
    method: str = Field(default="POST")
    response_time_ms: float = Field(default=0.0)
    tool_calls_count: int = Field(default=0)
    tools_used: str = Field(default="")
    conversation_id: str | None = Field(default=None)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


# ─── Engine and Session ──────────────────────────────────────

def get_engine():
    """Create SQLite engine. Ensures the data directory exists."""
    db_dir = os.path.dirname(settings.DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    sqlite_url = f"sqlite:///{settings.DB_PATH}"
    engine = create_engine(
        sqlite_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
    return engine


def create_db_and_tables(engine):
    """Create all tables if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_session(engine):
    """Create a new database session."""
    return Session(engine)


# ─── Query Helpers ────────────────────────────────────────────

def get_all_conversations(engine) -> list[Conversation]:
    """Fetch all conversations, newest first."""
    with Session(engine) as session:
        statement = select(Conversation).order_by(
            Conversation.updated_at.desc()  # type: ignore[union-attr]
        )
        results = session.exec(statement)
        return list(results.all())


def get_conversation_by_id(engine, conversation_id: str) -> Conversation | None:
    """Fetch a single conversation by ID."""
    with Session(engine) as session:
        return session.get(Conversation, conversation_id)


def get_messages_for_conversation(engine, conversation_id: str) -> list[Message]:
    """Fetch all messages in a conversation, oldest first."""
    with Session(engine) as session:
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)  # type: ignore[arg-type]
        )
        results = session.exec(statement)
        return list(results.all())


def delete_conversation(engine, conversation_id: str) -> bool:
    """Delete a conversation and all its messages. Returns True if found."""
    with Session(engine) as session:
        conversation = session.get(Conversation, conversation_id)
        if not conversation:
            return False

        # Delete all messages in this conversation
        statement = select(Message).where(
            Message.conversation_id == conversation_id
        )
        messages = session.exec(statement).all()
        for msg in messages:
            session.delete(msg)

        session.delete(conversation)
        session.commit()
        return True


def log_usage(
    engine,
    endpoint: str,
    method: str,
    response_time_ms: float,
    tool_calls_count: int = 0,
    tools_used: str = "",
    conversation_id: str | None = None,
):
    """Log an API usage entry."""
    with Session(engine) as session:
        log_entry = UsageLog(
            endpoint=endpoint,
            method=method,
            response_time_ms=response_time_ms,
            tool_calls_count=tool_calls_count,
            tools_used=tools_used,
            conversation_id=conversation_id,
        )
        session.add(log_entry)
        session.commit()
