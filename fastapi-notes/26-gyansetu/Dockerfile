# ============================================================
# GyanSetu — Dockerfile
# ============================================================
# Python 3.11-slim based container for the RAG knowledge base.
# ChromaDB runs embedded in the same process for simplicity.
# For production, use docker-compose with a separate ChromaDB service.
# ============================================================

FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /app/chroma_data /app/uploads

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
