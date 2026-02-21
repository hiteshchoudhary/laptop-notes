# ============================================================
# GyanSetu — Pydantic Models
# ============================================================
# All request/response schemas for the RAG knowledge base API.
# Covers documents, chunks, queries, chat, and sources.
# ============================================================

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ============================================================
# Enums
# ============================================================

class ChunkStrategy(str, Enum):
    """Supported text chunking strategies."""
    FIXED = "fixed"
    SENTENCE = "sentence"
    PARAGRAPH = "paragraph"


# ============================================================
# Document Models
# ============================================================

class DocumentUploadResponse(BaseModel):
    """Response after successfully uploading and processing a document."""
    id: str = Field(..., description="Unique document ID")
    title: str = Field(..., description="Document title")
    filename: str = Field(..., description="Original filename")
    chunk_count: int = Field(..., description="Number of chunks created")
    chunk_strategy: ChunkStrategy = Field(..., description="Chunking strategy used")
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="Upload timestamp",
    )


class DocumentInfo(BaseModel):
    """Document metadata for listing."""
    id: str
    title: str
    filename: str
    chunk_count: int
    chunk_strategy: str
    file_size_bytes: int = 0
    created_at: str = ""


class DocumentListResponse(BaseModel):
    """Response for listing all documents."""
    documents: list[DocumentInfo] = Field(default_factory=list)
    total: int = 0


# ============================================================
# Chunk Models
# ============================================================

class Chunk(BaseModel):
    """A text chunk extracted from a document."""
    id: str = Field(..., description="Unique chunk ID")
    document_id: str = Field(..., description="Parent document ID")
    text: str = Field(..., description="Chunk text content")
    chunk_index: int = Field(..., description="Position in document")
    metadata: dict = Field(default_factory=dict)


# ============================================================
# Query Models
# ============================================================

class QueryRequest(BaseModel):
    """Request body for a single question query."""
    question: str = Field(
        ..., min_length=3, max_length=1000,
        description="Natural language question",
    )
    n_results: int = Field(
        default=5, ge=1, le=20,
        description="Number of chunks to retrieve",
    )
    document_id: str | None = Field(
        default=None,
        description="Optional: limit search to a specific document",
    )


class Source(BaseModel):
    """A source citation from a retrieved chunk."""
    document_name: str = Field(..., description="Source document filename")
    chunk_index: int = Field(..., description="Chunk position in document")
    relevance_score: float = Field(
        ..., ge=0.0, le=1.0, description="Semantic similarity score"
    )
    text_preview: str = Field(..., description="First 200 chars of chunk")


class QueryResponse(BaseModel):
    """Response to a knowledge query."""
    answer: str = Field(..., description="AI-generated answer")
    sources: list[Source] = Field(
        default_factory=list, description="Source citations"
    )
    processing_time_ms: float = Field(
        default=0.0, description="Total processing time"
    )


# ============================================================
# Chat Models
# ============================================================

class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request body for a chat turn with conversation history."""
    message: str = Field(
        ..., min_length=1, max_length=1000,
        description="Latest user message",
    )
    history: list[ChatMessage] = Field(
        default_factory=list,
        description="Previous conversation messages",
    )
    n_results: int = Field(
        default=5, ge=1, le=20,
        description="Number of chunks to retrieve",
    )
    document_id: str | None = Field(
        default=None,
        description="Optional: limit search to a specific document",
    )


class ChatResponse(BaseModel):
    """Response to a chat message."""
    answer: str = Field(..., description="AI-generated response")
    sources: list[Source] = Field(default_factory=list)
    processing_time_ms: float = 0.0


# ============================================================
# Health / Stats Models
# ============================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = ""
    services: dict[str, str] = Field(default_factory=dict)


class StatsResponse(BaseModel):
    """System statistics."""
    total_documents: int = 0
    total_chunks: int = 0
    database_size_bytes: int = 0
    chroma_collection_count: int = 0
