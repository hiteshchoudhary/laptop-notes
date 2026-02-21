# ============================================================
# GyanSetu — RAG Engine
# ============================================================
# The core retrieval-augmented generation engine.
# Retrieves relevant chunks, builds prompts, generates answers
# with citations. Supports single queries and multi-turn chat.
# ============================================================

import logging
import time

from models import ChatMessage, QueryResponse, Source

logger = logging.getLogger(__name__)

# ============================================================
# Prompt Templates
# ============================================================

RAG_QUERY_PROMPT = """You are GyanSetu, an educational knowledge assistant for Indian teachers.
Answer the question based ONLY on the provided context. If the context does not
contain enough information to answer the question, say "I could not find enough
information in the uploaded documents to answer this question."

CONTEXT:
{context}

QUESTION: {question}

INSTRUCTIONS:
1. Answer based ONLY on the provided context. Do not use external knowledge.
2. Be specific and mention which source the information comes from.
3. If multiple sources contain relevant information, synthesize them.
4. Use simple, clear language appropriate for teachers.
5. If the question is in Hindi, answer in Hindi.

ANSWER:"""


RAG_CHAT_PROMPT = """You are GyanSetu, an educational knowledge assistant for Indian teachers.
You are in a conversation with a teacher. Use the conversation history and
retrieved context to answer the latest question.

CONVERSATION HISTORY:
{history}

RETRIEVED CONTEXT:
{context}

LATEST QUESTION: {question}

INSTRUCTIONS:
1. Answer based ONLY on the retrieved context.
2. Maintain conversation continuity — understand references like "these",
   "it", "that chapter" from the conversation history.
3. If you cannot answer from the context, say so clearly.
4. Cite which documents the information comes from.

ANSWER:"""


class RAGEngine:
    """
    Retrieval-Augmented Generation engine.

    Combines vector search (retrieval) with Gemini LLM (generation)
    to answer questions grounded in uploaded documents.
    """

    def __init__(self, embedder, vector_store, gemini_model_name: str = "gemini-1.5-flash"):
        """
        Initialize the RAG engine.

        Args:
            embedder: GeminiEmbedder instance for creating query embeddings.
            vector_store: VectorStore instance for searching chunks.
            gemini_model_name: Gemini model to use for answer generation.
        """
        self.embedder = embedder
        self.vector_store = vector_store
        self.model_name = gemini_model_name
        self._model = None

    def _get_model(self):
        """Lazy-load the Gemini generative model."""
        if self._model is None:
            import google.generativeai as genai

            self._model = genai.GenerativeModel(self.model_name)
        return self._model

    def query(
        self,
        question: str,
        n_results: int = 5,
        document_id: str | None = None,
    ) -> QueryResponse:
        """
        Answer a single question using RAG.

        Steps:
        1. Embed the question (retrieval_query task type).
        2. Search ChromaDB for relevant chunks.
        3. Build a prompt with retrieved context.
        4. Generate an answer with Gemini.
        5. Extract source citations from metadata.

        Args:
            question: Natural language question.
            n_results: Number of chunks to retrieve.
            document_id: Optional filter for a specific document.

        Returns:
            QueryResponse with answer, sources, and timing.
        """
        start = time.time()

        # Step 1: Embed the question
        query_embedding = self.embedder.embed_query(question)

        # Step 2: Search for relevant chunks
        search_results = self.vector_store.search(
            query_embedding=query_embedding,
            n_results=n_results,
            document_id=document_id,
        )

        # Check if we have any results
        if not search_results["documents"] or not search_results["documents"][0]:
            return QueryResponse(
                answer="No documents have been uploaded yet. Please upload documents first.",
                sources=[],
                processing_time_ms=round((time.time() - start) * 1000, 2),
            )

        # Step 3: Build context from retrieved chunks
        context = self._build_context(search_results)

        # Step 4: Generate answer
        prompt = RAG_QUERY_PROMPT.format(context=context, question=question)
        model = self._get_model()
        response = model.generate_content(prompt)
        answer = response.text.strip()

        # Step 5: Extract sources
        sources = self._extract_sources(search_results)

        elapsed_ms = round((time.time() - start) * 1000, 2)

        logger.info(
            "RAG query answered in %.0fms (retrieved %d chunks)",
            elapsed_ms,
            len(sources),
        )

        return QueryResponse(
            answer=answer,
            sources=sources,
            processing_time_ms=elapsed_ms,
        )

    def chat(
        self,
        message: str,
        history: list[ChatMessage],
        n_results: int = 5,
        document_id: str | None = None,
    ) -> QueryResponse:
        """
        Handle a chat turn with conversation memory.

        Uses the latest message for embedding/retrieval, but includes
        conversation history in the prompt for context continuity.

        Args:
            message: Latest user message.
            history: Previous conversation messages.
            n_results: Number of chunks to retrieve.
            document_id: Optional filter for a specific document.

        Returns:
            QueryResponse with answer and sources.
        """
        start = time.time()

        # Build conversation history string (last 3 exchanges = 6 messages)
        recent_history = history[-6:]
        history_str = ""
        for msg in recent_history:
            role_label = msg.role.upper()
            history_str += f"{role_label}: {msg.content}\n"

        # Embed the latest message for retrieval
        query_embedding = self.embedder.embed_query(message)

        # Search
        search_results = self.vector_store.search(
            query_embedding=query_embedding,
            n_results=n_results,
            document_id=document_id,
        )

        if not search_results["documents"] or not search_results["documents"][0]:
            return QueryResponse(
                answer="No documents have been uploaded yet. Please upload documents first.",
                sources=[],
                processing_time_ms=round((time.time() - start) * 1000, 2),
            )

        # Build prompt with history and context
        context = self._build_context(search_results)
        prompt = RAG_CHAT_PROMPT.format(
            history=history_str,
            context=context,
            question=message,
        )

        # Generate
        model = self._get_model()
        response = model.generate_content(prompt)
        answer = response.text.strip()

        sources = self._extract_sources(search_results)
        elapsed_ms = round((time.time() - start) * 1000, 2)

        logger.info(
            "RAG chat answered in %.0fms (history=%d msgs)",
            elapsed_ms,
            len(history),
        )

        return QueryResponse(
            answer=answer,
            sources=sources,
            processing_time_ms=elapsed_ms,
        )

    # --------------------------------------------------------
    # Private helpers
    # --------------------------------------------------------

    @staticmethod
    def _build_context(search_results: dict) -> str:
        """Format retrieved chunks into a context string for the prompt."""
        context_parts: list[str] = []

        documents = search_results["documents"][0]
        metadatas = search_results["metadatas"][0]

        for i, (doc, metadata) in enumerate(zip(documents, metadatas)):
            source_name = metadata.get("filename", "Unknown")
            chunk_idx = metadata.get("chunk_index", "?")
            context_parts.append(
                f"[Source: {source_name}, Section {chunk_idx}]\n{doc}"
            )

        return "\n\n---\n\n".join(context_parts)

    @staticmethod
    def _extract_sources(search_results: dict) -> list[Source]:
        """Extract source citations from ChromaDB search results."""
        sources: list[Source] = []

        metadatas = search_results["metadatas"][0]
        distances = search_results["distances"][0]
        documents = search_results["documents"][0]

        for i, (meta, distance, doc_text) in enumerate(
            zip(metadatas, distances, documents)
        ):
            # Convert cosine distance to similarity score
            similarity = round(max(0.0, 1.0 - distance), 4)

            sources.append(
                Source(
                    document_name=meta.get("filename", "Unknown"),
                    chunk_index=meta.get("chunk_index", 0),
                    relevance_score=similarity,
                    text_preview=doc_text[:200] if doc_text else "",
                )
            )

        return sources
