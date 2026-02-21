# ============================================================
# ChitraVarnan — Dockerfile
# ============================================================
# Python 3.11-slim with Pillow system dependencies.
# Pillow needs libjpeg and libpng for image processing.
# ============================================================

FROM python:3.11-slim

WORKDIR /app

# System dependencies for Pillow (JPEG, PNG support)
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directory
RUN mkdir -p /app/uploads

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
