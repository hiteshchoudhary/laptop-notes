# ============================================================
# FILE 25: CHITRAVARNAN — AI IMAGE ANALYZER
# ============================================================
# Topics: Gemini Vision API, image upload, OCR, content moderation,
#         structured AI output, caching, batch processing
#
# WHY THIS MATTERS:
# AI-powered image analysis is transforming Indian e-commerce.
# From Nykaa's skin analysis to Meesho's product cataloging,
# understanding images programmatically is a core backend skill.
# ChitraVarnan teaches you to build production-grade AI vision APIs.
# ============================================================


## STORY: Nykaa's AI Beauty Advisor

Nykaa, India's leading beauty e-commerce platform, faces a unique challenge:
millions of customers upload selfies hoping for personalized product
recommendations. "Which foundation matches my skin tone?" "Is this lipstick
shade right for me?" Trained beauty advisors cannot scale to 20 million
monthly users — but AI vision can.

ChitraVarnan ("Chitra" = image, "Varnan" = description) is an AI image
analysis API inspired by this problem. Upload any image — a selfie, a
product photo, a handwritten note — and the API returns structured analysis:
descriptions, tags, extracted text, sentiment, and content moderation scores.

Think about the journey of a Meesho seller in Surat who photographs 50 sarees
daily for her online shop. She needs product titles, tags for search, and
descriptions — all generated automatically from photos. Or a Swiggy delivery
partner who photographs a damaged package; the system reads the AWB number
via OCR and files the complaint. These are real problems ChitraVarnan solves.

This chapter teaches you how to integrate Google's Gemini Vision API into a
FastAPI application, handle image uploads securely, extract structured data
from AI responses, and cache results for performance.


---


## SECTION 1 — Project Architecture

### WHY: AI vision APIs require careful separation of image handling, AI processing, and caching layers.

An image analysis pipeline has more moving parts than a standard CRUD API.
Raw images need validation and resizing before they hit the AI model. AI
responses need parsing into structured Pydantic models. And because Gemini
API calls cost money and take time, caching is not optional — it is essential.

### Project Structure

```
25-chitravarnan/
  main.py              # FastAPI app with lifespan, CORS, router inclusion
  config.py            # Settings: GEMINI_API_KEY, MAX_IMAGE_SIZE, etc.
  models.py            # Pydantic models: ImageAnalysis, TagResult, OCRResult
  services/
    __init__.py        # Package marker
    gemini_vision.py   # GeminiVisionService: analyze, describe, tag, ocr, moderate
    image_processor.py # Validate, resize, convert images using Pillow
    cache.py           # SQLite-based cache: hash image -> cached result
  routes/
    __init__.py        # Package marker
    analyze.py         # POST /analyze, POST /analyze/batch, GET /analyze/{id}
    health.py          # GET /health
  .env.example         # GEMINI_API_KEY=your-key-here
  requirements.txt     # Dependencies
  Dockerfile           # Python 3.11-slim based container
  docker-compose.yml   # Web service with env_file, volume for uploads
```

### Architecture Flow

```
Client uploads image
     |
     v
+----------------+     +-------------------+     +------------------+
|  Routes        | --> | Image Processor   | --> | Gemini Vision    |
| (analyze.py)   |     | (validate/resize) |     | (AI analysis)    |
+----------------+     +-------------------+     +------------------+
     |                                                  |
     v                                                  v
+----------------+                              +------------------+
|  Cache Layer   | <--------------------------- | Structured       |
| (SQLite hash)  |                              | Response (JSON)  |
+----------------+                              +------------------+
     |
     v
  JSON Response to Client
```

### Tech Stack

| Component        | Technology             |
|------------------|------------------------|
| Framework        | FastAPI                |
| AI Model         | Google Gemini 1.5 Flash|
| Image Processing | Pillow (PIL)           |
| Caching          | SQLite3                |
| Configuration    | pydantic-settings      |
| File Uploads     | python-multipart       |
| Server           | Uvicorn                |
| Container        | Docker                 |


---


## SECTION 2 — Gemini Vision API Capabilities

### WHY: Understanding what Gemini can "see" determines what your API can offer.

Google Gemini's vision models can process images and return natural language
descriptions. Unlike older ML models that output labels, Gemini understands
context, reads text in images, detects objects, assesses sentiment, and even
understands cultural nuances — crucial for Indian content with Hindi text,
regional clothing, and local products.

### What Gemini Vision Can Do

| Capability        | Description                                  | Example Use Case                    |
|-------------------|----------------------------------------------|-------------------------------------|
| **Describe**      | Natural language description of the image    | Product descriptions for Meesho     |
| **Tag**           | Extract relevant keywords and categories     | Search tags for Myntra listings     |
| **OCR**           | Read printed and handwritten text            | AWB numbers on courier packages     |
| **Moderate**      | Detect inappropriate content                 | UGC moderation for ShareChat        |
| **Analyze**       | Combined analysis with all of the above      | Complete product catalog entry       |

### How Gemini Processes Images

```python
import google.generativeai as genai
from PIL import Image

# Configure the API
genai.configure(api_key="your-api-key")

# Load the model
model = genai.GenerativeModel("gemini-1.5-flash")

# Open an image
image = Image.open("product_photo.jpg")

# Send image + prompt to Gemini
response = model.generate_content([
    "Describe this product image in detail for an e-commerce listing.",
    image
])

print(response.text)
# "A vibrant red Banarasi silk saree with intricate gold zari work..."
```

The key insight: Gemini accepts a **list** where you mix text prompts and
images. The prompt guides what kind of analysis you want. Different prompts
on the same image give completely different outputs.


---


## SECTION 3 — Image Upload Handling in FastAPI

### WHY: Secure file uploads prevent server crashes, storage abuse, and malicious payloads.

Accepting file uploads is one of the most security-sensitive operations in
web development. Without validation, a user could upload a 2GB file and crash
your server, or upload a PHP shell disguised as a JPEG. FastAPI's `UploadFile`
gives you a clean interface, but validation is your responsibility.

### FastAPI UploadFile Basics

```python
from fastapi import UploadFile, File, HTTPException

@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze")
):
    # Check content type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are accepted")

    # Check file size (read into memory)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(400, "Image must be under 10 MB")

    # Reset file position for further processing
    await file.seek(0)
    return {"filename": file.filename, "size": len(contents)}
```

### Image Validation Pipeline

Our `image_processor.py` performs three checks:

1. **MIME type validation** — Is the Content-Type header an image type?
2. **Magic bytes check** — Do the first bytes match JPEG/PNG/WebP signatures?
3. **Pillow open test** — Can Pillow actually parse it as an image?

```python
# Magic bytes for image formats
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",
}
```

Why all three checks? Because a file can claim to be a JPEG (Content-Type),
have JPEG magic bytes, but still be corrupt or contain embedded malware.
Pillow's open test catches structural issues that header checks miss.


---


## SECTION 4 — Structured AI Output with Pydantic

### WHY: Raw AI text is useless for APIs — you need structured, typed, validated data.

When Gemini says "This is a red saree with gold borders," that is fine for
a chatbot. But an API consumer needs structured JSON: `{"color": "red",
"type": "saree", "details": ["gold borders"]}`. We use carefully crafted
prompts to get JSON from Gemini, then validate it with Pydantic.

### Pydantic Models for Analysis Results

```python
from pydantic import BaseModel, Field
from enum import Enum

class AnalysisMode(str, Enum):
    DESCRIBE = "describe"
    TAG = "tag"
    OCR = "ocr"
    MODERATE = "moderate"
    FULL = "full"

class TagResult(BaseModel):
    tags: list[str] = Field(..., description="Relevant keywords")
    categories: list[str] = Field(..., description="Product categories")
    confidence: float = Field(..., ge=0.0, le=1.0)

class OCRResult(BaseModel):
    extracted_text: str = Field(..., description="All text found in image")
    language: str = Field(default="unknown", description="Detected language")
    confidence: float = Field(..., ge=0.0, le=1.0)

class ModerationResult(BaseModel):
    is_safe: bool
    categories: dict[str, float] = Field(
        default_factory=dict,
        description="Category scores: violence, adult, etc."
    )
    reason: str = Field(default="", description="Reason if flagged")

class ImageAnalysis(BaseModel):
    id: str = Field(..., description="Unique analysis ID")
    filename: str
    description: str = Field(default="")
    tags: TagResult | None = None
    ocr: OCRResult | None = None
    moderation: ModerationResult | None = None
    mode: AnalysisMode
    model_used: str = Field(default="gemini-1.5-flash")
    processing_time_ms: float
    cached: bool = Field(default=False)
```

### Prompting for Structured JSON Output

The trick is to instruct Gemini to respond ONLY in JSON:

```python
TAG_PROMPT = """Analyze this image and return ONLY a JSON object with:
{
  "tags": ["list", "of", "relevant", "keywords"],
  "categories": ["product", "categories"],
  "confidence": 0.95
}
Return ONLY valid JSON, no explanation, no markdown fences."""

OCR_PROMPT = """Extract ALL text visible in this image. Return ONLY JSON:
{
  "extracted_text": "all text found here",
  "language": "detected language code like en, hi, ta",
  "confidence": 0.90
}
Return ONLY valid JSON, no explanation, no markdown fences."""
```

Gemini does not always return perfect JSON. Our service layer wraps the
parsing in try/except and falls back to regex extraction if needed.


---


## SECTION 5 — GeminiVisionService Implementation

### WHY: A service class encapsulates all AI interactions, making routes clean and testing possible.

The GeminiVisionService handles model initialization, prompt construction,
API calls, response parsing, and error handling — all behind a clean interface.
Routes simply call `service.analyze(image, mode)` without knowing the details.

### Service Architecture

```python
class GeminiVisionService:
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    async def analyze(self, image: Image.Image, mode: AnalysisMode) -> dict:
        """Route to the appropriate analysis method based on mode."""
        handlers = {
            AnalysisMode.DESCRIBE: self._describe,
            AnalysisMode.TAG: self._tag,
            AnalysisMode.OCR: self._ocr,
            AnalysisMode.MODERATE: self._moderate,
            AnalysisMode.FULL: self._full_analysis,
        }
        handler = handlers[mode]
        return await handler(image)

    async def _describe(self, image: Image.Image) -> dict:
        response = self.model.generate_content([DESCRIBE_PROMPT, image])
        return {"description": response.text.strip()}

    async def _tag(self, image: Image.Image) -> dict:
        response = self.model.generate_content([TAG_PROMPT, image])
        return self._parse_json(response.text)

    async def _ocr(self, image: Image.Image) -> dict:
        response = self.model.generate_content([OCR_PROMPT, image])
        return self._parse_json(response.text)
```

### Error Handling for AI Calls

Gemini can fail in several ways. Each needs specific handling:

| Error                | Cause                         | Recovery                      |
|----------------------|-------------------------------|-------------------------------|
| `ResourceExhausted`  | Rate limit exceeded           | Retry with exponential backoff|
| `InvalidArgument`    | Image too large or corrupt    | Return 400 to client          |
| `InternalError`      | Gemini service issue          | Retry once, then 503          |
| `JSONDecodeError`    | Gemini returned non-JSON text | Regex extraction fallback     |
| `Timeout`            | API call took too long        | Return 504 to client          |


---


## SECTION 6 — Batch Image Processing

### WHY: E-commerce sellers upload 50+ images at once — batch processing saves hours.

A Meesho seller photographing her Diwali collection cannot upload and wait
for each image one by one. Batch processing lets her upload 10 images in a
single API call and get all results back together.

### Batch Endpoint Design

```python
from fastapi import UploadFile, File

@router.post("/analyze/batch", response_model=list[ImageAnalysis])
async def analyze_batch(
    files: list[UploadFile] = File(..., description="Up to 10 images"),
    mode: AnalysisMode = Query(default=AnalysisMode.TAG),
):
    if len(files) > 10:
        raise HTTPException(400, "Maximum 10 images per batch")

    results = []
    for file in files:
        # Validate each image
        image_data = await validate_and_process(file)
        # Check cache first
        cached = cache_service.get(image_data.hash)
        if cached:
            results.append(cached)
            continue
        # Analyze with Gemini
        result = await vision_service.analyze(image_data.image, mode)
        cache_service.store(image_data.hash, result)
        results.append(result)

    return results
```

### Why Sequential, Not Parallel?

You might wonder why we process images in a loop instead of using
`asyncio.gather()`. The reason is **rate limiting**. Gemini's free tier
allows 15 requests per minute. Firing 10 requests simultaneously would
burn through the quota instantly. Sequential processing with cache checks
is more reliable for most use cases.

For production with a paid Gemini plan, you could use a semaphore:

```python
import asyncio

semaphore = asyncio.Semaphore(3)  # Max 3 concurrent Gemini calls

async def analyze_with_limit(image, mode):
    async with semaphore:
        return await vision_service.analyze(image, mode)
```


---


## SECTION 7 — SQLite Caching Layer

### WHY: Gemini API calls cost money and take 2-5 seconds each. Caching identical images saves both.

If the same product photo is uploaded twice — maybe by the same seller
testing the API, or by a buyer who screenshots the listing — we should not
pay for Gemini analysis again. We hash the image content and store results
in SQLite.

### Image Hashing Strategy

```python
import hashlib

def hash_image(image_bytes: bytes) -> str:
    """SHA-256 hash of raw image bytes. Same image = same hash."""
    return hashlib.sha256(image_bytes).hexdigest()
```

### Cache Service

```python
import sqlite3
import json
from datetime import datetime, timedelta

class CacheService:
    def __init__(self, db_path: str = "cache.db", ttl_hours: int = 24):
        self.db_path = db_path
        self.ttl = timedelta(hours=ttl_hours)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analysis_cache (
                    image_hash TEXT PRIMARY KEY,
                    result_json TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)

    def get(self, image_hash: str, mode: str) -> dict | None:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT result_json, created_at FROM analysis_cache "
                "WHERE image_hash = ? AND mode = ?",
                (image_hash, mode)
            ).fetchone()

        if row is None:
            return None

        created = datetime.fromisoformat(row[1])
        if datetime.utcnow() - created > self.ttl:
            return None  # Expired

        return json.loads(row[0])
```

### Cache Hit Flow

```
Image uploaded
     |
     v
Hash image bytes (SHA-256)
     |
     v
Check cache: SELECT WHERE hash = ? AND mode = ?
     |
     +-- HIT (and not expired) --> Return cached result (< 1ms)
     |
     +-- MISS --> Call Gemini --> Store result --> Return (2-5 sec)
```

### Cache Statistics

Track hit rates to understand cache effectiveness:

```python
def get_stats(self) -> dict:
    with sqlite3.connect(self.db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM analysis_cache").fetchone()[0]
        expired = conn.execute(
            "SELECT COUNT(*) FROM analysis_cache WHERE created_at < ?",
            ((datetime.utcnow() - self.ttl).isoformat(),)
        ).fetchone()[0]
    return {"total_cached": total, "expired": expired, "active": total - expired}
```


---


## SECTION 8 — Rate Limiting and Error Handling

### WHY: AI APIs have strict rate limits — exceeding them crashes your entire service.

Gemini's free tier: 15 RPM (requests per minute), 1M TPM (tokens per minute),
1500 RPD (requests per day). A single batch of 10 images could use 2/3 of
your per-minute quota. Without rate limiting, a few concurrent users would
trigger 429 errors.

### Simple In-Memory Rate Limiter

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: deque = deque()

    def allow(self) -> bool:
        now = time.time()
        # Remove requests outside the window
        while self.requests and self.requests[0] < now - self.window:
            self.requests.popleft()
        if len(self.requests) >= self.max_requests:
            return False
        self.requests.append(now)
        return True

    def wait_time(self) -> float:
        if not self.requests:
            return 0.0
        return max(0.0, self.requests[0] + self.window - time.time())
```

### Error Handling Middleware Pattern

```python
from fastapi import HTTPException

async def safe_gemini_call(func, *args, **kwargs):
    """Wrap any Gemini call with comprehensive error handling."""
    try:
        return await func(*args, **kwargs)
    except google.api_core.exceptions.ResourceExhausted:
        raise HTTPException(429, "AI rate limit reached. Try again in 60 seconds.")
    except google.api_core.exceptions.InvalidArgument as e:
        raise HTTPException(400, f"Invalid image: {str(e)}")
    except google.api_core.exceptions.InternalServerError:
        raise HTTPException(503, "AI service temporarily unavailable")
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")
```


---


## SECTION 9 — Docker Setup

### WHY: Docker ensures ChitraVarnan runs identically on every machine.

Image processing with Pillow requires system libraries (libjpeg, libpng).
Docker bundles these dependencies so you never hear "it works on my machine."

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps for Pillow
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create upload directory
RUN mkdir -p /app/uploads

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
      - ./uploads:/app/uploads
    restart: unless-stopped
```

### Running It

```bash
# Development
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY

# With Docker
docker-compose up --build

# Without Docker
pip install -r requirements.txt
uvicorn main:app --reload
```


---


## SECTION 10 — API Reference

### WHY: A complete API reference makes your project usable by other developers.

| Method | Endpoint              | Description                           | Auth |
|--------|-----------------------|---------------------------------------|------|
| POST   | `/analyze`            | Analyze a single image                | No   |
| POST   | `/analyze/batch`      | Analyze up to 10 images               | No   |
| GET    | `/analyze/{id}`       | Retrieve a previous analysis by ID    | No   |
| GET    | `/health`             | Health check with cache stats         | No   |

### POST /analyze — Request

```
Content-Type: multipart/form-data

Fields:
  file: <binary image data>   (required, JPEG/PNG/WebP, max 10MB)
  mode: "describe" | "tag" | "ocr" | "moderate" | "full"   (default: "full")
```

### POST /analyze — Response (mode=full)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "filename": "saree_photo.jpg",
  "description": "A vibrant red Banarasi silk saree with intricate gold zari work...",
  "tags": {
    "tags": ["saree", "silk", "banarasi", "red", "gold", "zari", "traditional"],
    "categories": ["clothing", "ethnic wear", "sarees"],
    "confidence": 0.92
  },
  "ocr": {
    "extracted_text": "Handloom Mark",
    "language": "en",
    "confidence": 0.88
  },
  "moderation": {
    "is_safe": true,
    "categories": {"violence": 0.01, "adult": 0.02},
    "reason": ""
  },
  "mode": "full",
  "model_used": "gemini-1.5-flash",
  "processing_time_ms": 3200.5,
  "cached": false
}
```

### POST /analyze/batch

Same as `/analyze` but accepts `files` (multiple) and returns a list.
Maximum 10 images per request.

### Error Responses

| Status | Meaning                         |
|--------|---------------------------------|
| 400    | Invalid image format or too large|
| 429    | Rate limit exceeded              |
| 503    | Gemini API unavailable           |
| 500    | Internal processing error        |


---


## KEY TAKEAWAYS

1. **Gemini Vision accepts image + text prompt together** — you control the
   analysis type entirely through prompt engineering. Same image, different
   prompts, different outputs.

2. **Always validate uploads three ways** — MIME type, magic bytes, and actual
   parsing with Pillow. Never trust the Content-Type header alone.

3. **Prompt for JSON output explicitly** — tell the model "return ONLY valid
   JSON" and provide the exact structure you expect. Parse with try/except.

4. **Cache by image hash** — SHA-256 the raw bytes. Same image uploaded twice
   gets the same hash, saving API calls and money.

5. **Rate limiting is mandatory with AI APIs** — Gemini's free tier is
   generous but finite. A sliding window rate limiter prevents quota exhaustion.

6. **Batch processing needs sequential execution** — unlike database queries,
   AI API calls have strict per-minute limits. Process sequentially or use
   semaphores for controlled concurrency.

7. **Docker solves Pillow's system dependency problem** — libjpeg and libpng
   are system libraries that vary across OS versions. Docker makes it
   reproducible.

### What's Next?

ChitraVarnan gives you the foundation for any AI vision API. Extend it with:
- Webhook callbacks for long-running batch jobs
- Image comparison (upload two images, get similarity score)
- Video frame analysis (extract key frames, analyze each)
- Multi-language OCR with language-specific prompts
- Integration with cloud storage (S3/GCS) instead of local uploads

In Chapter 26, we move from analyzing images to analyzing documents with
GyanSetu — a RAG-powered knowledge base that lets you ask questions about
uploaded PDFs using Gemini embeddings and ChromaDB.
