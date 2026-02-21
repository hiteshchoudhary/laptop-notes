# ============================================================
# GyanSetu — Document Management Routes
# ============================================================
# Upload, list, and delete documents. On upload, documents are
# loaded, chunked, embedded, and stored in ChromaDB.
# ============================================================

import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from config import settings
from database import Document, get_session
from models import (
    ChunkStrategy,
    DocumentInfo,
    DocumentListResponse,
    DocumentUploadResponse,
)
from services.chunker import get_chunker
from services.document_loader import DocumentLoader, DocumentLoadError
from services.embedder import GeminiEmbedder
from services.vector_store import VectorStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])

# --- Service instances ---
document_loader = DocumentLoader()
embedder = GeminiEmbedder(
    api_key=settings.GEMINI_API_KEY,
    model=settings.GEMINI_EMBEDDING_MODEL,
)
vector_store = VectorStore(
    persist_path=settings.CHROMA_PERSIST_PATH,
    collection_name=settings.CHROMA_COLLECTION_NAME,
)


# ============================================================
# POST /documents/upload — Upload and process a document
# ============================================================
@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(..., description="Text file (.txt or .md)"),
    title: str = Form(default="", description="Document title (defaults to filename)"),
    chunk_strategy: ChunkStrategy = Form(
        default=ChunkStrategy.SENTENCE,
        description="Chunking strategy: fixed, sentence, or paragraph",
    ),
    session: Session = Depends(get_session),
) -> DocumentUploadResponse:
    """
    Upload a document, process it into chunks, generate embeddings,
    and store in ChromaDB for later querying.

    Steps:
    1. Validate and load the file
    2. Split into chunks using the chosen strategy
    3. Generate embeddings for all chunks via Gemini
    4. Store chunks + embeddings in ChromaDB
    5. Save document metadata in SQLite
    """
    filename = file.filename or "unknown.txt"
    doc_title = title if title else filename
    doc_id = str(uuid.uuid4())

    # Step 1: Read and load
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {settings.MAX_FILE_SIZE_MB} MB limit",
        )

    try:
        text = document_loader.load(filename, content)
    except DocumentLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=400, detail="Document is empty")

    # Step 2: Chunk the text
    chunker = get_chunker(
        strategy=chunk_strategy.value,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = chunker.chunk(text)

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="Document produced no chunks after processing",
        )

    # Step 3: Generate embeddings
    try:
        embeddings = embedder.embed_batch(chunks, task_type="retrieval_document")
    except Exception as e:
        logger.error("Embedding failed: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail=f"Embedding generation failed: {str(e)}",
        )

    # Step 4: Store in ChromaDB
    chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "document_id": doc_id,
            "filename": filename,
            "title": doc_title,
            "chunk_index": i,
            "chunk_strategy": chunk_strategy.value,
        }
        for i in range(len(chunks))
    ]

    vector_store.add_chunks(
        chunk_ids=chunk_ids,
        embeddings=embeddings,
        texts=chunks,
        metadatas=metadatas,
    )

    # Step 5: Save metadata in SQLite
    doc_record = Document(
        id=doc_id,
        title=doc_title,
        filename=filename,
        file_size_bytes=len(content),
        chunk_count=len(chunks),
        chunk_strategy=chunk_strategy.value,
    )
    session.add(doc_record)
    session.commit()

    logger.info(
        "Uploaded document '%s': %d chunks (strategy=%s)",
        doc_title,
        len(chunks),
        chunk_strategy.value,
    )

    return DocumentUploadResponse(
        id=doc_id,
        title=doc_title,
        filename=filename,
        chunk_count=len(chunks),
        chunk_strategy=chunk_strategy,
    )


# ============================================================
# GET /documents — List all documents
# ============================================================
@router.get("", response_model=DocumentListResponse)
async def list_documents(
    session: Session = Depends(get_session),
) -> DocumentListResponse:
    """List all uploaded documents with their metadata."""
    documents = session.exec(select(Document)).all()

    doc_infos = [
        DocumentInfo(
            id=doc.id,
            title=doc.title,
            filename=doc.filename,
            chunk_count=doc.chunk_count,
            chunk_strategy=doc.chunk_strategy,
            file_size_bytes=doc.file_size_bytes,
            created_at=doc.created_at.isoformat() if doc.created_at else "",
        )
        for doc in documents
    ]

    return DocumentListResponse(documents=doc_infos, total=len(doc_infos))


# ============================================================
# GET /documents/{document_id} — Get document details
# ============================================================
@router.get("/{document_id}", response_model=DocumentInfo)
async def get_document(
    document_id: str,
    session: Session = Depends(get_session),
) -> DocumentInfo:
    """Get details for a specific document."""
    doc = session.get(Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentInfo(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        chunk_count=doc.chunk_count,
        chunk_strategy=doc.chunk_strategy,
        file_size_bytes=doc.file_size_bytes,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


# ============================================================
# DELETE /documents/{document_id} — Delete document and chunks
# ============================================================
@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """
    Delete a document and all its chunks from both SQLite and ChromaDB.
    """
    doc = session.get(Document, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from ChromaDB
    vector_store.delete_document(document_id)

    # Delete from SQLite
    session.delete(doc)
    session.commit()

    logger.info("Deleted document '%s' (id=%s)", doc.title, document_id)

    return {
        "message": f"Document '{doc.title}' deleted successfully",
        "id": document_id,
    }
