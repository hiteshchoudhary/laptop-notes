# ============================================================
# GyanSetu — Query Routes
# ============================================================
# Endpoints for asking questions and having conversations
# with the uploaded knowledge base.
# ============================================================

import logging

from fastapi import APIRouter

from config import settings
from models import ChatRequest, ChatResponse, QueryRequest, QueryResponse
from services.embedder import GeminiEmbedder
from services.rag_engine import RAGEngine
from services.vector_store import VectorStore

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Query"])

# --- Service instances ---
embedder = GeminiEmbedder(
    api_key=settings.GEMINI_API_KEY,
    model=settings.GEMINI_EMBEDDING_MODEL,
)
vector_store = VectorStore(
    persist_path=settings.CHROMA_PERSIST_PATH,
    collection_name=settings.CHROMA_COLLECTION_NAME,
)
rag_engine = RAGEngine(
    embedder=embedder,
    vector_store=vector_store,
    gemini_model_name=settings.GEMINI_MODEL,
)


# ============================================================
# POST /query — Single question
# ============================================================
@router.post("/query", response_model=QueryResponse)
async def query_knowledge_base(request: QueryRequest) -> QueryResponse:
    """
    Ask a question about the uploaded documents.

    The system retrieves relevant chunks from ChromaDB, builds a
    context-augmented prompt, and generates an answer with Gemini.
    Source citations are included in the response.

    Optionally filter to a specific document by providing document_id.
    """
    logger.info("Query: %s", request.question[:100])

    response = rag_engine.query(
        question=request.question,
        n_results=request.n_results,
        document_id=request.document_id,
    )

    return response


# ============================================================
# POST /chat — Multi-turn conversation
# ============================================================
@router.post("/chat", response_model=ChatResponse)
async def chat_with_knowledge_base(request: ChatRequest) -> ChatResponse:
    """
    Have a multi-turn conversation with the knowledge base.

    Provide conversation history so the system can understand
    follow-up questions and references like "these", "it", etc.

    The latest message is used for retrieval; history provides
    conversational context for answer generation.
    """
    logger.info(
        "Chat message: %s (history=%d msgs)",
        request.message[:100],
        len(request.history),
    )

    response = rag_engine.chat(
        message=request.message,
        history=request.history,
        n_results=request.n_results,
        document_id=request.document_id,
    )

    return ChatResponse(
        answer=response.answer,
        sources=response.sources,
        processing_time_ms=response.processing_time_ms,
    )
