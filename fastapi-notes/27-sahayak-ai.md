# ============================================================
# FILE 27: SAHAYAK AI — AI AGENT WITH FUNCTION CALLING & TOOLS
# ============================================================
# Topics: AI agents, Gemini function calling, tool use, WebSocket
#         streaming, conversation memory, agent loop, parallel
#         tool execution, system prompts, admin monitoring
#
# WHY THIS MATTERS:
# AI agents are transforming how software works. An LLM that can
# call functions, query databases, and fetch live data is no longer
# science fiction — it is the new standard for intelligent backends.
# This chapter teaches you the complete agent architecture.
# ============================================================


## STORY: The Shopkeeper's AI Assistant

Rajan runs a small electronics shop in Chandni Chowk, Delhi. Every day he
juggles WhatsApp messages from suppliers, checks USD exchange rates for
imported goods, tracks daily sales in a tattered notebook, and peeks at the
weather forecast before deciding whether to open his rooftop storage. He
types one message to SahayakAI: "What is the weather in Delhi today? Also
summarize my sales this week and convert 50,000 rupees to USD." SahayakAI
breaks this into three tool calls — weather API, sales database query, and
currency conversion — executes them in parallel, and streams a unified
answer back through a WebSocket connection in real time.

Jugaad Labs, a Bangalore startup, built SahayakAI (sahayak means "helper"
in Hindi) for shopkeepers like Rajan. The idea is simple: instead of
switching between five different apps, ask one AI assistant and get
everything in a single response. The AI decides which tools to use, calls
them, and weaves the results into a natural-language answer. This is not
a chatbot that regurgitates training data — it is an agent that acts.


---


## SECTION 1 — What Are AI Agents?

### WHY: Understanding the agent paradigm before writing code prevents you from building a glorified chatbot

An AI agent is more than a large language model. It is an LLM combined
with tools, memory, and a reasoning loop. The LLM serves as the brain —
it reads the user's message, decides what actions to take, interprets
the results, and formulates a final response.

### The Four Components of an AI Agent

```
┌─────────────────────────────────────────────────────────┐
│                      AI AGENT                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │
│  │   LLM    │  │  TOOLS   │  │ MEMORY │  │ REASONING│  │
│  │ (Brain)  │  │ (Hands)  │  │ (Notes)│  │  (Loop)  │  │
│  └──────────┘  └──────────┘  └────────┘  └──────────┘  │
│                                                         │
│  Brain: Gemini model that understands language           │
│  Hands: Functions the agent can call (weather, math...) │
│  Notes: Conversation history stored in SQLite           │
│  Loop:  Decide → Act → Observe → Respond                │
└─────────────────────────────────────────────────────────┘
```

### Agent vs Chatbot

| Aspect              | Chatbot                     | AI Agent                          |
|----------------------|-----------------------------|-----------------------------------|
| Knowledge source     | Training data only          | Training data + live tools        |
| Actions              | Generate text               | Generate text + execute functions |
| Memory               | Current conversation only   | Persistent across sessions        |
| Decision making      | Respond to prompt           | Decide which tools to call        |
| Real-time data       | No                          | Yes (APIs, databases)             |
| Example              | "Tell me about weather"     | "Fetch current weather for Delhi" |

**ANALOGY:** A chatbot is like a librarian who can only quote from books
on the shelf. An agent is like a personal assistant who can make phone
calls, check your bank account, and book appointments — all while
talking to you.

### The Agent Loop

This is the core reasoning cycle that makes agents powerful:

```
User Message
    │
    ▼
┌─────────────────────────────┐
│  1. Build context           │ ← System prompt + history + tools list
│  2. Send to LLM             │ ← Gemini with function declarations
│  3. LLM responds            │
│     ├── Text only? ──────────────► Return to user
│     └── Function call(s)?    │
│          │                   │
│          ▼                   │
│  4. Execute tool(s)          │ ← Call weather API, query DB, etc.
│  5. Feed results back to LLM │
│  6. LLM generates final text │
│  7. Return to user           │
└─────────────────────────────┘
    │
    ▼
Save to Memory (SQLite)
```

**KEY INSIGHT:** The LLM decides which tools to call. You do not write
if/else logic to detect "weather" in the user's message. The LLM reads
the tool descriptions and makes the decision itself. This is the
fundamental difference between function calling and keyword matching.


---


## SECTION 2 — Gemini Function Calling Deep Dive

### WHY: Function calling is the mechanism that turns an LLM into an agent

Google's Gemini API supports "function calling" — you describe your
available functions using JSON Schema, and the model can request to call
them when appropriate. The model does not execute the functions itself; it
returns a structured request saying "call this function with these
arguments," and your code executes it.

### How Function Calling Works

```
Step 1: You define tools
  "get_weather" — fetches weather for a city
  "convert_currency" — converts between currencies

Step 2: User sends message
  "What is the weather in Mumbai and convert 1000 INR to USD"

Step 3: Gemini analyzes and returns function calls
  [
    {"name": "get_weather", "args": {"city": "Mumbai"}},
    {"name": "convert_currency", "args": {"amount": 1000, "from": "INR", "to": "USD"}}
  ]

Step 4: Your code executes both functions

Step 5: You feed the results back to Gemini

Step 6: Gemini writes a natural language response using the results
```

### Tool Declaration Schema

Each tool is declared as a JSON Schema object that tells Gemini:
- **name** — What to call the function
- **description** — When to use it (this is critical — Gemini reads this
  to decide whether to call the tool)
- **parameters** — What arguments to pass (JSON Schema format)

```python
weather_tool = {
    "name": "get_weather",
    "description": "Get the current weather conditions for a specified city. "
                   "Use this when the user asks about weather, temperature, "
                   "rain, or climate conditions in any city.",
    "parameters": {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "The name of the city, e.g. 'Mumbai', 'Delhi', 'Chennai'"
            }
        },
        "required": ["city"]
    }
}
```

**CRITICAL:** The `description` field is the most important part. If you
write "gets weather," Gemini might not call it when the user says "Will
it rain in Pune?" But if you write "Get the current weather conditions
for a specified city. Use this when the user asks about weather,
temperature, rain, or climate conditions," it will reliably trigger.

### Parallel Tool Calling

When a user says "What is the weather in Delhi and convert 50000 INR to
USD?", Gemini returns BOTH function calls in a single response. Your code
should execute them concurrently using `asyncio.gather()` — this cuts
response time in half.

```python
import asyncio

async def execute_tools_parallel(tool_calls: list) -> list:
    """Execute multiple tool calls concurrently."""
    tasks = []
    for call in tool_calls:
        tool = tool_registry.get(call.name)
        if tool:
            tasks.append(tool.execute(**call.args))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

### The google-generativeai Library

```python
import google.generativeai as genai

genai.configure(api_key="your-api-key")

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    tools=[weather_tool_declaration, currency_tool_declaration],
    system_instruction="You are SahayakAI, a helpful assistant for Indian shopkeepers."
)

chat = model.start_chat()
response = chat.send_message("What is the weather in Delhi?")

# Check if the model wants to call a function
for part in response.parts:
    if part.function_call:
        function_name = part.function_call.name
        function_args = dict(part.function_call.args)
        # Execute the function and feed results back
```


---


## SECTION 3 — Project Architecture

### WHY: A clear architecture separates concerns and makes the agent testable

```
27-sahayak-ai/
├── main.py                  # FastAPI app, lifespan, routers, WebSocket
├── config.py                # Settings (API keys, DB path, model name)
├── models.py                # Pydantic/SQLModel schemas
├── database.py              # SQLite tables: conversations, messages, usage
├── agent/
│   ├── __init__.py          # Package exports
│   ├── core.py              # SahayakAgent: the main agent loop
│   ├── tools.py             # Tool registry + built-in tools
│   └── memory.py            # Conversation memory (save/load from SQLite)
├── routes/
│   ├── __init__.py          # Package exports
│   ├── chat.py              # POST /chat, POST /chat/stream (SSE)
│   ├── conversations.py     # GET/DELETE /conversations
│   ├── admin.py             # GET /admin/stats, /admin/usage, /admin/tools
│   └── health.py            # GET /health
├── websocket/
│   ├── __init__.py          # Package exports
│   └── handler.py           # WebSocket handler for real-time streaming
├── middleware/
│   ├── __init__.py          # Package exports
│   └── usage_tracker.py     # Track requests, tokens, response times
├── .env.example             # Template for environment variables
├── requirements.txt         # Python dependencies
├── Dockerfile               # Container image definition
└── docker-compose.yml       # Single-command deployment
```

### Architecture Flow

```
                    ┌────────────────────────┐
                    │      Client            │
                    │  (Browser / curl / JS) │
                    └────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         REST (HTTP)    WebSocket       SSE Stream
              │              │              │
              ▼              ▼              ▼
┌──────────────────────────────────────────────────┐
│                  FastAPI App                       │
│  ┌──────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  Routes   │  │ WebSocket │  │  Middleware    │  │
│  │ (chat,    │  │ Handler   │  │ (usage track) │  │
│  │  admin)   │  │           │  │               │  │
│  └─────┬─────┘  └─────┬─────┘  └───────────────┘  │
│        │              │                            │
│        └──────┬───────┘                            │
│               ▼                                    │
│  ┌─────────────────────────┐                       │
│  │    SahayakAgent         │                       │
│  │  ┌───────┐ ┌─────────┐ │                       │
│  │  │ Gemini│ │  Tools   │ │                       │
│  │  │  API  │ │ Registry │ │                       │
│  │  └───────┘ └─────────┘ │                       │
│  │  ┌────────────────────┐ │                       │
│  │  │ Conversation Memory│ │                       │
│  │  └────────────────────┘ │                       │
│  └─────────────────────────┘                       │
│               │                                    │
│               ▼                                    │
│  ┌─────────────────────────┐                       │
│  │  SQLite Database         │                       │
│  │  - conversations table   │                       │
│  │  - messages table        │                       │
│  │  - usage_logs table      │                       │
│  └─────────────────────────┘                       │
└──────────────────────────────────────────────────┘
               │
     ┌─────────┼─────────────┐
     ▼         ▼             ▼
  wttr.in   Exchange     Calculator
  (weather)  Rate API    (local math)
```

### Tech Stack

| Component         | Technology               |
|-------------------|--------------------------|
| Framework         | FastAPI                  |
| LLM               | Google Gemini 1.5 Flash  |
| LLM Library       | google-generativeai      |
| Database          | SQLite via SQLModel      |
| HTTP Client       | httpx (async)            |
| WebSocket         | FastAPI built-in         |
| Streaming         | SSE + WebSocket          |
| Config            | pydantic-settings        |
| Container         | Docker + docker-compose  |
| Server            | Uvicorn                  |


---


## SECTION 4 — Building Custom Tools

### WHY: Tools are the agent's hands — without them, it can only talk, not act

Each tool follows the BaseTool abstract class pattern. This ensures
consistency: every tool has a name, description, parameters schema, and
an async execute method. The tool registry makes it easy to add new tools
without modifying the agent core.

### The BaseTool Pattern

```python
from abc import ABC, abstractmethod

class BaseTool(ABC):
    name: str
    description: str
    parameters: dict  # JSON Schema

    @abstractmethod
    async def execute(self, **kwargs) -> str:
        """Execute the tool and return a string result."""
        raise NotImplementedError

    def get_declaration(self) -> dict:
        """Return the Gemini function declaration for this tool."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters
        }
```

### Built-in Tools Summary

| Tool            | Name               | What It Does                              | API Used          |
|-----------------|--------------------|-------------------------------------------|-------------------|
| WeatherTool     | `get_weather`      | Current weather for any city              | wttr.in (free)    |
| CurrencyTool    | `convert_currency` | Convert between currencies                | Mock rates / API  |
| CalculatorTool  | `calculate`        | Safe math evaluation                      | Python ast module |
| SearchTool      | `web_search`       | Mock web search results                   | Mock data         |
| DateTimeTool    | `get_datetime`     | Current date/time for Indian cities       | Python datetime   |

### WeatherTool — Using wttr.in (No API Key Needed)

```python
class WeatherTool(BaseTool):
    name = "get_weather"
    description = (
        "Get current weather for a city. Use when the user asks about "
        "weather, temperature, rain, humidity, or climate conditions."
    )
    parameters = {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "City name, e.g. 'Delhi', 'Mumbai', 'Kolkata'"
            }
        },
        "required": ["city"]
    }

    async def execute(self, city: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://wttr.in/{city}?format=j1")
            resp.raise_for_status()
            data = resp.json()
            current = data["current_condition"][0]
            return (
                f"Weather in {city}: {current['temp_C']}C, "
                f"{current['weatherDesc'][0]['value']}, "
                f"Humidity: {current['humidity']}%, "
                f"Wind: {current['windspeedKmph']} km/h"
            )
```

### CalculatorTool — Safe Math Without eval()

**NEVER** use `eval()` for user input. A user could type
`__import__('os').system('rm -rf /')` and destroy your server.
Use the `ast` module to safely parse numeric expressions.

```python
import ast
import operator

SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}

def safe_eval(expression: str) -> float:
    """Evaluate a math expression safely using AST parsing."""
    tree = ast.parse(expression, mode="eval")
    return _eval_node(tree.body)

def _eval_node(node) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    elif isinstance(node, ast.BinOp):
        op_func = SAFE_OPERATORS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        return op_func(_eval_node(node.left), _eval_node(node.right))
    elif isinstance(node, ast.UnaryOp):
        op_func = SAFE_OPERATORS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        return op_func(_eval_node(node.operand))
    else:
        raise ValueError(f"Unsupported expression: {ast.dump(node)}")
```

### CurrencyTool — Exchange Rates

```python
class CurrencyTool(BaseTool):
    name = "convert_currency"
    description = (
        "Convert an amount from one currency to another. "
        "Use when the user asks to convert money between currencies "
        "like INR to USD, EUR to INR, etc."
    )
    parameters = {
        "type": "object",
        "properties": {
            "amount": {"type": "number", "description": "Amount to convert"},
            "from_currency": {"type": "string", "description": "Source currency code (INR, USD, EUR)"},
            "to_currency": {"type": "string", "description": "Target currency code (INR, USD, EUR)"}
        },
        "required": ["amount", "from_currency", "to_currency"]
    }
```

### Tool Registry

```python
class ToolRegistry:
    """Central registry for all available tools."""

    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def get_all_declarations(self) -> list[dict]:
        return [tool.get_declaration() for tool in self._tools.values()]

    def list_tools(self) -> list[str]:
        return list(self._tools.keys())
```


---


## SECTION 5 — WebSocket Integration

### WHY: HTTP request-response cannot stream tokens in real-time — WebSocket can

When a user asks a question, the agent might take 5-10 seconds to think,
call tools, and generate a response. With a regular HTTP endpoint, the
user stares at a loading spinner for the entire duration. With WebSocket,
you can stream each phase in real-time:

1. "Thinking..." (agent is processing)
2. "Calling weather tool..." (tool execution)
3. "Weather result: 32C, Partly cloudy" (tool result)
4. "The current weather in..." (response chunks)

### WebSocket Message Protocol

```
Client to Server:
{
    "text": "What is the weather in Mumbai?",
    "conversation_id": "conv_abc123"      // optional, auto-generated if missing
}

Server to Client (streamed as separate messages):
{"type": "thinking",     "data": "Analyzing your request..."}
{"type": "tool_call",    "data": {"tool": "get_weather", "args": {"city": "Mumbai"}}}
{"type": "tool_result",  "data": {"tool": "get_weather", "result": "32C, Partly cloudy"}}
{"type": "chunk",        "data": "The current weather in Mumbai is "}
{"type": "chunk",        "data": "32 degrees Celsius with partly cloudy skies."}
{"type": "done",         "data": {"conversation_id": "conv_abc123", "tools_used": ["get_weather"]}}
```

### FastAPI WebSocket Endpoint

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive JSON message from client
            data = await websocket.receive_json()
            text = data.get("text", "")
            conversation_id = data.get("conversation_id")

            # Stream agent response
            async for event in agent.chat(text, conversation_id):
                await websocket.send_json(event)
    except WebSocketDisconnect:
        pass  # Client disconnected — clean up gracefully
```

### Why Both WebSocket AND REST?

| Feature           | REST (POST /chat)           | WebSocket (/ws/chat)          |
|-------------------|-----------------------------|-------------------------------|
| Connection        | New per request             | Persistent                    |
| Streaming         | No (or SSE for one-way)     | Yes, bidirectional            |
| Use case          | Simple integrations, curl   | Real-time chat UIs            |
| Overhead          | HTTP headers each time      | Minimal after handshake       |
| Complexity        | Simple                      | Requires connection management|

**RULE:** Offer both. REST for simplicity and testing. WebSocket for
production chat interfaces.


---


## SECTION 6 — Conversation Memory

### WHY: Without memory, the agent forgets everything after each message

Memory is what turns a single Q&A into a multi-turn conversation. When
Rajan says "Convert it to EUR too," the agent needs to remember that "it"
refers to the 50,000 INR from his previous message.

### Memory Architecture

```
conversations table           messages table
┌──────────────────┐         ┌────────────────────────┐
│ id (PK)          │         │ id (PK)                │
│ title            │◄────────│ conversation_id (FK)   │
│ created_at       │         │ role (user/assistant/   │
│ updated_at       │         │        tool)            │
│ message_count    │         │ content                │
└──────────────────┘         │ tool_name (nullable)   │
                             │ tool_args (nullable)   │
                             │ created_at             │
                             └────────────────────────┘
```

### How Memory Integrates with the Agent Loop

```python
async def chat(self, message: str, conversation_id: str | None):
    # 1. Load or create conversation
    conv_id = conversation_id or str(uuid4())
    history = await self.memory.load_history(conv_id)

    # 2. Build messages: system prompt + history + new message
    messages = self._build_messages(history, message)

    # 3. Call Gemini with full context
    response = await self._call_gemini(messages)

    # 4. Save user message and assistant response
    await self.memory.save_message(conv_id, "user", message)
    await self.memory.save_message(conv_id, "assistant", response_text)
```

### Context Window Management

Gemini has a context window limit. If a conversation has 200 messages,
you cannot send all of them. Strategies:

1. **Sliding window** — Send only the last N messages (e.g., last 20)
2. **Summarization** — Summarize older messages into a single summary
3. **Token counting** — Count tokens and truncate from the oldest

SahayakAI uses the sliding window approach for simplicity:

```python
MAX_HISTORY_MESSAGES = 20

async def load_history(self, conversation_id: str) -> list[dict]:
    messages = self._fetch_messages(conversation_id)
    if len(messages) > MAX_HISTORY_MESSAGES:
        return messages[-MAX_HISTORY_MESSAGES:]
    return messages
```


---


## SECTION 7 — System Prompts for Agent Behavior

### WHY: The system prompt defines the agent's personality, rules, and constraints

A system prompt is the instruction you give the LLM before any user
interaction. It shapes how the agent responds — its tone, language, limits,
and behavior when tools fail.

### SahayakAI's System Prompt

```python
SYSTEM_PROMPT = """You are SahayakAI, an intelligent assistant for Indian small businesses.

Your behavior:
- Always respond in a helpful, concise manner
- When the user asks about weather, currency, calculations, or current
  date/time, USE the available tools. Do not guess or make up data.
- If a tool call fails, inform the user honestly and suggest alternatives
- You can handle multiple requests in one message — use parallel tool calls
- Format currency amounts with proper symbols (Rs., $, etc.)
- Use the metric system (Celsius, kilometers)
- When unsure, ask for clarification rather than guessing

Your limitations:
- You cannot browse the internet freely — only use the provided tools
- You cannot remember information between separate conversations
- You cannot perform actions outside your tool set

Tone: Professional but warm, like a knowledgeable shop assistant.
Language: Respond in the same language the user writes in.
"""
```

**KEY INSIGHT:** System prompts are not suggestions — they are
instructions. A well-written system prompt reduces hallucination,
improves tool usage accuracy, and gives the agent a consistent personality.


---


## SECTION 8 — Error Handling and Resilience

### WHY: Tools call external APIs that fail — your agent must handle failures gracefully

### Error Categories

| Error Type            | Example                          | How to Handle                    |
|-----------------------|----------------------------------|----------------------------------|
| Tool timeout          | wttr.in takes > 10 seconds       | Return fallback message          |
| Tool not found        | LLM calls non-existent function  | Log warning, tell user           |
| Invalid arguments     | LLM passes wrong argument types  | Validate before execution        |
| API rate limit        | Too many requests to exchange API | Cache results, use fallback data |
| Network failure       | No internet connectivity         | Return cached data or error      |
| LLM API error         | Gemini API returns 500           | Retry with exponential backoff   |

### Tool Execution with Error Handling

```python
async def _execute_tool(self, tool_name: str, args: dict) -> dict:
    tool = self.tool_registry.get(tool_name)
    if not tool:
        return {
            "tool": tool_name,
            "error": f"Unknown tool: {tool_name}",
            "result": None
        }

    try:
        result = await asyncio.wait_for(
            tool.execute(**args),
            timeout=15.0  # 15-second timeout per tool
        )
        return {"tool": tool_name, "result": result, "error": None}
    except asyncio.TimeoutError:
        return {
            "tool": tool_name,
            "error": f"Tool '{tool_name}' timed out after 15 seconds",
            "result": None
        }
    except Exception as e:
        return {
            "tool": tool_name,
            "error": f"Tool '{tool_name}' failed: {str(e)}",
            "result": None
        }
```


---


## SECTION 9 — Rate Limiting and Usage Tracking

### WHY: Without tracking, one abusive user can exhaust your Gemini API quota

### Usage Tracking Middleware

Every request is logged with:
- Timestamp
- Endpoint called
- Response time (milliseconds)
- Number of tool calls made
- Conversation ID

This data powers the admin dashboard.

```python
usage_logs table
┌────────────────────────┐
│ id (PK)                │
│ endpoint               │
│ method                 │
│ response_time_ms       │
│ tool_calls_count       │
│ conversation_id        │
│ created_at             │
└────────────────────────┘
```

### Admin Monitoring Endpoints

```
GET /admin/stats      — Total conversations, messages, avg response time
GET /admin/usage      — Daily usage counts for the last 30 days
GET /admin/tools      — Tool call frequency (which tools are most popular)
```

These endpoints return data suitable for dashboards. In production, you
would connect Grafana or a custom frontend to visualize these metrics.


---


## SECTION 10 — Docker Setup

### WHY: "It works on my machine" is not a deployment strategy

### Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
services:
  web:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - sahayak_data:/app/data
    restart: unless-stopped

volumes:
  sahayak_data:
```

The volume `sahayak_data` persists the SQLite database across container
restarts. Without it, every restart would lose all conversation history.


---


## SECTION 11 — API Reference

### REST Endpoints

| Method | Endpoint                    | Description                       | Auth |
|--------|-----------------------------|-----------------------------------|------|
| POST   | `/chat`                     | Send message, get full response   | No   |
| POST   | `/chat/stream`              | Send message, get SSE stream      | No   |
| GET    | `/conversations`            | List all conversations            | No   |
| GET    | `/conversations/{id}`       | Get conversation with messages    | No   |
| DELETE | `/conversations/{id}`       | Delete a conversation             | No   |
| GET    | `/admin/stats`              | Overall usage statistics          | No   |
| GET    | `/admin/usage`              | Daily usage for last 30 days      | No   |
| GET    | `/admin/tools`              | Tool call frequency breakdown     | No   |
| GET    | `/health`                   | Health check                      | No   |

### WebSocket Endpoint

| Endpoint     | Description                                    |
|--------------|------------------------------------------------|
| `/ws/chat`   | Bidirectional chat with real-time streaming     |

### Request/Response Examples

**POST /chat**
```json
// Request
{
    "message": "What is the weather in Bangalore?",
    "conversation_id": "conv_abc123"
}

// Response
{
    "response": "The current weather in Bangalore is 28C with clear skies...",
    "conversation_id": "conv_abc123",
    "tools_used": ["get_weather"],
    "response_time_ms": 2340
}
```


---


## SECTION 12 — Running and Testing

### Setup

```bash
cd 27-sahayak-ai/
cp .env.example .env              # Add your Gemini API key
pip install -r requirements.txt
uvicorn main:app --reload
```

### Test REST Endpoints

```bash
# Health check
curl http://127.0.0.1:8000/health

# Simple chat
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 245 * 18?"}'

# Chat with tool use
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather in Delhi and convert 50000 INR to USD"}'

# List conversations
curl http://127.0.0.1:8000/conversations

# Admin stats
curl http://127.0.0.1:8000/admin/stats
```

### Test WebSocket

```python
import asyncio
import json
import websockets

async def test_ws():
    async with websockets.connect("ws://127.0.0.1:8000/ws/chat") as ws:
        await ws.send(json.dumps({
            "text": "Weather in Mumbai and convert 1000 INR to USD"
        }))
        while True:
            msg = json.loads(await ws.recv())
            print(f"[{msg['type']}] {msg['data']}")
            if msg["type"] == "done":
                break

asyncio.run(test_ws())
```


---


## KEY TAKEAWAYS

1. **An AI agent = LLM + Tools + Memory + Reasoning Loop** — the LLM
   decides which tools to call, executes them via your code, and uses
   the results to form a response. You do not hardcode tool selection.

2. **Function calling is not function execution** — Gemini returns a
   structured request saying "call get_weather with city=Delhi." Your
   backend actually executes the function and feeds the result back.

3. **Tool descriptions are critical** — the LLM reads descriptions to
   decide when to call a tool. Write them like you are explaining to a
   new employee what the function does and when to use it.

4. **Parallel tool execution cuts latency** — when the LLM requests
   multiple tools, use `asyncio.gather()` to run them concurrently
   instead of sequentially.

5. **WebSocket enables real-time streaming** — instead of waiting for
   the entire agent loop to complete, stream each phase (thinking,
   tool calls, response chunks) to the client as it happens.

6. **Conversation memory makes multi-turn chat possible** — store
   messages in SQLite and load them as context for the LLM. Use a
   sliding window to stay within the context window limit.

7. **Never use eval() for user math** — use AST parsing with a
   whitelist of safe operators. One malicious input could compromise
   your entire server.

8. **Always handle tool failures gracefully** — external APIs timeout,
   return errors, and rate-limit you. Wrap every tool call in a
   try/except with a timeout.
