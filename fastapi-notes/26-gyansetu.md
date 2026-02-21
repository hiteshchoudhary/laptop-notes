# ============================================================
# FILE 26: GYANSETU — RAG KNOWLEDGE BASE
# ============================================================
# Topics: RAG architecture, document chunking, embeddings,
#         vector search, ChromaDB, grounded AI answers, citations
#
# WHY THIS MATTERS:
# RAG (Retrieval-Augmented Generation) is how modern AI apps
# answer questions about YOUR data — not just what the model
# was trained on. GyanSetu teaches you the complete pipeline
# from document upload to cited, accurate AI answers.
# ============================================================


## STORY: Diksha and India's 10 Million Teachers

Diksha, India's national education platform built by the Ministry of Education,
serves over 10 million teachers across 36 states and union territories. Every
day, teachers search through thousands of curriculum PDFs, NCERT guidelines,
and learning outcome documents trying to answer questions like: "What are the
expected learning outcomes for Class 8 Science Chapter 3?" or "How should I
teach fractions to Class 4 students according to NCF 2023?"

GyanSetu ("Gyan" = knowledge, "Setu" = bridge) bridges the gap between
scattered documents and instant answers. Teachers upload curriculum PDFs and
text files, and the system processes them into searchable chunks, creates
vector embeddings with Gemini, stores them in ChromaDB, and answers natural
language questions with source citations.

Imagine Priya, a government school teacher in rural Rajasthan. She has the
entire NCERT Science textbook as a PDF but needs to quickly find the specific
learning outcomes for her lesson plan due tomorrow. Instead of reading 300
pages, she types: "What experiments are recommended for teaching light and
shadows in Class 6?" GyanSetu retrieves the relevant passages, generates a
clear answer, and cites exactly which pages the information came from. That
is the power of RAG — making existing knowledge instantly accessible.

This chapter teaches you how to build a complete RAG pipeline: document
ingestion, text chunking, embedding generation, vector storage and search,
prompt engineering for grounded answers, and citation tracking.


---


## SECTION 1 — RAG Architecture Deep Dive

### WHY: Understanding the full RAG pipeline is essential before writing a single line of code.

RAG solves a fundamental limitation of large language models: they only know
what they were trained on. If you ask Gemini about your company's internal
HR policy or a specific NCERT chapter's learning outcomes, it will either
hallucinate or say "I don't know." RAG fixes this by retrieving relevant
context from YOUR documents and feeding it to the model alongside the question.

### The RAG Pipeline (ASCII Diagram)

```
                        INGESTION PIPELINE
                        ==================

  Upload Document          Split into           Generate
  (PDF/TXT/MD)            Chunks               Embeddings
       |                    |                     |
       v                    v                     v
  +----------+     +----------------+     +----------------+
  | Document |     | Chunk 1        |     | [0.12, -0.34,  |
  | Loader   | --> | Chunk 2        | --> |  0.56, ...]    |
  |          |     | Chunk 3        |     | (768-dim vec)  |
  +----------+     | ...            |     +----------------+
                   +----------------+            |
                                                 v
                                          +----------------+
                                          |   ChromaDB     |
                                          | (Vector Store) |
                                          +----------------+


                        QUERY PIPELINE
                        ==============

  User Question        Embed              Vector Search
  "What are the..."    the Query          (Similarity)
       |                  |                    |
       v                  v                    v
  +----------+     +----------------+    +----------------+
  | Query    |     | [0.08, -0.29,  |    | Top-K Chunks:  |
  | Engine   | --> |  0.61, ...]    | -> | Chunk 7 (0.92) |
  |          |     | (768-dim vec)  |    | Chunk 3 (0.87) |
  +----------+     +----------------+    | Chunk 12 (0.81)|
                                         +----------------+
                                                |
                                                v
                                         +----------------+
                                         | Gemini LLM     |
                                         | Context + Q    |
                                         | = Answer +     |
                                         |   Citations    |
                                         +----------------+
```

### How RAG Differs from Fine-Tuning

| Aspect            | RAG                              | Fine-Tuning                    |
|-------------------|----------------------------------|--------------------------------|
| Data freshness    | Real-time (upload new docs)       | Stale (retrain needed)         |
| Cost              | Low (API calls only)              | High (GPU training hours)      |
| Hallucination     | Low (grounded in retrieved text)  | Medium (model may still drift) |
| Setup complexity  | Medium (chunking + vector DB)     | High (training pipeline)       |
| Best for          | Q&A over documents                | Style/behavior changes         |

For GyanSetu's use case — answering questions about uploaded curriculum
documents — RAG is the clear winner. The documents change every academic
year, fine-tuning would be impractical, and teachers need source citations
to trust the answers.


---


## SECTION 2 — Project Architecture

### WHY: A well-structured RAG system separates concerns cleanly for maintainability and testing.

```
26-gyansetu/
  main.py              # FastAPI app with lifespan (init ChromaDB)
  config.py            # Settings: GEMINI_API_KEY, CHROMA_PATH, CHUNK_SIZE
  models.py            # Document, Chunk, QueryRequest, QueryResponse, Source
  database.py          # SQLModel setup for document metadata tracking
  services/
    __init__.py        # Package marker
    document_loader.py # Load txt, md files, extract text
    chunker.py         # FixedSizeChunker, SentenceChunker, ParagraphChunker
    embedder.py        # GeminiEmbedder: embed text, embed batch
    vector_store.py    # ChromaDB wrapper: add, search, delete
    rag_engine.py      # RAGEngine: query (retrieve + generate), chat
  routes/
    __init__.py        # Package marker
    documents.py       # POST /documents/upload, GET /documents, DELETE
    query.py           # POST /query, POST /chat
    health.py          # GET /health, GET /stats
  .env.example         # Template for environment variables
  requirements.txt     # Dependencies
  Dockerfile           # Python 3.11-slim based container
  docker-compose.yml   # Web + ChromaDB services
  sample_docs/         # Sample documents for testing
    indian_constitution_preamble.txt
    pm_kisan_scheme.txt
```

### Architecture Flow

```
Client
  |
  v
+------------------+
| FastAPI Routes   |
| (documents.py,   |
|  query.py)       |
+------------------+
  |           |
  v           v
+--------+  +-----------+
| Doc    |  | RAG       |
| Upload |  | Engine    |
| Flow   |  | (query +  |
|        |  |  generate)|
+--------+  +-----------+
  |           |        |
  v           v        v
+--------+ +------+ +--------+
| Loader | |Vector| | Gemini |
| Chunker| |Store | | LLM    |
|Embedder| |Search| | Answer |
+--------+ +------+ +--------+
               |
               v
          +---------+
          | ChromaDB|
          | (Persist|
          |  Storage)|
          +---------+
```

### Tech Stack

| Component        | Technology             |
|------------------|------------------------|
| Framework        | FastAPI                |
| AI Model         | Google Gemini 1.5 Flash|
| Embeddings       | Gemini Embedding API   |
| Vector Database  | ChromaDB               |
| Metadata Store   | SQLite (via SQLModel)  |
| Configuration    | pydantic-settings      |
| Server           | Uvicorn                |
| Container        | Docker + Docker Compose|


---


## SECTION 3 — Document Processing Pipeline

### WHY: Raw documents are useless to AI — they must be loaded, cleaned, and split into digestible chunks.

A 300-page NCERT textbook cannot be sent to Gemini in one API call (context
window limits). Even if it could, the model would lose focus. Chunking splits
documents into meaningful segments that can be individually embedded, searched,
and retrieved.

### Document Loading

```python
class DocumentLoader:
    """Load text content from various file formats."""

    SUPPORTED_EXTENSIONS = {".txt", ".md"}

    def load(self, filename: str, content: bytes) -> str:
        ext = Path(filename).suffix.lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")

        # Decode with fallback encodings (handles Hindi UTF-8 text)
        for encoding in ["utf-8", "utf-8-sig", "latin-1"]:
            try:
                return content.decode(encoding)
            except UnicodeDecodeError:
                continue
        raise ValueError("Could not decode file with any supported encoding")
```

### Why Multiple Encodings?

Indian government documents are notorious for encoding issues. A PDF exported
from a Hindi word processor might use UTF-8-BOM (Byte Order Mark) instead of
plain UTF-8. The fallback chain handles these edge cases gracefully.


---


## SECTION 4 — Chunking Strategies

### WHY: How you split text determines how well your RAG system retrieves relevant information.

Chunking is arguably the most important decision in a RAG pipeline. Too
large and chunks contain irrelevant noise. Too small and chunks lose context.
The wrong split boundaries and sentences get cut in half, destroying meaning.

### Three Chunking Strategies Compared

| Strategy          | How It Works                     | Pros                          | Cons                         |
|-------------------|----------------------------------|-------------------------------|------------------------------|
| **Fixed-Size**    | Split every N characters         | Simple, predictable           | Cuts mid-sentence            |
| **Sentence**      | Split on sentence boundaries     | Preserves meaning             | Uneven chunk sizes           |
| **Paragraph**     | Split on double newlines         | Preserves document structure  | Some paragraphs are huge     |

### Fixed-Size Chunker with Overlap

```python
class FixedSizeChunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, text: str) -> list[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk.strip())
            start += self.chunk_size - self.chunk_overlap
        return chunks
```

### Why Overlap?

Imagine a sentence split across two chunks:

```
Chunk 1: "...The PM-KISAN scheme provides Rs. 6000"
Chunk 2: "per year to eligible farmer families..."
```

Without overlap, a query about "PM-KISAN annual amount" might not match
either chunk well enough. With 50-character overlap:

```
Chunk 1: "...The PM-KISAN scheme provides Rs. 6000 per year"
Chunk 2: "provides Rs. 6000 per year to eligible farmer families..."
```

Now both chunks contain the complete fact, improving retrieval accuracy.

### Sentence Chunker

```python
import re

class SentenceChunker:
    def __init__(self, max_chunk_size: int = 500):
        self.max_chunk_size = max_chunk_size

    def chunk(self, text: str) -> list[str]:
        # Split on sentence endings
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) > self.max_chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks
```

### Paragraph Chunker

```python
class ParagraphChunker:
    def __init__(self, max_chunk_size: int = 1000):
        self.max_chunk_size = max_chunk_size

    def chunk(self, text: str) -> list[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(current_chunk) + len(para) > self.max_chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para
            else:
                separator = "\n\n" if current_chunk else ""
                current_chunk += separator + para

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks
```

### Which Strategy to Use?

For GyanSetu's education documents:
- **Textbooks** → Paragraph chunker (preserves topic structure)
- **Government schemes** → Sentence chunker (dense factual content)
- **General documents** → Fixed-size with overlap (safe default)

The configuration lets you choose per-document or set a global default.


---


## SECTION 5 — Gemini Embeddings API

### WHY: Embeddings turn text into numbers that capture meaning — enabling semantic search.

When a teacher asks "How to teach fractions?", we need to find chunks about
teaching fractions even if they use different words like "rational numbers"
or "parts of a whole." Embeddings capture this semantic similarity — texts
with similar meanings have vectors that are close together in 768-dimensional
space.

### How Gemini Embeddings Work

```python
import google.generativeai as genai

genai.configure(api_key="your-key")

# Single text embedding
result = genai.embed_content(
    model="models/embedding-001",
    content="The PM-KISAN scheme provides Rs. 6000 per year",
    task_type="retrieval_document",
)

vector = result["embedding"]  # List of 768 floats
print(f"Dimensions: {len(vector)}")  # 768
print(f"First 5 values: {vector[:5]}")
# [0.0123, -0.0456, 0.0789, -0.0234, 0.0567]
```

### Task Types Matter

Gemini supports different task types that optimize embeddings for different
use cases:

| Task Type              | Use When                            |
|------------------------|-------------------------------------|
| `retrieval_document`   | Embedding a document chunk          |
| `retrieval_query`      | Embedding a search query            |
| `semantic_similarity`  | Comparing two texts                 |
| `classification`       | Text classification                 |

**Critical**: Use `retrieval_document` for chunks and `retrieval_query` for
queries. These are asymmetric — the model optimizes differently for short
queries vs. long passages.

### Batch Embedding

```python
class GeminiEmbedder:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = "models/embedding-001"

    def embed_text(self, text: str, task_type: str = "retrieval_document") -> list[float]:
        result = genai.embed_content(
            model=self.model,
            content=text,
            task_type=task_type,
        )
        return result["embedding"]

    def embed_batch(
        self, texts: list[str], task_type: str = "retrieval_document"
    ) -> list[list[float]]:
        # Gemini supports batch embedding
        result = genai.embed_content(
            model=self.model,
            content=texts,
            task_type=task_type,
        )
        return result["embedding"]
```

### Embedding Dimensions and Similarity

Gemini's embeddings are 768-dimensional. To find similar chunks, we use
**cosine similarity** — the angle between two vectors:

```
similarity = dot(A, B) / (norm(A) * norm(B))
```

- **1.0** = identical meaning
- **0.0** = no relation
- **-1.0** = opposite meaning (rare in practice)

ChromaDB handles this similarity calculation internally, so you just call
`collection.query()` and get ranked results.


---


## SECTION 6 — ChromaDB Setup and Usage

### WHY: A vector database stores embeddings and performs fast similarity search — the core of RAG retrieval.

ChromaDB is an open-source, lightweight vector database that runs embedded
(in-process) or as a standalone server. For GyanSetu, we use persistent
storage so embeddings survive server restarts.

### ChromaDB Fundamentals

```python
import chromadb

# Persistent client — data saved to disk
client = chromadb.PersistentClient(path="./chroma_data")

# Create a collection (like a table)
collection = client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"},  # Use cosine similarity
)

# Add documents with embeddings
collection.add(
    ids=["chunk_1", "chunk_2"],
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],  # 768-dim vectors
    documents=["chunk text 1", "chunk text 2"],
    metadatas=[
        {"doc_id": "doc_1", "chunk_index": 0},
        {"doc_id": "doc_1", "chunk_index": 1},
    ],
)

# Query with an embedding
results = collection.query(
    query_embeddings=[[0.15, 0.25, ...]],  # Query vector
    n_results=5,
    where={"doc_id": "doc_1"},  # Optional metadata filter
)
```

### Vector Store Wrapper

Our `vector_store.py` wraps ChromaDB with a clean interface:

```python
class VectorStore:
    def __init__(self, persist_path: str):
        self.client = chromadb.PersistentClient(path=persist_path)
        self.collection = self.client.get_or_create_collection(
            name="gyansetu_chunks",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(self, chunk_ids, embeddings, texts, metadatas):
        self.collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

    def search(self, query_embedding, n_results=5, doc_filter=None):
        where = {"document_id": doc_filter} if doc_filter else None
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

    def delete_document(self, document_id: str):
        # Delete all chunks belonging to a document
        self.collection.delete(where={"document_id": document_id})
```

### Metadata Filtering

ChromaDB supports filtering results by metadata. This is crucial for
GyanSetu — when a teacher asks about "Class 8 Science," we can filter
to only search chunks from Class 8 Science documents:

```python
results = collection.query(
    query_embeddings=[query_vec],
    n_results=5,
    where={
        "$and": [
            {"subject": "Science"},
            {"class": "8"},
        ]
    },
)
```


---


## SECTION 7 — Prompt Engineering for Grounded Answers

### WHY: The quality of RAG answers depends entirely on how you prompt the LLM with retrieved context.

The prompt template is where RAG magic happens. You take the user's question,
the retrieved chunks, and instructions for the model — and combine them into
a prompt that produces accurate, cited answers.

### The RAG Prompt Template

```python
RAG_PROMPT_TEMPLATE = """You are GyanSetu, an educational knowledge assistant.
Answer the question based ONLY on the provided context. If the context does not
contain enough information to answer the question, say "I could not find enough
information in the uploaded documents to answer this question."

CONTEXT:
{context}

QUESTION: {question}

INSTRUCTIONS:
1. Answer based ONLY on the provided context. Do not use external knowledge.
2. Be specific and cite which document the information comes from.
3. If multiple documents contain relevant information, synthesize them.
4. Use simple, clear language appropriate for teachers.
5. If the question is in Hindi, answer in Hindi.

ANSWER:"""
```

### Why "ONLY on the provided context"?

Without this instruction, Gemini will mix its training data with retrieved
chunks, leading to answers that sound right but contain unverifiable claims.
The "ONLY" constraint forces grounding — every fact in the answer must trace
back to a retrieved chunk.

### Building Context from Retrieved Chunks

```python
def build_context(search_results: dict) -> str:
    """Format retrieved chunks into a context string for the prompt."""
    context_parts = []
    for i, (doc, metadata) in enumerate(
        zip(search_results["documents"][0], search_results["metadatas"][0])
    ):
        source = metadata.get("filename", "Unknown")
        chunk_idx = metadata.get("chunk_index", "?")
        context_parts.append(
            f"[Source: {source}, Section {chunk_idx}]\n{doc}"
        )
    return "\n\n---\n\n".join(context_parts)
```

### Citation Extraction

```python
class Source(BaseModel):
    document_name: str
    chunk_index: int
    relevance_score: float
    text_preview: str  # First 200 chars of the chunk

def extract_sources(search_results: dict) -> list[Source]:
    sources = []
    for i, (meta, distance) in enumerate(
        zip(search_results["metadatas"][0], search_results["distances"][0])
    ):
        sources.append(Source(
            document_name=meta.get("filename", "Unknown"),
            chunk_index=meta.get("chunk_index", 0),
            relevance_score=round(1 - distance, 4),  # Convert distance to similarity
            text_preview=search_results["documents"][0][i][:200],
        ))
    return sources
```


---


## SECTION 8 — Conversation Memory with RAG

### WHY: Teachers ask follow-up questions — the system must remember context across turns.

A real conversation looks like this:

```
Teacher: "What are the learning outcomes for Class 8 Science Chapter 3?"
GyanSetu: "The learning outcomes for Chapter 3 (Synthetic Fibres)..."

Teacher: "How should I assess these?"
GyanSetu: ??? (What is "these"? Need conversation memory!)
```

Without memory, "these" has no referent. With memory, we prepend the
conversation history to the query so the system understands context.

### Chat with Memory

```python
class RAGEngine:
    def chat(
        self,
        message: str,
        history: list[dict],  # [{"role": "user/assistant", "content": "..."}]
    ) -> dict:
        # Build conversation context
        conv_context = ""
        for msg in history[-6:]:  # Last 3 exchanges
            role = msg["role"].upper()
            conv_context += f"{role}: {msg['content']}\n"

        # Augment the query with conversation context
        augmented_query = f"{conv_context}\nUSER: {message}"

        # Embed and search (use the latest message for embedding)
        query_embedding = self.embedder.embed_text(message, "retrieval_query")
        results = self.vector_store.search(query_embedding, n_results=5)

        # Build prompt with both conversation history and retrieved context
        context = build_context(results)
        prompt = CHAT_PROMPT_TEMPLATE.format(
            history=conv_context,
            context=context,
            question=message,
        )

        # Generate answer
        response = self.model.generate_content(prompt)
        return {
            "answer": response.text,
            "sources": extract_sources(results),
        }
```

### Chat Prompt Template

```python
CHAT_PROMPT_TEMPLATE = """You are GyanSetu, an educational knowledge assistant.
You are in a conversation with a teacher. Use the conversation history and
retrieved context to answer the latest question.

CONVERSATION HISTORY:
{history}

RETRIEVED CONTEXT:
{context}

LATEST QUESTION: {question}

Answer based on the context. Maintain conversation continuity — understand
references like "these", "it", "that chapter" from the history. If you cannot
answer from the context, say so clearly.

ANSWER:"""
```


---


## SECTION 9 — Evaluating RAG Quality

### WHY: Without metrics, you cannot know if your RAG system is actually working well.

A RAG system can fail silently — it returns an answer that sounds plausible
but is wrong. Evaluation metrics help you catch these issues.

### Key RAG Metrics

| Metric              | What It Measures                          | How to Check                    |
|---------------------|-------------------------------------------|---------------------------------|
| **Retrieval Recall**| Did we find the right chunks?             | Are relevant chunks in top-K?   |
| **Answer Accuracy** | Is the answer factually correct?          | Compare to known correct answer |
| **Faithfulness**    | Does the answer ONLY use retrieved context?| Check for hallucinated facts    |
| **Relevance**       | Is the answer relevant to the question?   | Does it address what was asked? |
| **Citation Quality**| Do sources actually support the answer?   | Verify each citation            |

### Simple Evaluation Approach

For GyanSetu, create test question-answer pairs from your sample documents:

```python
TEST_CASES = [
    {
        "question": "What does the Preamble of India declare?",
        "expected_keywords": ["sovereign", "socialist", "secular", "democratic", "republic"],
        "expected_source": "indian_constitution_preamble.txt",
    },
    {
        "question": "How much money does PM-KISAN provide per year?",
        "expected_keywords": ["6000", "Rs", "three installments"],
        "expected_source": "pm_kisan_scheme.txt",
    },
]

def evaluate(engine, test_cases):
    results = []
    for tc in test_cases:
        response = engine.query(tc["question"])
        # Check keyword presence
        keyword_hits = sum(
            1 for kw in tc["expected_keywords"]
            if kw.lower() in response["answer"].lower()
        )
        recall = keyword_hits / len(tc["expected_keywords"])
        # Check source attribution
        source_correct = any(
            tc["expected_source"] in s.document_name
            for s in response["sources"]
        )
        results.append({
            "question": tc["question"],
            "keyword_recall": recall,
            "source_correct": source_correct,
        })
    return results
```

### Common RAG Failure Modes

1. **Wrong chunks retrieved** — Chunking strategy or embedding model mismatch.
   Fix: Try different chunk sizes, add overlap.

2. **Right chunks, wrong answer** — Prompt does not constrain the model enough.
   Fix: Strengthen the "ONLY use context" instruction.

3. **Hallucinated citations** — Model invents source references.
   Fix: Generate citations from metadata, not from the LLM output.

4. **Missing context** — Chunk is too small to contain the full answer.
   Fix: Increase chunk size or retrieve more chunks (higher K).


---


## SECTION 10 — Docker Setup with ChromaDB

### WHY: ChromaDB needs persistent storage and its own container in production.

Running ChromaDB embedded (in-process) works for development, but production
needs a separate ChromaDB server for reliability and scaling.

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/chroma_data /app/uploads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - chroma_data:/app/chroma_data
      - upload_data:/app/uploads
    depends_on:
      - chromadb
    environment:
      - CHROMA_HOST=chromadb
      - CHROMA_PORT=8001
    restart: unless-stopped

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - ANONYMIZED_TELEMETRY=FALSE
    restart: unless-stopped

volumes:
  chroma_data:
  upload_data:
```

### Running It

```bash
# Development (embedded ChromaDB)
cp .env.example .env
# Edit .env to add GEMINI_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload

# Production (Docker Compose with ChromaDB server)
docker-compose up --build

# Test with sample documents
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@sample_docs/indian_constitution_preamble.txt" \
  -F "title=Indian Constitution Preamble"

curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the Preamble declare?"}'
```


---


## SECTION 11 — API Reference

### WHY: A complete API reference makes your RAG system usable as a service.

### Document Management

| Method | Endpoint                 | Description                          |
|--------|--------------------------|--------------------------------------|
| POST   | `/documents/upload`      | Upload and process a document        |
| GET    | `/documents`             | List all uploaded documents          |
| GET    | `/documents/{id}`        | Get document details and chunk count |
| DELETE | `/documents/{id}`        | Delete document and its chunks       |

### Querying

| Method | Endpoint    | Description                               |
|--------|-------------|-------------------------------------------|
| POST   | `/query`    | Ask a question, get answer with sources   |
| POST   | `/chat`     | Multi-turn conversation with memory       |

### System

| Method | Endpoint    | Description                               |
|--------|-------------|-------------------------------------------|
| GET    | `/health`   | Health check with service status          |
| GET    | `/stats`    | Document count, chunk count, DB size      |

### POST /documents/upload — Request

```
Content-Type: multipart/form-data

Fields:
  file: <binary file data>   (required, .txt or .md)
  title: "Document Title"    (optional, defaults to filename)
  chunk_strategy: "fixed" | "sentence" | "paragraph"  (default: "sentence")
```

### POST /documents/upload — Response

```json
{
  "id": "doc_abc123",
  "title": "Indian Constitution Preamble",
  "filename": "indian_constitution_preamble.txt",
  "chunk_count": 3,
  "chunk_strategy": "sentence",
  "created_at": "2025-01-15T10:30:00"
}
```

### POST /query — Request

```json
{
  "question": "What does the Preamble of India declare?",
  "n_results": 5,
  "document_id": null
}
```

### POST /query — Response

```json
{
  "answer": "The Preamble of the Indian Constitution declares India to be a sovereign, socialist, secular, democratic republic. It resolves to secure justice, liberty, equality, and fraternity for all citizens.",
  "sources": [
    {
      "document_name": "indian_constitution_preamble.txt",
      "chunk_index": 0,
      "relevance_score": 0.9234,
      "text_preview": "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC..."
    }
  ],
  "processing_time_ms": 1850.5
}
```

### POST /chat — Request

```json
{
  "message": "How should I assess these learning outcomes?",
  "history": [
    {"role": "user", "content": "What are the learning outcomes for Class 8 Science?"},
    {"role": "assistant", "content": "The learning outcomes for Class 8 Science include..."}
  ],
  "n_results": 5
}
```

### Error Responses

| Status | Meaning                                    |
|--------|--------------------------------------------|
| 400    | Invalid file type or missing fields        |
| 404    | Document not found                         |
| 422    | Validation error (Pydantic)                |
| 503    | Gemini API or ChromaDB unavailable         |
| 500    | Internal processing error                  |


---


## KEY TAKEAWAYS

1. **RAG = Retrieve + Augment + Generate** — retrieve relevant chunks from
   your documents, augment the prompt with that context, and generate an
   answer grounded in your data. It solves the "LLMs do not know your data"
   problem without fine-tuning.

2. **Chunking strategy matters more than model choice** — bad chunks mean
   bad retrieval, and no amount of prompt engineering fixes that. Test
   different strategies (fixed, sentence, paragraph) for your document types.

3. **Overlap in chunks prevents information loss** — a 50-character overlap
   ensures facts that span chunk boundaries are still retrievable.

4. **Use different embedding task types for docs vs queries** — Gemini
   optimizes `retrieval_document` and `retrieval_query` asymmetrically.
   Using the wrong task type degrades search quality.

5. **"Answer ONLY from context" is the most important prompt instruction** —
   without it, the model happily mixes retrieved context with hallucinated
   facts. Grounding requires explicit constraint.

6. **Citations must come from metadata, not the LLM** — never ask the model
   to "cite your sources." It will invent plausible-looking citations.
   Extract citations from ChromaDB metadata programmatically.

7. **Conversation memory enables follow-up questions** — prepend the last
   few exchanges to the prompt so the model understands references like
   "these," "it," and "that chapter."

8. **Evaluate your RAG pipeline with test cases** — create question-answer
   pairs from your documents and measure keyword recall, source accuracy,
   and faithfulness. Silent failures are the biggest risk in RAG systems.

### What's Next?

GyanSetu gives you a production-ready RAG foundation. Extend it with:
- PDF support using PyMuPDF or pdfplumber
- Hindi and regional language support with multilingual embeddings
- Hybrid search (keyword BM25 + vector similarity)
- Streaming responses for long answers
- User authentication so each teacher has their own document collection
- Webhook notifications when document processing completes
- Analytics dashboard showing popular questions and retrieval quality

Together with ChitraVarnan (Chapter 25), you now have two powerful AI
patterns: vision analysis and knowledge retrieval. These form the building
blocks of every modern AI-powered application — from e-commerce product
analysis to educational knowledge bases.
