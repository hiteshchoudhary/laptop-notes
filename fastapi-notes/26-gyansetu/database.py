# ============================================================
# GyanSetu — Database Setup (SQLModel)
# ============================================================
# SQLModel tables for tracking document metadata.
# ChromaDB stores embeddings; SQLite stores document info.
# ============================================================

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel, create_engine, Session

from config import settings

# ============================================================
# Database Models (tables)
# ============================================================


class Document(SQLModel, table=True):
    """
    Tracks uploaded document metadata.

    The actual text chunks and embeddings live in ChromaDB.
    This table provides a relational view of documents for
    listing, filtering, and management.
    """

    id: str = Field(primary_key=True)
    title: str = Field(index=True)
    filename: str
    file_size_bytes: int = Field(default=0)
    chunk_count: int = Field(default=0)
    chunk_strategy: str = Field(default="sentence")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


# ============================================================
# Engine and session management
# ============================================================

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False},  # SQLite needs this
)


def create_db_and_tables() -> None:
    """Create all SQLModel tables if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """
    FastAPI dependency that provides a database session.

    Usage:
        @app.get("/")
        def endpoint(session: Session = Depends(get_session)):
            ...
    """
    with Session(engine) as session:
        yield session
