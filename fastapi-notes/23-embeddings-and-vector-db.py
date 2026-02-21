"""
============================================================
FILE 23: EMBEDDINGS AND VECTOR DATABASES
============================================================
Topics: embeddings, vector representations, cosine similarity,
        Gemini embedding API, ChromaDB, Pinecone, semantic
        search, metadata filtering, batch embeddings, distance
        metrics, in-memory vs persistent vector stores

WHY THIS MATTERS:
Traditional search is keyword-based — "red kurti" only finds
listings with those exact words. Embeddings convert text to
numerical vectors that capture MEANING. So "affordable red
kurta for women" also finds "ladies maroon ethnic top under
500." This is how modern search and RAG work.
============================================================
"""

# STORY: Meesho — 150M Products, Semantic Search Revolution
# Meesho (Bangalore) is India's largest social commerce platform
# with 150M+ product listings from small sellers. Most sellers
# write poor titles like "good quality dress material combo."
# Meesho uses embeddings to understand buyer INTENT — when a
# user types "red kurti under 500," vector search finds relevant
# products even without keyword matches, increasing search-to-
# purchase conversion by 35%.

import os
import json
import math
import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query, status
from pydantic import BaseModel, Field


# ════════════════════════════════════════════════════════════
# SECTION 1 — What Are Embeddings?
# ════════════════════════════════════════════════════════════

# WHY: Computers understand numbers, not text. Embeddings
# convert text into a list of numbers (a vector) that captures
# the MEANING. Similar meanings produce similar vectors.

# Example (simplified to 3D):
#   "king"   → [0.8, 0.2, 0.9]
#   "queen"  → [0.7, 0.3, 0.9]   ← close to king (royalty)
#   "apple"  → [0.1, 0.9, 0.2]   ← far from king (different concept)
#
# Real embeddings: Gemini embedding-001 → 768 dimensions
# KEY INSIGHT: "comfortable office chair" ≈ "ergonomic desk seating"
# Almost NO words in common, but embeddings are very close.

# Embedding dimensions by model:
#   Gemini embedding-001        → 768 dims
#   OpenAI text-embedding-3-small → 1536 dims
#   Cohere embed-english-v3     → 1024 dims


# ════════════════════════════════════════════════════════════
# SECTION 2 — Cosine Similarity: The Math
# ════════════════════════════════════════════════════════════

# WHY: With two vectors, you need a similarity metric.
# Cosine similarity measures the angle between vectors:
#   1.0 = identical meaning, 0.0 = unrelated, -1.0 = opposite

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    cos(θ) = (A · B) / (||A|| × ||B||)
    This is the SAME math powering Google Search, Meesho's
    product matching, and every vector database.
    """
    if len(vec_a) != len(vec_b):
        raise ValueError(f"Dimension mismatch: {len(vec_a)} vs {len(vec_b)}")
    dot_prod = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot_prod / (mag_a * mag_b)

# Distance metrics comparison:
# Cosine: measures angle, ignores magnitude — best for text similarity
# Euclidean: straight-line distance — best when magnitude matters
# Dot Product: alignment + magnitude — best for recommendations

def euclidean_distance(vec_a: List[float], vec_b: List[float]) -> float:
    """Euclidean distance — straight line between two points."""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(vec_a, vec_b)))


# ════════════════════════════════════════════════════════════
# SECTION 3 — Generating Embeddings with Gemini
# ════════════════════════════════════════════════════════════

# WHY: Google's embedding model is free (1500 RPM) and produces
# high-quality 768-dim vectors. Perfect for Indian startups.

# PRODUCTION CODE:
# import google.generativeai as genai
# genai.configure(api_key=os.environ["GEMINI_API_KEY"])
# result = genai.embed_content(
#     model="models/embedding-001",
#     content="comfortable office chair",
#     task_type="retrieval_document",  # or "retrieval_query"
# )
# embedding = result["embedding"]  # List of 768 floats
#
# Task types: retrieval_document (for docs), retrieval_query (for search),
# semantic_similarity (comparing texts), classification (categorization)

EMBEDDING_DIM = 768

def generate_embedding(text: str, task_type: str = "retrieval_document") -> List[float]:
    """
    Simulated embedding for teaching. PRODUCTION: use genai.embed_content()
    Produces deterministic vectors from text hash so same text = same vector.
    """
    hash_bytes = hashlib.sha256(text.encode()).digest()
    embedding = []
    for i in range(EMBEDDING_DIM):
        byte_idx = i % len(hash_bytes)
        value = (hash_bytes[byte_idx] / 255.0) * 2 - 1
        value = value * math.cos(i * 0.01) * 0.5
        embedding.append(round(value, 6))
    magnitude = math.sqrt(sum(x * x for x in embedding))
    if magnitude > 0:
        embedding = [x / magnitude for x in embedding]
    return embedding

def generate_embeddings_batch(texts: List[str],
                              task_type: str = "retrieval_document") -> List[List[float]]:
    """
    Batch embed multiple texts — 5-10x faster than one-by-one.
    PRODUCTION: genai.embed_content(model=..., content=texts_list)
    Meesho embeds 10,000 products per batch during nightly re-indexing.
    """
    return [generate_embedding(t, task_type) for t in texts]


# ════════════════════════════════════════════════════════════
# SECTION 4 — ChromaDB: Local Vector Database
# ════════════════════════════════════════════════════════════

# WHY: You need somewhere to STORE and SEARCH embeddings.
# ChromaDB runs locally, no signup, no cloud, no credit card.
# Perfect for dev and datasets up to ~1M vectors.
# Install: pip install chromadb

# PRODUCTION CODE:
# import chromadb
# client = chromadb.Client()  # in-memory
# client = chromadb.PersistentClient(path="./chroma_data")  # persistent
# collection = client.create_collection("products", metadata={"hnsw:space": "cosine"})
# collection.add(documents=[...], embeddings=[...], ids=[...], metadatas=[...])
# results = collection.query(query_embeddings=[...], n_results=5, where={"category": "kurti"})

class SimulatedCollection:
    """Simulates ChromaDB collection with cosine search and metadata filtering."""

    def __init__(self, name: str, metadata: Dict = None):
        self.name = name
        self.metadata = metadata or {}
        self.documents: List[str] = []
        self.embeddings: List[List[float]] = []
        self.ids: List[str] = []
        self.metadatas: List[Dict] = []

    def add(self, documents: List[str], embeddings: List[List[float]],
            ids: List[str], metadatas: List[Dict] = None):
        """Add documents with embeddings and optional metadata."""
        metadatas = metadatas or [{}] * len(documents)
        for doc, emb, doc_id, meta in zip(documents, embeddings, ids, metadatas):
            if doc_id in self.ids:  # Update existing
                idx = self.ids.index(doc_id)
                self.documents[idx] = doc
                self.embeddings[idx] = emb
                self.metadatas[idx] = meta
            else:  # Insert new
                self.documents.append(doc)
                self.embeddings.append(emb)
                self.ids.append(doc_id)
                self.metadatas.append(meta)

    def query(self, query_embeddings: List[List[float]], n_results: int = 5,
              where: Dict = None) -> Dict:
        """Search by cosine similarity with optional metadata filter."""
        if not self.embeddings:
            return {"ids": [[]], "documents": [[]], "distances": [[]], "metadatas": [[]]}
        query_emb = query_embeddings[0]
        scored = []
        for i, (emb, doc, did, meta) in enumerate(
            zip(self.embeddings, self.documents, self.ids, self.metadatas)):
            if where and not all(meta.get(k) == v for k, v in where.items()):
                continue
            distance = 1.0 - cosine_similarity(query_emb, emb)
            scored.append((did, doc, distance, meta))
        scored.sort(key=lambda x: x[2])
        top = scored[:n_results]
        return {
            "ids": [[x[0] for x in top]], "documents": [[x[1] for x in top]],
            "distances": [[round(x[2], 4) for x in top]],
            "metadatas": [[x[3] for x in top]],
        }

    def count(self) -> int:
        return len(self.documents)

    def get(self, ids: List[str] = None) -> Dict:
        if ids is None:
            return {"ids": self.ids, "documents": self.documents, "metadatas": self.metadatas}
        result = {"ids": [], "documents": [], "metadatas": []}
        for did in ids:
            if did in self.ids:
                idx = self.ids.index(did)
                result["ids"].append(did)
                result["documents"].append(self.documents[idx])
                result["metadatas"].append(self.metadatas[idx])
        return result


class SimulatedChromaClient:
    """Simulates chromadb.Client() with collection management."""
    def __init__(self):
        self.collections: Dict[str, SimulatedCollection] = {}

    def create_collection(self, name: str, metadata: Dict = None,
                          get_or_create: bool = False) -> SimulatedCollection:
        if name in self.collections and get_or_create:
            return self.collections[name]
        self.collections[name] = SimulatedCollection(name, metadata)
        return self.collections[name]

    def get_collection(self, name: str) -> SimulatedCollection:
        if name not in self.collections:
            raise ValueError(f"Collection '{name}' not found")
        return self.collections[name]

    def list_collections(self) -> List[str]:
        return list(self.collections.keys())

    def delete_collection(self, name: str):
        self.collections.pop(name, None)


# ════════════════════════════════════════════════════════════
# SECTION 5 — Pinecone: Cloud Vector Database
# ════════════════════════════════════════════════════════════

# WHY: ChromaDB is great for dev, but production at scale
# (millions of vectors, multiple servers) needs a managed
# cloud vector DB. Pinecone free tier: 100K vectors.
# Install: pip install pinecone-client

# PRODUCTION CODE:
# from pinecone import Pinecone, ServerlessSpec
# pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
# pc.create_index(name="products", dimension=768, metric="cosine",
#     spec=ServerlessSpec(cloud="aws", region="us-east-1"))
# index = pc.Index("products")
# index.upsert(vectors=[{"id": "p1", "values": [...], "metadata": {...}}],
#     namespace="women-clothing")  # Multi-tenancy via namespaces
# results = index.query(vector=[...], top_k=5,
#     filter={"price": {"$lte": 1000}}, include_metadata=True)

# ChromaDB vs Pinecone:
#   ChromaDB: local, free, ~1M vectors, great for dev
#   Pinecone: cloud, free tier 100K, scales to billions


# ════════════════════════════════════════════════════════════
# SECTION 6 — Pydantic Models
# ════════════════════════════════════════════════════════════

class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    task_type: str = Field("retrieval_document",
        description="retrieval_document, retrieval_query, semantic_similarity, classification")

class EmbedResponse(BaseModel):
    text: str
    embedding_dim: int
    embedding_preview: List[float]  # First 10 dims
    model: str

class IndexRequest(BaseModel):
    document_id: str = Field(..., min_length=1, max_length=100)
    text: str = Field(..., min_length=1, max_length=50000)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    collection: str = Field("default")

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=5000)
    n_results: int = Field(5, ge=1, le=50)
    collection: str = Field("default")

class FilteredSearchRequest(SearchRequest):
    filters: Dict[str, Any] = Field(..., description='e.g., {"category": "electronics"}')

class SearchResult(BaseModel):
    document_id: str
    text: str
    similarity_score: float
    metadata: Dict[str, Any]

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    collection: str

class BatchIndexRequest(BaseModel):
    documents: List[IndexRequest] = Field(..., min_length=1, max_length=100)


# ════════════════════════════════════════════════════════════
# SECTION 7 — FastAPI App and Sample Data
# ════════════════════════════════════════════════════════════

app = FastAPI(
    title="Meesho Semantic Search API",
    description="Semantic product search powered by embeddings and vector databases.",
    version="1.0.0",
)

chroma_client = SimulatedChromaClient()

SAMPLE_PRODUCTS = [
    {"id": "prod_001",
     "text": "Premium cotton kurti with chikankari embroidery, perfect for office wear "
             "and festive occasions, available in red and maroon",
     "metadata": {"category": "women-clothing", "price": 899, "seller": "lucknow_crafts"}},
    {"id": "prod_002",
     "text": "Ergonomic mesh office chair with lumbar support and adjustable armrests, "
             "breathable fabric for long work-from-home sessions in Indian summers",
     "metadata": {"category": "furniture", "price": 8999, "seller": "office_comfort"}},
    {"id": "prod_003",
     "text": "Wireless Bluetooth earbuds with noise cancellation, 30-hour battery, "
             "IPX5 waterproof, deep bass for Bollywood and hip-hop music",
     "metadata": {"category": "electronics", "price": 2499, "seller": "tech_bazaar"}},
    {"id": "prod_004",
     "text": "Organic Darjeeling green tea loose leaf 250g, first flush premium, "
             "antioxidant-rich, sourced directly from Darjeeling estates",
     "metadata": {"category": "grocery", "price": 449, "seller": "tea_garden_direct"}},
    {"id": "prod_005",
     "text": "Men's formal slim-fit cotton shirt sky blue, wrinkle-free, perfect for "
             "office and interviews, sizes S to XXL",
     "metadata": {"category": "men-clothing", "price": 799, "seller": "delhi_fashion"}},
    {"id": "prod_006",
     "text": "Stainless steel pressure cooker 5L induction base ISI certified, "
             "ideal for dal rice biryani and Indian curries",
     "metadata": {"category": "kitchen", "price": 1899, "seller": "kitchen_india"}},
    {"id": "prod_007",
     "text": "Banarasi silk saree royal blue with gold zari work, handwoven by "
             "artisans, perfect for weddings and special occasions",
     "metadata": {"category": "women-clothing", "price": 4599, "seller": "varanasi_weaves"}},
    {"id": "prod_008",
     "text": "Portable laptop stand with cooling fan, adjustable height, aluminum, "
             "compatible with MacBook and all laptops up to 17 inches",
     "metadata": {"category": "electronics", "price": 1299, "seller": "tech_bazaar"}},
]

@app.on_event("startup")
async def seed_products():
    """Seed default collection with sample Indian e-commerce products."""
    collection = chroma_client.create_collection(
        name="products", metadata={"hnsw:space": "cosine"}, get_or_create=True)
    texts = [p["text"] for p in SAMPLE_PRODUCTS]
    embeddings = generate_embeddings_batch(texts)
    collection.add(documents=texts, embeddings=embeddings,
                   ids=[p["id"] for p in SAMPLE_PRODUCTS],
                   metadatas=[p["metadata"] for p in SAMPLE_PRODUCTS])


# ════════════════════════════════════════════════════════════
# SECTION 8 — POST /embed (Generate Embedding)
# ════════════════════════════════════════════════════════════

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """Generate embedding vector. Returns first 10 dims as preview."""
    embedding = generate_embedding(request.text, request.task_type)
    return EmbedResponse(text=request.text, embedding_dim=len(embedding),
                         embedding_preview=embedding[:10], model="models/embedding-001")


# ════════════════════════════════════════════════════════════
# SECTION 9 — POST /index (Add Document to Vector Store)
# ════════════════════════════════════════════════════════════

# WHY: To search, you first index documents. This generates
# the embedding and stores text + embedding + metadata.

@app.post("/index")
async def index_document(request: IndexRequest):
    """Add a document: generate embedding and store in ChromaDB."""
    try:
        collection = chroma_client.get_collection(request.collection)
    except ValueError:
        collection = chroma_client.create_collection(
            name=request.collection, metadata={"hnsw:space": "cosine"})
    embedding = generate_embedding(request.text)
    collection.add(documents=[request.text], embeddings=[embedding],
                   ids=[request.document_id], metadatas=[request.metadata])
    return {"message": f"Document '{request.document_id}' indexed",
            "collection": request.collection, "embedding_dim": len(embedding),
            "total_documents": collection.count()}


# ════════════════════════════════════════════════════════════
# SECTION 10 — POST /index/batch (Batch Indexing)
# ════════════════════════════════════════════════════════════

# WHY: One-by-one indexing is slow. Batch reduces API calls
# and network overhead. Meesho processes 100K products per batch.

@app.post("/index/batch")
async def batch_index(request: BatchIndexRequest):
    """Add multiple documents at once — much faster than calling /index repeatedly."""
    by_coll: Dict[str, List[IndexRequest]] = {}
    for doc in request.documents:
        by_coll.setdefault(doc.collection, []).append(doc)
    results = []
    for coll_name, docs in by_coll.items():
        try:
            collection = chroma_client.get_collection(coll_name)
        except ValueError:
            collection = chroma_client.create_collection(
                name=coll_name, metadata={"hnsw:space": "cosine"})
        texts = [d.text for d in docs]
        embeddings = generate_embeddings_batch(texts)
        collection.add(documents=texts, embeddings=embeddings,
                       ids=[d.document_id for d in docs],
                       metadatas=[d.metadata for d in docs])
        results.append({"collection": coll_name, "added": len(docs),
                        "total": collection.count()})
    return {"batch_results": results, "total_indexed": len(request.documents)}


# ════════════════════════════════════════════════════════════
# SECTION 11 — POST /search (Semantic Search)
# ════════════════════════════════════════════════════════════

# WHY: This is where the magic happens. Natural language query
# → embedding → find most similar documents. "comfortable
# office chair" finds the ergonomic chair without exact keywords.

@app.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Semantic search via vector similarity.
    Try: "comfortable chair for working from home" → finds office chair
         "ethnic Indian dress" → finds kurti and saree
         "music headphones" → finds Bluetooth earbuds
    """
    try:
        collection = chroma_client.get_collection(request.collection)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Collection '{request.collection}' not found")
    # Use retrieval_query task type — optimized differently than document embeddings
    query_emb = generate_embedding(request.query, task_type="retrieval_query")
    results = collection.query(query_embeddings=[query_emb], n_results=request.n_results)
    search_results = [
        SearchResult(document_id=results["ids"][0][i], text=results["documents"][0][i],
                     similarity_score=round(1.0 - results["distances"][0][i], 4),
                     metadata=results["metadatas"][0][i])
        for i in range(len(results["ids"][0]))
    ]
    return SearchResponse(query=request.query, results=search_results,
                          total_results=len(search_results), collection=request.collection)


# ════════════════════════════════════════════════════════════
# SECTION 12 — POST /search/filtered (Metadata Filtering)
# ════════════════════════════════════════════════════════════

# WHY: Pure semantic search is not enough. "kurti under 500"
# needs semantic matching (kurti = ethnic top) AND price
# filtering. Metadata filters combine both approaches.

@app.post("/search/filtered", response_model=SearchResponse)
async def filtered_search(request: FilteredSearchRequest):
    """Semantic search + metadata filter. Example: {"category": "electronics"}"""
    try:
        collection = chroma_client.get_collection(request.collection)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Collection '{request.collection}' not found")
    query_emb = generate_embedding(request.query, task_type="retrieval_query")
    results = collection.query(query_embeddings=[query_emb], n_results=request.n_results,
                               where=request.filters)
    search_results = [
        SearchResult(document_id=results["ids"][0][i], text=results["documents"][0][i],
                     similarity_score=round(1.0 - results["distances"][0][i], 4),
                     metadata=results["metadatas"][0][i])
        for i in range(len(results["ids"][0]))
    ]
    return SearchResponse(query=request.query, results=search_results,
                          total_results=len(search_results), collection=request.collection)


# ════════════════════════════════════════════════════════════
# SECTION 13 — Utility Endpoints
# ════════════════════════════════════════════════════════════

@app.get("/collections")
async def list_collections():
    """List all collections with document counts."""
    names = chroma_client.list_collections()
    return {"collections": [{"name": n, "documents": chroma_client.get_collection(n).count(),
                              "metadata": chroma_client.get_collection(n).metadata}
                             for n in names], "total": len(names)}

@app.get("/collections/{name}/documents")
async def list_documents(name: str, limit: int = Query(20, ge=1, le=100)):
    """List documents in a collection."""
    try:
        coll = chroma_client.get_collection(name)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Collection '{name}' not found")
    all_docs = coll.get()
    return {"collection": name,
            "documents": [{"id": all_docs["ids"][i], "text": all_docs["documents"][i][:200],
                           "metadata": all_docs["metadatas"][i]}
                          for i in range(min(limit, len(all_docs["ids"])))],
            "total": len(all_docs["ids"])}

@app.post("/similarity")
async def compare_similarity(text_a: str = Query(...), text_b: str = Query(...)):
    """
    Compare semantic similarity between two texts (0.0 to 1.0).
    Try: "red kurti" vs "maroon ethnic top" — should be similar!
    """
    sim = cosine_similarity(generate_embedding(text_a), generate_embedding(text_b))
    interp = ("very similar" if sim > 0.8 else "similar" if sim > 0.6
              else "somewhat related" if sim > 0.4 else "different" if sim > 0.2
              else "unrelated")
    return {"text_a": text_a, "text_b": text_b,
            "cosine_similarity": round(sim, 4), "interpretation": interp}

@app.get("/health")
async def health_check():
    """Health check for the vector search service."""
    names = chroma_client.list_collections()
    total = sum(chroma_client.get_collection(n).count() for n in names)
    return {"status": "healthy", "embedding_model": "models/embedding-001",
            "embedding_dim": EMBEDDING_DIM, "collections": len(names),
            "total_documents": total, "vector_db": "ChromaDB (simulated)",
            "timestamp": datetime.now(timezone.utc).isoformat()}


# ════════════════════════════════════════════════════════════
# KEY TAKEAWAYS
# ════════════════════════════════════════════════════════════
# 1. Embeddings convert text to numerical vectors that capture MEANING, not just keywords
# 2. Cosine similarity measures angle between vectors: 1.0 = same, 0.0 = unrelated
# 3. Gemini embedding-001 is free (1500 RPM) and produces 768-dimensional vectors
# 4. ChromaDB runs locally with zero setup — perfect for development and small datasets
# 5. Pinecone is the production choice for millions of vectors across multiple servers
# 6. Always use task_type="retrieval_query" for queries and "retrieval_document" for docs
# 7. Metadata filtering combines semantic search with traditional database-style filters
# 8. Batch embedding is 5-10x faster than embedding one document at a time
# 9. Cosine similarity is the standard metric for text; euclidean for spatial data
# 10. Semantic search finds "ergonomic desk chair" when you search "comfortable office chair"
# "Data is the new oil, but embeddings are the refinery." — inspired by Meesho's AI team
