"""
============================================================
FILE 22: AI FOUNDATIONS WITH GOOGLE GEMINI AND FASTAPI
============================================================
Topics: AI + FastAPI, Google Gemini API, text generation,
        multi-turn chat, streaming responses, structured JSON
        output, system instructions, safety settings, token
        counting, prompt engineering, caching, error handling

WHY THIS MATTERS:
AI is no longer a research curiosity — it is the core feature
of modern SaaS products. FastAPI's async nature makes it the
perfect framework for AI inference endpoints that call
external LLM APIs like Google Gemini.
============================================================
"""

# STORY: Freshworks — India's SaaS Unicorn Saves ₹50Cr/Year
# Freshworks (Chennai, NASDAQ-listed) integrated Google Gemini
# into Freshdesk to auto-resolve 40% of customer support tickets.
# Their AI reads the ticket, understands intent, searches the
# knowledge base, and drafts a response — all via FastAPI
# microservices. This saved ₹50Cr/year in support costs and
# reduced average resolution time from 4 hours to 8 minutes.

import os
import json
import time
import hashlib
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


# ════════════════════════════════════════════════════════════
# SECTION 1 — Why AI + FastAPI?
# ════════════════════════════════════════════════════════════

# WHY: FastAPI is async-first. When your endpoint calls Gemini,
# the request waits 1-5 seconds for the AI response. With Flask
# (sync), that blocks the entire worker. With FastAPI (async),
# other requests are served while waiting — 10x more concurrent
# users on the same hardware.

# Key advantages: async/await for non-blocking AI calls, Pydantic
# for validating inputs AND parsing AI outputs, StreamingResponse
# for streaming tokens, auto-generated Swagger UI for testing,
# and dependency injection for managing API keys and rate limits.


# ════════════════════════════════════════════════════════════
# SECTION 2 — Google Gemini API Setup
# ════════════════════════════════════════════════════════════

# WHY: Google Gemini is free for developers (up to 60 RPM).
# Unlike OpenAI, you do not need a credit card.

# SETUP: 1) Visit https://aistudio.google.com/app/apikey
# 2) Create API Key (free) 3) export GEMINI_API_KEY="your-key"
# 4) pip install google-generativeai

# PRODUCTION CODE:
# import google.generativeai as genai
# genai.configure(api_key=os.environ["GEMINI_API_KEY"])
# model = genai.GenerativeModel("gemini-1.5-flash")
#
# For this teaching file, we simulate the SDK so it compiles
# and runs without an API key. Replace with real SDK in production.

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


class SimpleNamespace:
    """Minimal namespace for simulating SDK objects."""
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


class GeminiSimulator:
    """Simulates google.generativeai SDK. Replace with real SDK in production."""

    def __init__(self, model_name="gemini-1.5-flash", system_instruction=None,
                 generation_config=None):
        self.model_name = model_name
        self.system_instruction = system_instruction or ""
        self.generation_config = generation_config or {}

    def generate_content(self, prompt: str, stream: bool = False):
        """Simulate model.generate_content(prompt)"""
        text = f"[Simulated Gemini] Model: {self.model_name}, Prompt: '{prompt[:80]}...'"
        if stream:
            return [SimpleNamespace(text=w + " ") for w in text.split()]
        return SimpleNamespace(
            text=text,
            usage_metadata=SimpleNamespace(
                prompt_token_count=len(prompt.split()),
                candidates_token_count=len(text.split()),
                total_token_count=len(prompt.split()) + len(text.split()),
            ),
        )

    def count_tokens(self, text: str):
        """Simulate model.count_tokens(text). 1 token ~ 4 chars."""
        return SimpleNamespace(total_tokens=len(text) // 4)

    def start_chat(self, history=None):
        """Simulate model.start_chat(history=[])"""
        return ChatSimulator(self, history or [])


class ChatSimulator:
    """Simulates genai chat sessions with multi-turn memory."""
    def __init__(self, model, history):
        self.model = model
        self.history = history

    def send_message(self, message: str):
        self.history.append({"role": "user", "parts": [message]})
        reply = f"[Chat turn {len(self.history)}] Reply to: '{message[:60]}'"
        self.history.append({"role": "model", "parts": [reply]})
        return SimpleNamespace(text=reply)


model = GeminiSimulator(model_name="gemini-1.5-flash")


# ════════════════════════════════════════════════════════════
# SECTION 3 — Pydantic Models for Request/Response
# ════════════════════════════════════════════════════════════

# WHY: AI endpoints need well-defined contracts. Pydantic
# validates both sides — crucial when AI output is parsed
# downstream by other services.

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="0=deterministic, 2=creative")
    max_output_tokens: int = Field(1024, ge=1, le=8192)
    top_p: float = Field(0.95, ge=0.0, le=1.0, description="Nucleus sampling threshold")
    top_k: int = Field(40, ge=1, le=100, description="Top-k token sampling")

class GenerateResponse(BaseModel):
    text: str
    model: str
    prompt_tokens: int
    response_tokens: int
    total_tokens: int
    cached: bool = False

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|model)$")
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    session_id: str = Field(..., min_length=1, max_length=100)
    system_instruction: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    turn_count: int
    history: List[ChatMessage]

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=20000)
    analysis_type: str = Field("general", description="general, sentiment, entities, summary")

class AnalysisResult(BaseModel):
    sentiment: Optional[str] = None
    confidence: Optional[float] = None
    entities: Optional[List[Dict[str, str]]] = None
    summary: Optional[str] = None
    categories: Optional[List[str]] = None
    language: Optional[str] = None

class ProductDescRequest(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=200)
    category: str = Field(..., description="e.g., electronics, clothing, home")
    features: List[str] = Field(..., min_length=1)
    price_inr: float = Field(..., gt=0)
    target_audience: str = Field("general")

class ProductDescResponse(BaseModel):
    title: str
    description: str
    highlights: List[str]
    seo_keywords: List[str]
    generated_at: str


# ════════════════════════════════════════════════════════════
# SECTION 4 — FastAPI App, Caching, and Safety
# ════════════════════════════════════════════════════════════

# WHY: The app needs in-memory stores for chat sessions and
# response caching. Caching avoids re-calling Gemini for
# identical prompts — saves quota and reduces latency.

app = FastAPI(
    title="Freshworks AI API — Gemini-Powered Support",
    description="AI-powered API using Google Gemini for text generation, chat, and analysis.",
    version="1.0.0",
)

chat_sessions: Dict[str, Dict[str, Any]] = {}   # session_id -> {chat, created_at}
response_cache: Dict[str, Dict[str, Any]] = {}  # prompt_hash -> {response, timestamp}
CACHE_TTL_SECONDS = 300  # 5 minutes

def get_cache_key(prompt: str, temperature: float) -> str:
    return hashlib.sha256(f"{prompt}:{temperature}".encode()).hexdigest()

def get_cached_response(cache_key: str) -> Optional[Dict]:
    if cache_key in response_cache:
        cached = response_cache[cache_key]
        if time.time() - cached["timestamp"] < CACHE_TTL_SECONDS:
            return cached["response"]
        del response_cache[cache_key]
    return None

def set_cached_response(cache_key: str, response: Dict) -> None:
    response_cache[cache_key] = {"response": response, "timestamp": time.time()}

# --- Safety Settings ---
# WHY: AI can generate harmful content. Configure filters per use case.
# PRODUCTION: from google.generativeai.types import HarmCategory, HarmBlockThreshold
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_LOW_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


# ════════════════════════════════════════════════════════════
# SECTION 5 — Prompt Engineering Helpers
# ════════════════════════════════════════════════════════════

# WHY: Raw prompts give mediocre results. Engineered prompts
# give 10x better output. Freshworks improved resolution
# accuracy from 25% to 40% with proper prompt engineering.

def build_few_shot_prompt(task: str, examples: List[Dict[str, str]], query: str) -> str:
    """Few-shot: provide examples so the model learns the expected format."""
    prompt = f"Task: {task}\n\nExamples:\n"
    for i, ex in enumerate(examples, 1):
        prompt += f"\nExample {i}:\nInput: {ex['input']}\nOutput: {ex['output']}\n"
    prompt += f"\nNow process this:\nInput: {query}\nOutput:"
    return prompt

def build_chain_of_thought_prompt(question: str) -> str:
    """Chain-of-thought: step-by-step reasoning improves accuracy 20-30%."""
    return (
        f"Question: {question}\n\nThink step by step:\n"
        "Step 1: Identify key information\nStep 2: Break down the problem\n"
        "Step 3: Reason through each part\nStep 4: Final answer\n\n"
        "Show your reasoning, then give the final answer."
    )

def build_role_based_prompt(role: str, context: str, task: str) -> str:
    """Role-based: assign a persona for domain-specific expertise."""
    return f"You are {role}.\n\nContext: {context}\n\nTask: {task}\n\nProvide a detailed response."


# ════════════════════════════════════════════════════════════
# SECTION 6 — Error Handling with Retry
# ════════════════════════════════════════════════════════════

# WHY: AI APIs fail often — rate limits, timeouts, safety blocks.
# Implement retry with exponential backoff: 1s, 2s, 4s.

MAX_RETRIES = 3

async def call_gemini_with_retry(prompt: str, model_instance=None, stream=False):
    """Call Gemini with automatic retry on transient failures."""
    _model = model_instance or model
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            return _model.generate_content(prompt, stream=stream)
        except Exception as e:
            last_error = e
            msg = str(e).lower()
            if "quota" in msg or "403" in msg:
                raise HTTPException(status_code=429, detail="Gemini quota exhausted.")
            if "safety" in msg or "blocked" in msg:
                raise HTTPException(status_code=400, detail="Content blocked by safety filters.")
            if any(k in msg for k in ["429", "rate", "timeout", "connection"]):
                await asyncio.sleep(1.0 * (2 ** attempt))  # Exponential backoff
                continue
            raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")
    raise HTTPException(status_code=503, detail=f"Gemini unavailable after {MAX_RETRIES} retries")


# ════════════════════════════════════════════════════════════
# SECTION 7 — POST /generate (Basic Text Generation)
# ════════════════════════════════════════════════════════════

# WHY: The simplest AI endpoint — send a prompt, get text back.
# Every AI product starts here.

@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """
    Generate text using Google Gemini with caching and retry.
    PRODUCTION: Use genai.GenerativeModel with GenerationConfig.
    """
    cache_key = get_cache_key(request.prompt, request.temperature)
    cached = get_cached_response(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    configured = GeminiSimulator(
        model_name="gemini-1.5-flash",
        generation_config={"temperature": request.temperature, "top_p": request.top_p,
                           "top_k": request.top_k, "max_output_tokens": request.max_output_tokens},
    )
    response = await call_gemini_with_retry(request.prompt, configured)
    result = {
        "text": response.text, "model": "gemini-1.5-flash",
        "prompt_tokens": response.usage_metadata.prompt_token_count,
        "response_tokens": response.usage_metadata.candidates_token_count,
        "total_tokens": response.usage_metadata.total_token_count, "cached": False,
    }
    set_cached_response(cache_key, result)
    return result


# ════════════════════════════════════════════════════════════
# SECTION 8 — POST /chat (Multi-Turn Conversation)
# ════════════════════════════════════════════════════════════

# WHY: Real AI products are conversational. A support chatbot
# needs to remember that the user shared their order number
# 3 messages ago. Gemini's chat API maintains context.

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Multi-turn chat with session management. Uses Redis in production."""
    sid = request.session_id
    if sid not in chat_sessions:
        configured = GeminiSimulator(
            system_instruction=request.system_instruction or
                "You are a helpful support agent for an Indian company.",
        )
        chat_sessions[sid] = {
            "chat": configured.start_chat(history=[]),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    chat_obj = chat_sessions[sid]["chat"]
    try:
        response = chat_obj.send_message(request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")

    history = [ChatMessage(role=e["role"], content=e["parts"][0] if e["parts"] else "")
               for e in chat_obj.history]
    return ChatResponse(reply=response.text, session_id=sid,
                        turn_count=len(history) // 2, history=history)


# ════════════════════════════════════════════════════════════
# SECTION 9 — GET /stream (SSE Streaming Response)
# ════════════════════════════════════════════════════════════

# WHY: Waiting 5 seconds for a complete response feels slow.
# Streaming tokens as they generate (like ChatGPT) feels instant.
# SSE format: data: {"token": "Hello"}\n\n

async def gemini_stream_generator(prompt: str):
    """Async generator yielding SSE-formatted chunks from Gemini."""
    try:
        chunks = model.generate_content(prompt, stream=True)
        for chunk in chunks:
            data = json.dumps({"token": chunk.text, "done": False})
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.05)  # Simulate streaming delay
        yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

@app.get("/stream")
async def stream_response(prompt: str = Query(..., min_length=1, max_length=5000)):
    """
    Stream AI response via Server-Sent Events.
    JS: const es = new EventSource("/stream?prompt=Hello");
        es.onmessage = (e) => { const d = JSON.parse(e.data); ... };
    """
    return StreamingResponse(
        gemini_stream_generator(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive",
                 "X-Accel-Buffering": "no"},
    )


# ════════════════════════════════════════════════════════════
# SECTION 10 — POST /analyze (Structured JSON Output)
# ════════════════════════════════════════════════════════════

# WHY: Raw AI text is hard to use programmatically. Instruct
# Gemini to return JSON, then parse with Pydantic. Freshworks
# extracts sentiment, urgency, and category from every ticket.

ANALYSIS_PROMPTS = {
    "general": (
        "Analyze the text and return JSON with: sentiment (positive/negative/neutral/mixed), "
        "confidence (0.0-1.0), summary (1-2 sentences), categories (list), language. "
        "Return ONLY valid JSON.\n\nText: {text}"
    ),
    "sentiment": (
        "Analyze sentiment. Return ONLY JSON: "
        '{{"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, '
        '"summary": "reason"}}\n\nText: {text}'
    ),
    "entities": (
        "Extract named entities. Return ONLY JSON: "
        '{{"entities": [{{"name": "...", "type": "PERSON|ORG|LOCATION|DATE"}}]}}\n\nText: {text}'
    ),
    "summary": 'Summarize in 2-3 sentences. Return ONLY: {{"summary": "..."}}\n\nText: {text}',
}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_text(request: AnalyzeRequest):
    """Extract structured information from text. Parses Gemini JSON output with Pydantic."""
    template = ANALYSIS_PROMPTS.get(request.analysis_type, ANALYSIS_PROMPTS["general"])
    response = await call_gemini_with_retry(template.format(text=request.text))
    text = response.text.strip()
    if text.startswith("```"):  # Remove markdown code blocks
        text = "\n".join(text.split("\n")[1:-1])
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {"summary": text[:500], "sentiment": "unknown", "confidence": 0.0}
    return AnalysisResult(**parsed)


# ════════════════════════════════════════════════════════════
# SECTION 11 — Token Counting and Generation Config
# ════════════════════════════════════════════════════════════

# WHY: Gemini has token limits (32K for flash). Count tokens
# BEFORE calling the API to avoid errors and estimate costs.

@app.post("/tokens/count")
async def count_tokens(text: str = Query(..., min_length=1)):
    """Count tokens. PRODUCTION: model.count_tokens(text)"""
    info = model.count_tokens(text)
    return {"text_length": len(text), "estimated_tokens": info.total_tokens,
            "model": "gemini-1.5-flash", "max_input_tokens": 32768,
            "remaining": 32768 - info.total_tokens}

# --- Generation Configuration Deep Dive ---
# TEMPERATURE (0.0-2.0): 0=deterministic (facts), 0.7=balanced, 1.5+=creative
# TOP_P (0.0-1.0): nucleus sampling. 0.1=focused, 0.95=broad (default)
# TOP_K (1-100): consider top K tokens. 1=greedy, 40=default
# MAX_OUTPUT_TOKENS: 1024 tokens ~ 750 words, 8192 ~ 6000 words

@app.get("/config/presets")
async def get_generation_presets():
    """Recommended config presets for common AI tasks."""
    return {
        "factual_qa": {"temperature": 0.1, "top_p": 0.8, "top_k": 20,
                        "max_output_tokens": 512, "use_case": "FAQs, knowledge base"},
        "support_reply": {"temperature": 0.5, "top_p": 0.9, "top_k": 40,
                           "max_output_tokens": 1024, "use_case": "Customer support"},
        "creative": {"temperature": 1.2, "top_p": 0.95, "top_k": 60,
                      "max_output_tokens": 4096, "use_case": "Marketing copy, blogs"},
        "code": {"temperature": 0.2, "top_p": 0.8, "top_k": 10,
                  "max_output_tokens": 2048, "use_case": "Code generation"},
        "extraction": {"temperature": 0.0, "top_p": 1.0, "top_k": 1,
                        "max_output_tokens": 1024, "use_case": "JSON/entity extraction"},
    }


# ════════════════════════════════════════════════════════════
# SECTION 12 — Practical: Indian E-Commerce Product Descriptions
# ════════════════════════════════════════════════════════════

# WHY: Indian e-commerce has millions of products with poor
# descriptions from small sellers. AI-generated descriptions
# improve SEO, discoverability, and conversion rates.

@app.post("/products/describe", response_model=ProductDescResponse)
async def generate_product_description(request: ProductDescRequest):
    """Generate SEO-optimized product description for Indian e-commerce."""
    prompt = (
        f"You are an e-commerce copywriter for Flipkart/Amazon India.\n\n"
        f"Product: {request.product_name}\nCategory: {request.category}\n"
        f"Features: {', '.join(request.features)}\nPrice: Rs.{request.price_inr:,.0f}\n"
        f"Audience: {request.target_audience}\n\n"
        f"Return JSON with: title (max 100 chars), description (2-3 paragraphs, "
        f"India-specific), highlights (4-6 bullets), seo_keywords (8-10). ONLY JSON."
    )
    response = await call_gemini_with_retry(prompt)
    try:
        text = response.text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:-1])
        parsed = json.loads(text)
    except (json.JSONDecodeError, Exception):
        parsed = {
            "title": f"{request.product_name} - Best Price in India",
            "description": f"Buy {request.product_name} at Rs.{request.price_inr:,.0f}. "
                           f"Features: {', '.join(request.features)}.",
            "highlights": request.features[:6],
            "seo_keywords": [request.product_name.lower(), f"{request.category} online india",
                             f"buy {request.product_name.lower()}", f"{request.category} flipkart"],
        }
    return ProductDescResponse(
        title=parsed.get("title", request.product_name),
        description=parsed.get("description", ""), highlights=parsed.get("highlights", []),
        seo_keywords=parsed.get("seo_keywords", []),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


# ════════════════════════════════════════════════════════════
# SECTION 13 — System Instructions (Persona Configuration)
# ════════════════════════════════════════════════════════════

# WHY: System instructions define WHO the model is. Without them,
# generic assistant. With them, domain expert. Freshworks sets
# different personas per customer — formal for banks, casual for gaming.

# PRODUCTION: genai.GenerativeModel("gemini-1.5-flash",
#     system_instruction="You are FreshBot, the AI support agent...")

PERSONA_TEMPLATES = {
    "support_agent": "You are a senior support agent for an Indian SaaS company. "
                     "Be helpful, empathetic, concise. Escalate when unsure.",
    "sales_assistant": "You are a sales assistant for Indian e-commerce. "
                       "Help find products, mention deals, EMI options, free delivery.",
    "code_reviewer": "You are a senior Python dev at a Bangalore startup. "
                     "Review for bugs, performance, PEP 8 compliance.",
    "content_writer": "You are a content writer for Indian digital media. "
                      "Write engaging, SEO-optimized, culturally relevant content.",
}

@app.get("/personas")
async def list_personas():
    """List available AI persona templates."""
    return {name: {"description": desc[:80] + "..."} for name, desc in PERSONA_TEMPLATES.items()}


# ════════════════════════════════════════════════════════════
# SECTION 14 — Utility Endpoints
# ════════════════════════════════════════════════════════════

# WHY: Health checks, cache management, and session cleanup
# are essential for production AI services.

@app.get("/health")
async def health_check():
    """Health check for load balancers and monitoring."""
    return {"status": "healthy", "model": "gemini-1.5-flash",
            "api_key_set": bool(GEMINI_API_KEY), "active_sessions": len(chat_sessions),
            "cached_responses": len(response_cache),
            "timestamp": datetime.now(timezone.utc).isoformat()}

@app.delete("/cache")
async def clear_cache():
    """Clear the response cache."""
    count = len(response_cache)
    response_cache.clear()
    return {"cleared": count, "message": f"Cleared {count} cached responses"}

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session and free memory."""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    del chat_sessions[session_id]
    return {"message": f"Session {session_id} deleted"}

@app.get("/sessions")
async def list_sessions():
    """List all active chat sessions."""
    return {
        "sessions": [{"session_id": sid, "created_at": data["created_at"],
                       "turns": len(data["chat"].history) // 2}
                      for sid, data in chat_sessions.items()],
        "total": len(chat_sessions),
    }


# ════════════════════════════════════════════════════════════
# KEY TAKEAWAYS
# ════════════════════════════════════════════════════════════
# 1. FastAPI's async nature makes it ideal for AI endpoints — non-blocking API calls
# 2. Google Gemini is free (60 RPM) — no credit card needed, perfect for Indian devs
# 3. Always cache AI responses — same prompt + params = same response, save quota
# 4. Streaming (SSE) makes AI feel instant — users see tokens as they generate
# 5. Structured JSON output turns raw AI text into usable data for your app
# 6. System instructions transform a generic model into a domain expert
# 7. Temperature controls creativity: 0.0 for facts, 0.7 for balance, 1.5 for creativity
# 8. Few-shot prompting (give examples) beats lengthy instructions every time
# 9. Always implement retry with exponential backoff — AI APIs are unreliable
# 10. Token counting before API calls prevents wasted requests and better UX
# "The best AI feature is the one users don't notice — it just works." — Girish Mathrubootham, Freshworks CEO
