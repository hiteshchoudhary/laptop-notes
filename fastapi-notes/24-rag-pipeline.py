"""
============================================================
FILE 24: RAG PIPELINE — RETRIEVAL-AUGMENTED GENERATION
============================================================
Topics: RAG architecture, document loading, chunking strategies,
        fixed-size chunks, sentence chunking, paragraph chunking,
        overlap, embedding and indexing, retrieval, prompt
        augmentation, grounded generation, citations, handling
        unknown queries, conversation memory with RAG

WHY THIS MATTERS:
LLMs hallucinate — they confidently make up facts. RAG solves
this by retrieving REAL documents and feeding them as context.
Instead of getting a generic (possibly wrong) answer, RAG
retrieves the actual source and generates a grounded response.
============================================================
"""

# STORY: Krutrim (Ola's AI) — India's First Homegrown LLM
# Krutrim, built by Ola founder Bhavish Aggarwal, is India's
# first homegrown LLM trained on Indian languages. Krutrim uses
# RAG to ground responses in verified knowledge — IRCTC train
# schedules, government schemes like PM Kisan and Ayushman Bharat,
# and regional language content. Without RAG, wrong train times
# and eligibility criteria. With RAG, verified answers with
# source citations. RAG is the #1 production pattern for LLM apps.

import os
import re
import json
import math
import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import (
    FastAPI, HTTPException, UploadFile, File, Form, Query, status
)
from pydantic import BaseModel, Field


# ════════════════════════════════════════════════════════════
# SECTION 1 — What is RAG?
# ════════════════════════════════════════════════════════════

# WHY: Fine-tuning costs ₹50L+ and takes weeks. RAG achieves
# 90% of the benefit at 1% of the cost. Retrieve relevant docs,
# include them in the prompt, LLM generates grounded answers.

# RAG PIPELINE:
#   Query → Embed → Vector Search → Top-K Chunks
#     → Augment Prompt (inject context) → Generate Answer
#     → Grounded Answer + Citations
#
# Fine-tuning: ₹50L, weeks, static knowledge
# RAG: ₹0 (free APIs), hours, updates instantly when docs change


# ════════════════════════════════════════════════════════════
# SECTION 2 — Embedding and Vector Store
# ════════════════════════════════════════════════════════════

# WHY: RAG needs embeddings and a vector store. We reuse
# concepts from File 23, focused on document chunks.

EMBEDDING_DIM = 768

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Cosine similarity between two vectors."""
    dot_p = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    return dot_p / (mag_a * mag_b) if mag_a and mag_b else 0.0

def generate_embedding(text: str, task_type: str = "retrieval_document") -> List[float]:
    """Simulated embedding. PRODUCTION: genai.embed_content(model="models/embedding-001", ...)"""
    h = hashlib.sha256(text.lower().encode()).digest()
    emb = [(h[i % len(h)] / 255.0 * 2 - 1) * math.cos(i * 0.01) * 0.5 for i in range(EMBEDDING_DIM)]
    mag = math.sqrt(sum(x * x for x in emb))
    return [x / mag for x in emb] if mag > 0 else emb

class VectorStore:
    """In-memory vector store. PRODUCTION: chromadb.PersistentClient()"""
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []

    def add(self, doc_id: str, text: str, embedding: List[float],
            metadata: Dict[str, Any] = None):
        for doc in self.documents:
            if doc["id"] == doc_id:
                doc.update({"text": text, "embedding": embedding, "metadata": metadata or {}})
                return
        self.documents.append({"id": doc_id, "text": text, "embedding": embedding,
                               "metadata": metadata or {}})

    def search(self, query_embedding: List[float], top_k: int = 5,
               filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        scored = []
        for doc in self.documents:
            if filters and not all(doc["metadata"].get(k) == v for k, v in filters.items()):
                continue
            sim = cosine_similarity(query_embedding, doc["embedding"])
            scored.append({**doc, "similarity": round(sim, 4)})
        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]

    def count(self) -> int:
        return len(self.documents)

    def get_all(self) -> List[Dict]:
        return [{"id": d["id"], "text": d["text"][:200], "metadata": d["metadata"]}
                for d in self.documents]

    def clear(self):
        self.documents.clear()


# ════════════════════════════════════════════════════════════
# SECTION 3 — Document Loading
# ════════════════════════════════════════════════════════════

# WHY: RAG starts with documents. Load .txt, .md files and
# extract metadata. In production, also handle .pdf (PyMuPDF),
# .docx (python-docx). Krutrim loads thousands of government
# scheme PDFs and Wikipedia articles in Indian languages.

def load_text_file(content: str, filename: str) -> Dict[str, Any]:
    """Load text file with metadata."""
    return {"filename": filename, "content": content, "char_count": len(content),
            "word_count": len(content.split()), "loaded_at": datetime.now(timezone.utc).isoformat()}

def load_markdown_file(content: str, filename: str) -> Dict[str, Any]:
    """Load markdown file, extract headings for chunk attribution."""
    headings = re.findall(r'^#{1,3}\s+(.+)$', content, re.MULTILINE)
    return {"filename": filename, "content": content, "char_count": len(content),
            "headings": headings, "format": "markdown",
            "loaded_at": datetime.now(timezone.utc).isoformat()}


# ════════════════════════════════════════════════════════════
# SECTION 4 — Chunking Strategies
# ════════════════════════════════════════════════════════════

# WHY: LLMs have context limits (32K tokens for Gemini Flash).
# A 100-page PDF does not fit. You MUST split into chunks.
# HOW you chunk matters: bad = splits mid-sentence; good =
# preserves meaning with overlap for continuity.

def chunk_fixed_size(text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict]:
    """
    Fixed-size chunking with overlap. Simplest strategy.
    Overlap prevents losing context at chunk boundaries.
    Chunk 1: chars 0-499, Chunk 2: chars 400-899 (100 char overlap)
    """
    if chunk_size <= overlap:
        raise ValueError("chunk_size must exceed overlap")
    chunks, start, idx = [], 0, 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append({"chunk_id": idx, "text": chunk_text, "start_char": start,
                           "end_char": end, "strategy": "fixed_size"})
            idx += 1
        start += chunk_size - overlap
    return chunks

def chunk_by_sentences(text: str, sentences_per_chunk: int = 5,
                       overlap_sentences: int = 1) -> List[Dict]:
    """
    Sentence-based chunking — never splits mid-sentence.
    Better for conversational text, FAQs, and articles.
    """
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    if not sentences:
        return []
    chunks, idx, i = [], 0, 0
    while i < len(sentences):
        end = min(i + sentences_per_chunk, len(sentences))
        chunk_text = " ".join(sentences[i:end])
        chunks.append({"chunk_id": idx, "text": chunk_text, "sentence_start": i,
                       "sentence_end": end, "strategy": "sentence"})
        idx += 1
        i += max(1, sentences_per_chunk - overlap_sentences)
    return chunks

def chunk_by_paragraphs(text: str, max_chunk_size: int = 1000,
                        overlap_chars: int = 100) -> List[Dict]:
    """
    Paragraph-based chunking — best for structured documents like
    government schemes. Krutrim uses this for Indian policy docs.
    Falls back to fixed-size if a paragraph exceeds max_chunk_size.
    """
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    chunks, idx, current = [], 0, ""
    for para in paragraphs:
        if current and len(current) + len(para) + 2 > max_chunk_size:
            chunks.append({"chunk_id": idx, "text": current.strip(), "strategy": "paragraph"})
            idx += 1
            current = (current[-overlap_chars:] + "\n\n" + para
                       if overlap_chars and len(current) > overlap_chars else para)
        else:
            current = current + "\n\n" + para if current else para
    if current.strip():
        chunks.append({"chunk_id": idx, "text": current.strip(), "strategy": "paragraph"})
    return chunks


# ════════════════════════════════════════════════════════════
# SECTION 5 — Simulated LLM for Answer Generation
# ════════════════════════════════════════════════════════════

# PRODUCTION: genai.GenerativeModel("gemini-1.5-flash",
#   system_instruction="Answer based ONLY on provided context...")

def generate_answer(prompt: str) -> str:
    """Simulated Gemini generation. PRODUCTION: model.generate_content(prompt).text"""
    if "Context:" in prompt and "Question:" in prompt:
        ctx_start = prompt.index("Context:") + 8
        q_start = prompt.index("Question:")
        context = prompt[ctx_start:q_start].strip()[:300]
        question = prompt[q_start + 9:].strip().split("\n")[0]
        return (f"Based on the provided context regarding '{question[:60]}':\n\n"
                f"{context[:200]}...\n\n"
                f"[Simulated RAG response. Set GEMINI_API_KEY for real generation.]")
    return f"[Simulated response for: {prompt[:100]}]"


# ════════════════════════════════════════════════════════════
# SECTION 6 — RAG Pipeline Core Functions
# ════════════════════════════════════════════════════════════

# WHY: These implement the pipeline: ingest → chunk → embed →
# store → retrieve → augment → generate

def process_document(content: str, filename: str, chunk_strategy: str = "paragraph",
                     chunk_size: int = 500, overlap: int = 100) -> List[Dict]:
    """Full pipeline: chunk document, generate embeddings, return ready for indexing."""
    if chunk_strategy == "fixed":
        chunks = chunk_fixed_size(content, chunk_size, overlap)
    elif chunk_strategy == "sentence":
        chunks = chunk_by_sentences(content)
    elif chunk_strategy == "paragraph":
        chunks = chunk_by_paragraphs(content, chunk_size, overlap)
    else:
        raise ValueError(f"Unknown strategy: {chunk_strategy}")
    for chunk in chunks:
        chunk["embedding"] = generate_embedding(chunk["text"])
        chunk["source_file"] = filename
        chunk["doc_id"] = f"{filename}_{chunk['chunk_id']}"
    return chunks

def build_rag_prompt(question: str, retrieved_chunks: List[Dict],
                     chat_history: List[Dict[str, str]] = None) -> str:
    """
    Build augmented prompt: system instruction + retrieved context
    + chat history + question. This is the critical RAG step.
    """
    system = (
        "You are a knowledgeable assistant. Answer based ONLY on the provided context.\n"
        "Rules: 1) Only use information from context below. "
        "2) If context lacks the answer, say 'I don't have enough information.' "
        "3) Cite sources using [Source: filename]. 4) Be concise but thorough.\n"
    )
    context_parts = [f"[Source {i}: {c.get('source_file', c.get('metadata', {}).get('source_file', 'unknown'))}]"
                     f"\n{c['text']}" for i, c in enumerate(retrieved_chunks, 1)]
    context = "\n---\n".join(context_parts)
    history_text = ""
    if chat_history:
        lines = [f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
                 for m in chat_history[-6:]]
        history_text = "\n\nPrevious conversation:\n" + "\n".join(lines)
    return f"{system}\n\nContext:\n{context}\n{history_text}\n\nQuestion: {question}\n\nAnswer (cite sources):"

def extract_citations(answer: str, chunks: List[Dict]) -> List[Dict[str, str]]:
    """Extract [Source: filename] patterns and link to actual chunks."""
    citations, seen = [], set()
    for match in re.findall(r'\[Source(?:\s*\d*):\s*([^\]]+)\]', answer):
        source = match.strip()
        if source in seen:
            continue
        seen.add(source)
        for c in chunks:
            src = c.get("source_file", c.get("metadata", {}).get("source_file", ""))
            if src == source or source in src:
                citations.append({"source": source, "chunk_preview": c["text"][:150] + "..."})
                break
        else:
            citations.append({"source": source, "chunk_preview": "Source referenced"})
    return citations


# ════════════════════════════════════════════════════════════
# SECTION 7 — Pydantic Models
# ════════════════════════════════════════════════════════════

class DocumentUploadResponse(BaseModel):
    filename: str
    chunks_created: int
    total_chars: int
    chunk_strategy: str
    message: str

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    top_k: int = Field(3, ge=1, le=10)

class SourceChunk(BaseModel):
    chunk_id: str
    text: str
    source_file: str
    similarity_score: float

class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceChunk]
    citations: List[Dict[str, str]]
    chunks_retrieved: int
    confidence: str

class ChatRAGRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str = Field(..., min_length=1, max_length=100)
    top_k: int = Field(3, ge=1, le=10)

class ChatRAGResponse(BaseModel):
    reply: str
    session_id: str
    sources: List[SourceChunk]
    citations: List[Dict[str, str]]
    turn_count: int

class ManualChunkRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=100000)
    strategy: str = Field("paragraph", description="fixed, sentence, or paragraph")
    chunk_size: int = Field(500, ge=100, le=5000)
    overlap: int = Field(100, ge=0, le=500)


# ════════════════════════════════════════════════════════════
# SECTION 8 — FastAPI App and Sample Knowledge Base
# ════════════════════════════════════════════════════════════

app = FastAPI(
    title="Krutrim RAG API — Indian Knowledge Base",
    description="RAG pipeline for Indian government schemes. Upload docs, ask questions, "
                "get grounded answers with citations.",
    version="1.0.0",
)

vector_store = VectorStore()
document_registry: Dict[str, Dict[str, Any]] = {}
chat_sessions: Dict[str, List[Dict[str, str]]] = {}

# --- Sample Indian Government Scheme Data ---
SAMPLE_SCHEMES = [
    {"filename": "pm_kisan_yojana.txt", "content": (
        "PM-KISAN Scheme (Pradhan Mantri Kisan Samman Nidhi)\n\n"
        "PM-KISAN provides income support of Rs. 6,000 per year to all landholding "
        "farmer families. The amount is paid in three installments of Rs. 2,000 each, "
        "directly into farmers' bank accounts.\n\n"
        "Eligibility: All landholding farmer families with cultivable land. Must have "
        "land records in their name. Excluded: institutional landholders, holders of "
        "constitutional posts, serving/retired government officers, professionals like "
        "doctors engineers lawyers, and income tax payers.\n\n"
        "How to Apply: Visit pmkisan.gov.in, click New Farmer Registration, enter "
        "Aadhaar number and state, fill land details and bank account, submit for "
        "verification by local patwari or revenue officer.\n\n"
        "Required Documents: Aadhaar card, land ownership documents (khasra/khatauni), "
        "bank account with IFSC code, mobile number linked with Aadhaar.\n\n"
        "Payment: Installment 1 (Apr-Jul Rs.2000), Installment 2 (Aug-Nov Rs.2000), "
        "Installment 3 (Dec-Mar Rs.2000). Total: Rs.6,000 per year.")},
    {"filename": "ayushman_bharat.txt", "content": (
        "Ayushman Bharat - PM Jan Arogya Yojana (PM-JAY)\n\n"
        "World's largest government health insurance scheme. Provides Rs. 5 lakh "
        "coverage per family per year for secondary and tertiary hospitalization.\n\n"
        "Eligibility: Families from SECC 2011 database. Rural: no adult aged 16-59, "
        "female-headed household, disabled member, SC/ST, landless, manual labourers. "
        "Urban: rag pickers, domestic workers, street vendors, construction workers, "
        "plumbers, painters, security guards, sanitation workers.\n\n"
        "Benefits: Rs.5 lakh per family per year, covers 1393 medical procedures, "
        "free treatment at empanelled hospitals, no cap on family size or age, "
        "covers pre-hospitalization (3 days) and post-hospitalization (15 days).\n\n"
        "Check Eligibility: Visit mera.pmjay.gov.in, enter mobile and captcha, "
        "search by name/ration card/mobile. If eligible, visit Ayushman Bharat Kendra "
        "with Aadhaar and ration card. Helpline: 14555 (toll-free).")},
    {"filename": "digital_india.txt", "content": (
        "Digital India Programme\n\n"
        "Flagship programme to transform India into a digitally empowered society.\n\n"
        "Pillar 1 - Digital Infrastructure: High-speed internet for every citizen, "
        "Aadhaar digital identity, mobile phone and bank account enabling digital space, "
        "Common Service Centres at easy reach.\n\n"
        "Pillar 2 - Governance on Demand: Seamlessly integrated services, real-time "
        "online and mobile platforms, citizen entitlements on cloud.\n\n"
        "Pillar 3 - Digital Empowerment: Universal digital literacy, resources in Indian "
        "languages, collaborative platforms for participative governance.\n\n"
        "Key Initiatives: DigiLocker (150M+ citizens), UMANG (unified govt app), "
        "BharatNet (fibre to 250K gram panchayats), 400K+ Common Service Centres, "
        "UPI (10 billion transactions/month). Impact: 1.3 billion Aadhaar numbers, "
        "80 crore internet users, UPI processing Rs.15 lakh crore monthly.")},
]

@app.on_event("startup")
async def seed_knowledge_base():
    """Seed with Indian government scheme documents."""
    for scheme in SAMPLE_SCHEMES:
        chunks = process_document(scheme["content"], scheme["filename"],
                                  chunk_strategy="paragraph", chunk_size=800, overlap=100)
        for chunk in chunks:
            vector_store.add(doc_id=chunk["doc_id"], text=chunk["text"],
                             embedding=chunk["embedding"],
                             metadata={"source_file": scheme["filename"],
                                       "chunk_id": chunk["chunk_id"],
                                       "strategy": chunk["strategy"]})
        document_registry[scheme["filename"]] = {
            "filename": scheme["filename"], "chunk_count": len(chunks),
            "char_count": len(scheme["content"]),
            "indexed_at": datetime.now(timezone.utc).isoformat()}


# ════════════════════════════════════════════════════════════
# SECTION 9 — POST /documents/upload
# ════════════════════════════════════════════════════════════

# WHY: Users upload their own .txt/.md documents to build a
# custom knowledge base for RAG queries.

@app.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    chunk_strategy: str = Form("paragraph"),
    chunk_size: int = Form(500),
    overlap: int = Form(100),
):
    """Upload a document (.txt/.md), chunk it, embed, and index for RAG."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".txt", ".md"}:
        raise HTTPException(status_code=400, detail=f"Unsupported type '{ext}'. Use .txt or .md")
    content_bytes = await file.read()
    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    if len(content.strip()) < 10:
        raise HTTPException(status_code=400, detail="File too short (min 10 chars)")

    chunks = process_document(content, file.filename, chunk_strategy, chunk_size, overlap)
    for chunk in chunks:
        vector_store.add(doc_id=chunk["doc_id"], text=chunk["text"],
                         embedding=chunk["embedding"],
                         metadata={"source_file": file.filename,
                                   "chunk_id": chunk["chunk_id"],
                                   "strategy": chunk["strategy"]})
    document_registry[file.filename] = {
        "filename": file.filename, "chunk_count": len(chunks),
        "char_count": len(content),
        "indexed_at": datetime.now(timezone.utc).isoformat()}
    return DocumentUploadResponse(filename=file.filename, chunks_created=len(chunks),
        total_chars=len(content), chunk_strategy=chunk_strategy,
        message=f"'{file.filename}' processed into {len(chunks)} chunks and indexed.")


# ════════════════════════════════════════════════════════════
# SECTION 10 — POST /documents/chunk (Preview Chunking)
# ════════════════════════════════════════════════════════════

@app.post("/documents/chunk")
async def chunk_text(request: ManualChunkRequest):
    """Preview chunking results without indexing. Experiment with parameters."""
    if request.strategy == "fixed":
        chunks = chunk_fixed_size(request.text, request.chunk_size, request.overlap)
    elif request.strategy == "sentence":
        chunks = chunk_by_sentences(request.text)
    elif request.strategy == "paragraph":
        chunks = chunk_by_paragraphs(request.text, request.chunk_size, request.overlap)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown strategy: {request.strategy}")
    return {"strategy": request.strategy, "total_chunks": len(chunks),
            "input_chars": len(request.text),
            "avg_chunk_size": round(sum(len(c["text"]) for c in chunks) / len(chunks)) if chunks else 0,
            "chunks": [{"chunk_id": c["chunk_id"], "text_preview": c["text"][:200],
                        "char_count": len(c["text"])} for c in chunks]}


# ════════════════════════════════════════════════════════════
# SECTION 11 — GET /documents (List Indexed Documents)
# ════════════════════════════════════════════════════════════

@app.get("/documents")
async def list_documents():
    """List all indexed documents with chunk counts."""
    return {"documents": list(document_registry.values()),
            "total_documents": len(document_registry),
            "total_chunks": vector_store.count()}


# ════════════════════════════════════════════════════════════
# SECTION 12 — POST /query (RAG Query with Sources)
# ════════════════════════════════════════════════════════════

# WHY: The MAIN endpoint. User asks a question → embed → search
# → retrieve chunks → augment prompt → generate grounded answer.
# Try: "Am I eligible for PM Kisan if I am a doctor?"
#      "How much health coverage does Ayushman Bharat provide?"

@app.post("/query", response_model=QueryResponse)
async def rag_query(request: QueryRequest):
    """RAG query: retrieve relevant chunks, generate grounded answer with citations."""
    if vector_store.count() == 0:
        raise HTTPException(status_code=404, detail="No documents indexed. Upload first.")

    query_emb = generate_embedding(request.question, task_type="retrieval_query")
    retrieved = vector_store.search(query_emb, top_k=request.top_k)

    if not retrieved:
        return QueryResponse(question=request.question,
            answer="No relevant documents found.", sources=[], citations=[],
            chunks_retrieved=0, confidence="none")

    prompt = build_rag_prompt(request.question, retrieved)
    answer = generate_answer(prompt)
    citations = extract_citations(answer, retrieved)

    sources = [SourceChunk(chunk_id=c["id"], text=c["text"][:300],
                           source_file=c.get("metadata", {}).get("source_file", "unknown"),
                           similarity_score=c["similarity"]) for c in retrieved]

    max_sim = max(c["similarity"] for c in retrieved)
    confidence = "high" if max_sim > 0.8 else "medium" if max_sim > 0.6 else "low"

    return QueryResponse(question=request.question, answer=answer, sources=sources,
                         citations=citations, chunks_retrieved=len(retrieved),
                         confidence=confidence)


# ════════════════════════════════════════════════════════════
# SECTION 13 — POST /chat (Multi-Turn RAG Chat)
# ════════════════════════════════════════════════════════════

# WHY: Users follow up: "What is PM Kisan?" → "Am I eligible?"
# → "How do I apply?" Chat maintains history so the model
# resolves "it" and "this scheme" from previous turns.

@app.post("/chat", response_model=ChatRAGResponse)
async def rag_chat(request: ChatRAGRequest):
    """Multi-turn RAG chat. Retrieves per turn, includes history for context."""
    sid = request.session_id
    if sid not in chat_sessions:
        chat_sessions[sid] = []
    history = chat_sessions[sid]

    query_emb = generate_embedding(request.message, task_type="retrieval_query")
    retrieved = vector_store.search(query_emb, top_k=request.top_k)
    prompt = build_rag_prompt(request.message, retrieved, chat_history=history)
    answer = generate_answer(prompt)
    citations = extract_citations(answer, retrieved)

    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": answer})
    if len(history) > 20:  # Keep last 10 turns
        chat_sessions[sid] = history[-20:]

    sources = [SourceChunk(chunk_id=c["id"], text=c["text"][:300],
                           source_file=c.get("metadata", {}).get("source_file", "unknown"),
                           similarity_score=c["similarity"]) for c in retrieved]
    return ChatRAGResponse(reply=answer, session_id=sid, sources=sources,
                           citations=citations, turn_count=len(history) // 2)


# ════════════════════════════════════════════════════════════
# SECTION 14 — Handling "I Don't Know" (Confidence Threshold)
# ════════════════════════════════════════════════════════════

# WHY: A good RAG system admits when it doesn't know. Low
# similarity = low confidence = honest "I don't know" instead
# of hallucination. Krutrim found this improved user trust 40%.

CONFIDENCE_THRESHOLD = 0.3

@app.post("/query/safe")
async def safe_rag_query(request: QueryRequest):
    """RAG with confidence filtering — returns 'I don't know' when unsure."""
    query_emb = generate_embedding(request.question, task_type="retrieval_query")
    retrieved = vector_store.search(query_emb, top_k=request.top_k)

    if not retrieved or max(c["similarity"] for c in retrieved) < CONFIDENCE_THRESHOLD:
        return {"question": request.question,
                "answer": "I don't have enough information in my knowledge base to answer "
                          "accurately. Please upload relevant documents first.",
                "confidence": "insufficient",
                "suggestion": "Upload documents using POST /documents/upload"}

    prompt = build_rag_prompt(request.question, retrieved)
    answer = generate_answer(prompt)
    return {"question": request.question, "answer": answer, "confidence": "sufficient",
            "top_similarity": max(c["similarity"] for c in retrieved),
            "chunks_used": len(retrieved)}


# ════════════════════════════════════════════════════════════
# SECTION 15 — Utility Endpoints
# ════════════════════════════════════════════════════════════

@app.get("/health")
async def health_check():
    return {"status": "healthy", "total_documents": len(document_registry),
            "total_chunks": vector_store.count(),
            "active_sessions": len(chat_sessions),
            "models": {"embedding": "models/embedding-001", "generation": "gemini-1.5-flash"},
            "timestamp": datetime.now(timezone.utc).isoformat()}

@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Remove a document and its chunks from the knowledge base."""
    if filename not in document_registry:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' not found")
    vector_store.documents = [d for d in vector_store.documents
                              if d.get("metadata", {}).get("source_file") != filename]
    del document_registry[filename]
    return {"message": f"'{filename}' and its chunks removed."}

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    del chat_sessions[session_id]
    return {"message": f"Session '{session_id}' deleted"}

@app.get("/sessions")
async def list_sessions():
    return {"sessions": [{"session_id": s, "turns": len(m) // 2}
                         for s, m in chat_sessions.items()],
            "total": len(chat_sessions)}


# ════════════════════════════════════════════════════════════
# KEY TAKEAWAYS
# ════════════════════════════════════════════════════════════
# 1. RAG = Retrieve relevant docs + Augment prompt + Generate grounded answer
# 2. RAG costs ₹0 vs fine-tuning at ₹50L+ — and updates instantly when docs change
# 3. Chunking strategy matters: paragraph-based with overlap works best for structured docs
# 4. Overlap between chunks prevents losing context at boundaries (100 chars default)
# 5. Always use task_type="retrieval_query" for queries, "retrieval_document" for docs
# 6. System instructions MUST tell the model to say "I don't know" when context is insufficient
# 7. Citations build trust — always link answers back to source documents
# 8. Conversation memory in RAG = retrieve per turn + include chat history in prompt
# 9. Confidence scoring (similarity threshold) prevents hallucinated answers
# 10. RAG is the #1 production pattern for LLM apps — used by Krutrim, ChatGPT, every enterprise AI
# "Don't fine-tune when you can retrieve. RAG is the 80/20 of AI." — inspired by Bhavish Aggarwal
