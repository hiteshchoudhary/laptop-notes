"""
SahayakAI Core Agent
--------------------
The main agent loop that orchestrates:
1. Receiving user messages
2. Calling Gemini with tool declarations
3. Executing tool calls (in parallel when multiple)
4. Feeding results back to Gemini
5. Streaming the final response

This is the brain of SahayakAI.
"""

import asyncio
import time
from collections.abc import AsyncGenerator
from typing import Any

import google.generativeai as genai

from agent.memory import ConversationMemory
from agent.tools import ToolRegistry
from config import settings


class SahayakAgent:
    """The main AI agent that processes user messages and coordinates tools."""

    def __init__(
        self,
        tool_registry: ToolRegistry,
        memory: ConversationMemory,
        system_prompt: str | None = None,
        model_name: str | None = None,
    ):
        self.tool_registry = tool_registry
        self.memory = memory
        self.system_prompt = system_prompt or settings.SYSTEM_PROMPT
        self.model_name = model_name or settings.GEMINI_MODEL

        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Build tool declarations for Gemini
        self._tool_declarations = self._build_tool_declarations()

    def _build_tool_declarations(self) -> list[dict]:
        """Build the list of function declarations for Gemini."""
        declarations = self.tool_registry.get_all_declarations()
        if not declarations:
            return []
        return declarations

    def _create_model(self) -> genai.GenerativeModel:
        """Create a Gemini GenerativeModel with tools configured."""
        tools = None
        if self._tool_declarations:
            tools = [
                genai.protos.Tool(
                    function_declarations=[
                        genai.protos.FunctionDeclaration(
                            name=decl["name"],
                            description=decl["description"],
                            parameters=genai.protos.Schema(
                                type=genai.protos.Type.OBJECT,
                                properties={
                                    k: genai.protos.Schema(
                                        type=self._map_json_type(v.get("type", "string")),
                                        description=v.get("description", ""),
                                    )
                                    for k, v in decl["parameters"]
                                    .get("properties", {})
                                    .items()
                                },
                                required=decl["parameters"].get("required", []),
                            ),
                        )
                        for decl in self._tool_declarations
                    ]
                )
            ]

        model = genai.GenerativeModel(
            model_name=self.model_name,
            tools=tools,
            system_instruction=self.system_prompt,
        )
        return model

    @staticmethod
    def _map_json_type(json_type: str) -> int:
        """Map JSON Schema type to Gemini proto Type enum."""
        type_map = {
            "string": genai.protos.Type.STRING,
            "number": genai.protos.Type.NUMBER,
            "integer": genai.protos.Type.INTEGER,
            "boolean": genai.protos.Type.BOOLEAN,
            "object": genai.protos.Type.OBJECT,
            "array": genai.protos.Type.ARRAY,
        }
        return type_map.get(json_type, genai.protos.Type.STRING)

    async def _execute_tool(self, tool_name: str, args: dict) -> dict:
        """Execute a single tool with timeout and error handling."""
        tool = self.tool_registry.get(tool_name)
        if not tool:
            return {
                "tool": tool_name,
                "result": None,
                "error": f"Unknown tool: {tool_name}",
                "duration_ms": 0.0,
            }

        start = time.monotonic()
        try:
            result = await asyncio.wait_for(
                tool.execute(**args),
                timeout=float(settings.TOOL_TIMEOUT),
            )
            duration = (time.monotonic() - start) * 1000
            return {
                "tool": tool_name,
                "result": result,
                "error": None,
                "duration_ms": round(duration, 2),
            }
        except asyncio.TimeoutError:
            duration = (time.monotonic() - start) * 1000
            return {
                "tool": tool_name,
                "result": None,
                "error": f"Tool '{tool_name}' timed out after {settings.TOOL_TIMEOUT}s",
                "duration_ms": round(duration, 2),
            }
        except Exception as exc:
            duration = (time.monotonic() - start) * 1000
            return {
                "tool": tool_name,
                "result": None,
                "error": f"Tool '{tool_name}' failed: {str(exc)}",
                "duration_ms": round(duration, 2),
            }

    async def _execute_tools_parallel(
        self, tool_calls: list[dict]
    ) -> list[dict]:
        """Execute multiple tool calls concurrently using asyncio.gather."""
        tasks = [
            self._execute_tool(call["name"], call["args"])
            for call in tool_calls
        ]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return list(results)

    def _extract_function_calls(self, response: Any) -> list[dict]:
        """Extract function call requests from a Gemini response."""
        calls = []
        for part in response.parts:
            fn = part.function_call
            if fn and fn.name:
                args = {}
                if fn.args:
                    for key, value in fn.args.items():
                        args[key] = value
                calls.append({"name": fn.name, "args": args})
        return calls

    def _extract_text(self, response: Any) -> str:
        """Extract text content from a Gemini response."""
        texts = []
        for part in response.parts:
            if part.text:
                texts.append(part.text)
        return " ".join(texts) if texts else ""

    def _build_history_contents(
        self, history: list[dict], user_message: str
    ) -> list[dict]:
        """Build the Gemini-compatible contents list from history."""
        contents = []
        for msg in history:
            role = msg["role"]
            if role == "user":
                contents.append({"role": "user", "parts": [msg["content"]]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [msg["content"]]})
            # tool messages are skipped in Gemini history format
        # Add the new user message
        contents.append({"role": "user", "parts": [user_message]})
        return contents

    async def chat(
        self, message: str, conversation_id: str | None = None
    ) -> AsyncGenerator[dict, None]:
        """Process a user message and yield streaming events.

        Yields dicts with keys: type, data
        Types: thinking, tool_call, tool_result, chunk, done, error

        This is the main agent loop:
        1. Load conversation history from memory
        2. Build messages with system prompt + history + new message
        3. Call Gemini with tool declarations
        4. If function calls: execute tools, feed results back, get final response
        5. If no function calls: return text directly
        6. Save to conversation memory
        7. Yield response chunks for streaming
        """
        start_time = time.monotonic()
        tools_used: list[str] = []
        tool_details: list[dict] = []

        # Step 1: Get or create conversation
        conv_id = self.memory.get_or_create_conversation(conversation_id)

        yield {"type": "thinking", "data": "Analyzing your request..."}

        try:
            # Step 2: Load history
            history = await self.memory.load_history(conv_id)

            # Step 3: Build contents for Gemini
            contents = self._build_history_contents(history, message)

            # Step 4: Create model and start chat
            model = self._create_model()
            chat_session = model.start_chat(history=contents[:-1])

            # Step 5: Send message to Gemini
            response = chat_session.send_message(contents[-1]["parts"])

            # Step 6: Check for function calls
            function_calls = self._extract_function_calls(response)

            if function_calls:
                # Yield tool call events
                for call in function_calls:
                    yield {
                        "type": "tool_call",
                        "data": {"tool": call["name"], "args": call["args"]},
                    }

                # Execute tools (parallel if multiple)
                tool_results = await self._execute_tools_parallel(function_calls)

                # Yield tool result events
                for result in tool_results:
                    tools_used.append(result["tool"])
                    tool_details.append(result)
                    yield {
                        "type": "tool_result",
                        "data": {
                            "tool": result["tool"],
                            "result": result["result"] or result["error"],
                        },
                    }

                # Feed results back to Gemini
                function_response_parts = []
                for call, result in zip(function_calls, tool_results):
                    response_content = result["result"] or f"Error: {result['error']}"
                    function_response_parts.append(
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=call["name"],
                                response={"result": response_content},
                            )
                        )
                    )

                # Get final response from Gemini with tool results
                final_response = chat_session.send_message(
                    function_response_parts
                )
                response_text = self._extract_text(final_response)
            else:
                # No function calls — direct text response
                response_text = self._extract_text(response)

            # Step 7: Stream the response text in chunks
            if response_text:
                # Split into sentences for natural streaming
                chunks = self._split_into_chunks(response_text)
                for chunk in chunks:
                    yield {"type": "chunk", "data": chunk}

            # Step 8: Save to memory
            await self.memory.save_message(conv_id, "user", message)
            await self.memory.save_message(conv_id, "assistant", response_text)

            # Save tool call info as separate messages
            for detail in tool_details:
                await self.memory.save_message(
                    conv_id,
                    "tool",
                    detail.get("result", "") or detail.get("error", ""),
                    tool_name=detail["tool"],
                    tool_args=None,
                )

            # Step 9: Done
            elapsed = (time.monotonic() - start_time) * 1000
            yield {
                "type": "done",
                "data": {
                    "conversation_id": conv_id,
                    "tools_used": tools_used,
                    "response_time_ms": round(elapsed, 2),
                },
            }

        except Exception as exc:
            elapsed = (time.monotonic() - start_time) * 1000
            yield {
                "type": "error",
                "data": f"Agent error: {str(exc)}",
            }
            yield {
                "type": "done",
                "data": {
                    "conversation_id": conv_id,
                    "tools_used": tools_used,
                    "response_time_ms": round(elapsed, 2),
                },
            }

    async def chat_sync(
        self, message: str, conversation_id: str | None = None
    ) -> dict:
        """Non-streaming version of chat. Returns the complete response.

        Used by the REST POST /chat endpoint.
        """
        response_text = ""
        tools_used: list[str] = []
        tool_details: list[dict] = []
        conv_id = ""
        response_time_ms = 0.0

        async for event in self.chat(message, conversation_id):
            event_type = event["type"]
            if event_type == "chunk":
                response_text += event["data"]
            elif event_type == "done":
                data = event["data"]
                conv_id = data["conversation_id"]
                tools_used = data["tools_used"]
                response_time_ms = data["response_time_ms"]
            elif event_type == "tool_result":
                tool_details.append(event["data"])
            elif event_type == "error":
                response_text = event["data"]

        return {
            "response": response_text,
            "conversation_id": conv_id,
            "tools_used": tools_used,
            "tool_details": tool_details,
            "response_time_ms": response_time_ms,
        }

    @staticmethod
    def _split_into_chunks(text: str, max_chunk_size: int = 80) -> list[str]:
        """Split text into sentence-based chunks for streaming.

        Tries to split on sentence boundaries (. ! ?) for natural reading.
        Falls back to splitting on spaces if sentences are too long.
        """
        if not text:
            return []

        chunks: list[str] = []
        current = ""

        for char in text:
            current += char
            if char in ".!?\n" and len(current) >= 20:
                chunks.append(current)
                current = ""
            elif len(current) >= max_chunk_size:
                # Split at last space
                last_space = current.rfind(" ")
                if last_space > 0:
                    chunks.append(current[: last_space + 1])
                    current = current[last_space + 1 :]
                else:
                    chunks.append(current)
                    current = ""

        if current.strip():
            chunks.append(current)

        return chunks
