# ============================================================
# GyanSetu — Gemini Embedding Service
# ============================================================
# Generates vector embeddings using Google's Gemini API.
# Supports single text and batch embedding with proper task types.
# ============================================================

import logging
from typing import Literal

logger = logging.getLogger(__name__)

# Type alias for task types
TaskType = Literal[
    "retrieval_document",
    "retrieval_query",
    "semantic_similarity",
    "classification",
]


class GeminiEmbedder:
    """
    Generates text embeddings using Google Gemini's embedding API.

    Uses asymmetric task types:
    - retrieval_document: for embedding document chunks (longer text)
    - retrieval_query: for embedding search queries (shorter text)

    This distinction improves search quality because the model
    optimizes differently for short queries vs. long passages.
    """

    def __init__(self, api_key: str, model: str = "models/embedding-001"):
        """
        Initialize the embedder. Deferred import to avoid issues
        if google-generativeai is not installed during py_compile.
        """
        self.api_key = api_key
        self.model = model
        self._configured = False

    def _ensure_configured(self) -> None:
        """Lazy configuration — only import and configure on first use."""
        if not self._configured:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._configured = True

    def embed_text(
        self,
        text: str,
        task_type: TaskType = "retrieval_document",
    ) -> list[float]:
        """
        Generate an embedding for a single text string.

        Args:
            text: The text to embed.
            task_type: Gemini embedding task type.

        Returns:
            List of floats (768-dimensional vector).
        """
        self._ensure_configured()
        import google.generativeai as genai

        result = genai.embed_content(
            model=self.model,
            content=text,
            task_type=task_type,
        )

        embedding = result["embedding"]
        logger.debug(
            "Embedded text (%d chars) -> %d-dim vector",
            len(text),
            len(embedding),
        )
        return embedding

    def embed_batch(
        self,
        texts: list[str],
        task_type: TaskType = "retrieval_document",
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple texts in a single API call.

        Gemini supports batch embedding which is more efficient
        than calling embed_text() in a loop.

        Args:
            texts: List of texts to embed.
            task_type: Gemini embedding task type.

        Returns:
            List of embedding vectors.
        """
        if not texts:
            return []

        self._ensure_configured()
        import google.generativeai as genai

        result = genai.embed_content(
            model=self.model,
            content=texts,
            task_type=task_type,
        )

        embeddings = result["embedding"]
        logger.info(
            "Batch embedded %d texts -> %d vectors",
            len(texts),
            len(embeddings),
        )
        return embeddings

    def embed_query(self, query: str) -> list[float]:
        """
        Convenience method for embedding a search query.

        Uses retrieval_query task type which is optimized for
        short query texts (as opposed to longer document chunks).
        """
        return self.embed_text(query, task_type="retrieval_query")

    def embed_document(self, text: str) -> list[float]:
        """
        Convenience method for embedding a document chunk.

        Uses retrieval_document task type which is optimized for
        longer document passages.
        """
        return self.embed_text(text, task_type="retrieval_document")
