# ============================================================
# GyanSetu — Vector Store (ChromaDB Wrapper)
# ============================================================
# Wraps ChromaDB with a clean interface for adding chunks,
# searching by embedding, and deleting documents.
# ============================================================

import logging
from typing import Any

import chromadb

logger = logging.getLogger(__name__)


class VectorStore:
    """
    ChromaDB wrapper for storing and searching document chunk embeddings.

    Uses persistent storage so embeddings survive server restarts.
    The collection uses cosine similarity for vector comparison.
    """

    def __init__(
        self,
        persist_path: str = "./chroma_data",
        collection_name: str = "gyansetu_chunks",
    ):
        """
        Initialize ChromaDB client and get/create the collection.

        Args:
            persist_path: Directory for ChromaDB persistent storage.
            collection_name: Name of the vector collection.
        """
        self.client = chromadb.PersistentClient(path=persist_path)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "VectorStore initialized: collection='%s', persist='%s', count=%d",
            collection_name,
            persist_path,
            self.collection.count(),
        )

    def add_chunks(
        self,
        chunk_ids: list[str],
        embeddings: list[list[float]],
        texts: list[str],
        metadatas: list[dict[str, Any]],
    ) -> None:
        """
        Add document chunks with their embeddings to the vector store.

        Args:
            chunk_ids: Unique IDs for each chunk.
            embeddings: Vector embeddings for each chunk.
            texts: Raw text content of each chunk.
            metadatas: Metadata dict for each chunk (doc_id, filename, etc.).
        """
        self.collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )
        logger.info("Added %d chunks to vector store", len(chunk_ids))

    def search(
        self,
        query_embedding: list[float],
        n_results: int = 5,
        document_id: str | None = None,
    ) -> dict:
        """
        Search for similar chunks using a query embedding.

        Args:
            query_embedding: The query vector (768-dim).
            n_results: Number of results to return.
            document_id: Optional filter to search within a specific document.

        Returns:
            ChromaDB query results dict with documents, metadatas, distances.
        """
        where_filter = None
        if document_id:
            where_filter = {"document_id": document_id}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        logger.debug(
            "Vector search returned %d results (filter=%s)",
            len(results["documents"][0]) if results["documents"] else 0,
            document_id or "none",
        )
        return results

    def delete_document(self, document_id: str) -> None:
        """
        Delete all chunks belonging to a specific document.

        Args:
            document_id: The document ID whose chunks should be removed.
        """
        self.collection.delete(where={"document_id": document_id})
        logger.info("Deleted all chunks for document_id=%s", document_id)

    def get_count(self) -> int:
        """Return total number of chunks in the collection."""
        return self.collection.count()

    def get_document_chunks(self, document_id: str) -> dict:
        """Retrieve all chunks for a specific document."""
        return self.collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"],
        )
