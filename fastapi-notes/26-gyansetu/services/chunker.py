# ============================================================
# GyanSetu — Text Chunking Service
# ============================================================
# Three chunking strategies: fixed-size, sentence-based,
# and paragraph-based. Each suited for different document types.
# ============================================================

import logging
import re
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseChunker(ABC):
    """Abstract base class for text chunkers."""

    @abstractmethod
    def chunk(self, text: str) -> list[str]:
        """Split text into chunks. Returns list of non-empty strings."""
        ...


class FixedSizeChunker(BaseChunker):
    """
    Split text into fixed-size chunks with optional overlap.

    Simple and predictable. Best as a safe default when you do not
    know the document structure. The overlap prevents information
    loss at chunk boundaries.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, text: str) -> list[str]:
        chunks: list[str] = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size
            chunk = text[start:end]

            if chunk.strip():
                chunks.append(chunk.strip())

            # Move forward by (chunk_size - overlap)
            step = self.chunk_size - self.chunk_overlap
            if step <= 0:
                step = self.chunk_size  # Prevent infinite loop
            start += step

        logger.info(
            "FixedSizeChunker: %d chars -> %d chunks (size=%d, overlap=%d)",
            len(text),
            len(chunks),
            self.chunk_size,
            self.chunk_overlap,
        )
        return chunks


class SentenceChunker(BaseChunker):
    """
    Split text on sentence boundaries, grouping sentences until
    the chunk reaches max_chunk_size.

    Preserves sentence integrity — no mid-sentence cuts. Best for
    dense factual content like government scheme descriptions.
    """

    def __init__(self, max_chunk_size: int = 500):
        self.max_chunk_size = max_chunk_size

    def chunk(self, text: str) -> list[str]:
        # Split on sentence-ending punctuation followed by whitespace
        sentences = re.split(r"(?<=[.!?])\s+", text)

        chunks: list[str] = []
        current_chunk = ""

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # Check if adding this sentence would exceed the limit
            test_chunk = (
                f"{current_chunk} {sentence}" if current_chunk else sentence
            )

            if len(test_chunk) > self.max_chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk = test_chunk

        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        logger.info(
            "SentenceChunker: %d chars -> %d chunks (max_size=%d)",
            len(text),
            len(chunks),
            self.max_chunk_size,
        )
        return chunks


class ParagraphChunker(BaseChunker):
    """
    Split text on paragraph boundaries (double newlines), grouping
    paragraphs until the chunk reaches max_chunk_size.

    Preserves document structure. Best for textbooks and structured
    documents where paragraphs map to topics.
    """

    def __init__(self, max_chunk_size: int = 1000):
        self.max_chunk_size = max_chunk_size

    def chunk(self, text: str) -> list[str]:
        # Split on one or more blank lines
        paragraphs = re.split(r"\n\s*\n", text)

        chunks: list[str] = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if adding this paragraph would exceed the limit
            test_chunk = (
                f"{current_chunk}\n\n{para}" if current_chunk else para
            )

            if len(test_chunk) > self.max_chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = para
            else:
                current_chunk = test_chunk

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        logger.info(
            "ParagraphChunker: %d chars -> %d chunks (max_size=%d)",
            len(text),
            len(chunks),
            self.max_chunk_size,
        )
        return chunks


def get_chunker(strategy: str, chunk_size: int = 500, chunk_overlap: int = 50) -> BaseChunker:
    """
    Factory function to get a chunker by strategy name.

    Args:
        strategy: One of "fixed", "sentence", "paragraph".
        chunk_size: Target chunk size in characters.
        chunk_overlap: Overlap for fixed-size chunker.

    Returns:
        A BaseChunker instance.
    """
    chunkers = {
        "fixed": lambda: FixedSizeChunker(chunk_size, chunk_overlap),
        "sentence": lambda: SentenceChunker(chunk_size),
        "paragraph": lambda: ParagraphChunker(chunk_size),
    }

    if strategy not in chunkers:
        logger.warning("Unknown strategy '%s', falling back to 'sentence'", strategy)
        strategy = "sentence"

    return chunkers[strategy]()
