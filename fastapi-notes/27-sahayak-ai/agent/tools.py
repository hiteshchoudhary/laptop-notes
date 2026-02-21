"""
SahayakAI Tool System
---------------------
BaseTool abstract class and all built-in tools.
Each tool has a name, description, parameters schema, and async execute method.
The ToolRegistry manages tool registration and declaration generation.
"""

import ast
import operator
from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta

import httpx


# ─── Base Tool ────────────────────────────────────────────────

class BaseTool(ABC):
    """Abstract base class for all agent tools."""

    name: str = ""
    description: str = ""
    parameters: dict = {}

    @abstractmethod
    async def execute(self, **kwargs) -> str:
        """Execute the tool and return a string result."""
        raise NotImplementedError

    def get_declaration(self) -> dict:
        """Return the function declaration for Gemini."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


# ─── Weather Tool ─────────────────────────────────────────────

class WeatherTool(BaseTool):
    """Fetch current weather using wttr.in (free, no API key needed)."""

    name = "get_weather"
    description = (
        "Get current weather conditions for a specified city. "
        "Use this when the user asks about weather, temperature, rain, "
        "humidity, wind, or climate conditions in any city."
    )
    parameters = {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "The name of the city, e.g. 'Mumbai', 'Delhi', 'Chennai'",
            }
        },
        "required": ["city"],
    }

    async def execute(self, **kwargs) -> str:
        city = kwargs.get("city", "")
        if not city:
            return "Error: city parameter is required"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://wttr.in/{city}?format=j1",
                headers={"User-Agent": "SahayakAI/1.0"},
            )
            response.raise_for_status()
            data = response.json()

            current = data["current_condition"][0]
            temp_c = current["temp_C"]
            desc = current["weatherDesc"][0]["value"]
            humidity = current["humidity"]
            wind = current["windspeedKmph"]
            feels_like = current["FeelsLikeC"]

            return (
                f"Weather in {city}: {temp_c}C (feels like {feels_like}C), "
                f"{desc}, Humidity: {humidity}%, Wind: {wind} km/h"
            )


# ─── Currency Tool ────────────────────────────────────────────

class CurrencyTool(BaseTool):
    """Convert between currencies using mock exchange rates."""

    name = "convert_currency"
    description = (
        "Convert an amount from one currency to another. "
        "Use this when the user asks to convert money between currencies "
        "like INR to USD, EUR to INR, GBP to INR, etc."
    )
    parameters = {
        "type": "object",
        "properties": {
            "amount": {
                "type": "number",
                "description": "The amount of money to convert",
            },
            "from_currency": {
                "type": "string",
                "description": "Source currency code, e.g. INR, USD, EUR, GBP",
            },
            "to_currency": {
                "type": "string",
                "description": "Target currency code, e.g. INR, USD, EUR, GBP",
            },
        },
        "required": ["amount", "from_currency", "to_currency"],
    }

    # Approximate rates relative to USD (fallback if API fails)
    FALLBACK_RATES: dict[str, float] = {
        "USD": 1.0,
        "INR": 83.5,
        "EUR": 0.92,
        "GBP": 0.79,
        "JPY": 149.5,
        "AED": 3.67,
        "CAD": 1.36,
        "AUD": 1.53,
        "SGD": 1.34,
        "CNY": 7.24,
    }

    async def execute(self, **kwargs) -> str:
        amount = kwargs.get("amount", 0)
        from_curr = kwargs.get("from_currency", "").upper()
        to_curr = kwargs.get("to_currency", "").upper()

        if not from_curr or not to_curr:
            return "Error: from_currency and to_currency are required"
        if amount <= 0:
            return "Error: amount must be positive"

        # Try fetching live rates; fall back to hardcoded rates
        rates = await self._fetch_rates(from_curr)
        if rates and to_curr in rates:
            converted = amount * rates[to_curr]
        else:
            # Fallback to local rates
            if from_curr not in self.FALLBACK_RATES:
                return f"Error: unsupported currency '{from_curr}'"
            if to_curr not in self.FALLBACK_RATES:
                return f"Error: unsupported currency '{to_curr}'"
            # Convert via USD as base
            amount_in_usd = amount / self.FALLBACK_RATES[from_curr]
            converted = amount_in_usd * self.FALLBACK_RATES[to_curr]

        return (
            f"{amount:,.2f} {from_curr} = {converted:,.2f} {to_curr} "
            f"(approximate rate)"
        )

    async def _fetch_rates(self, base: str) -> dict[str, float] | None:
        """Try to fetch live exchange rates. Returns None on failure."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                url = f"https://open.er-api.com/v6/latest/{base}"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("result") == "success":
                        return data.get("rates", {})
        except (httpx.HTTPError, KeyError, ValueError):
            pass
        return None


# ─── Calculator Tool ──────────────────────────────────────────

# Safe operators for math evaluation (NO eval()!)
_SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.FloorDiv: operator.floordiv,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _eval_node(node: ast.AST) -> float:
    """Recursively evaluate an AST node with only safe operations."""
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    elif isinstance(node, ast.BinOp):
        op_func = _SAFE_OPERATORS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        if isinstance(node.op, ast.Pow) and (right > 100 or left > 10000):
            raise ValueError("Power too large — potential denial of service")
        return op_func(left, right)
    elif isinstance(node, ast.UnaryOp):
        op_func = _SAFE_OPERATORS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported unary operator: {type(node.op).__name__}")
        return op_func(_eval_node(node.operand))
    else:
        raise ValueError(f"Unsupported expression element: {type(node).__name__}")


def safe_math_eval(expression: str) -> float:
    """Safely evaluate a math expression using AST parsing.

    Supports: +, -, *, /, //, %, ** (with limits), unary -/+.
    Rejects: function calls, variable access, imports, etc.
    """
    try:
        tree = ast.parse(expression.strip(), mode="eval")
    except SyntaxError as exc:
        raise ValueError(f"Invalid math expression: {exc}") from exc
    return _eval_node(tree.body)


class CalculatorTool(BaseTool):
    """Safe math calculator using AST parsing (no eval)."""

    name = "calculate"
    description = (
        "Perform mathematical calculations. Supports addition, subtraction, "
        "multiplication, division, modulo, floor division, and power. "
        "Use this when the user asks to compute, calculate, or do math."
    )
    parameters = {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "Math expression to evaluate, e.g. '245 * 18' or '50000 / 83.5'",
            }
        },
        "required": ["expression"],
    }

    async def execute(self, **kwargs) -> str:
        expression = kwargs.get("expression", "")
        if not expression:
            return "Error: expression parameter is required"

        try:
            result = safe_math_eval(expression)
            # Format: remove trailing zeros for clean display
            if result == int(result):
                formatted = f"{int(result):,}"
            else:
                formatted = f"{result:,.4f}".rstrip("0").rstrip(".")
            return f"{expression} = {formatted}"
        except (ValueError, ZeroDivisionError, OverflowError) as exc:
            return f"Calculation error: {exc}"


# ─── Search Tool ──────────────────────────────────────────────

class SearchTool(BaseTool):
    """Mock web search tool returning simulated results."""

    name = "web_search"
    description = (
        "Search the web for information on a topic. "
        "Use this when the user asks a factual question that cannot be "
        "answered with the other tools (weather, currency, math, datetime)."
    )
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query, e.g. 'GST rates in India 2024'",
            }
        },
        "required": ["query"],
    }

    async def execute(self, **kwargs) -> str:
        query = kwargs.get("query", "")
        if not query:
            return "Error: query parameter is required"

        # Mock search results — in production, integrate a real search API
        return (
            f"Search results for '{query}':\n"
            f"1. [Mock Result] This is a simulated search result for: {query}. "
            f"In a production system, this would call a real search API "
            f"(Google Custom Search, Bing, or SerpAPI) and return actual results.\n"
            f"2. [Mock Result] Additional information about {query} would appear here.\n"
            f"Note: Search results are simulated. Connect a real search API for live data."
        )


# ─── DateTime Tool ────────────────────────────────────────────

# Indian city timezone offsets from UTC
_INDIAN_TIMEZONE = timezone(timedelta(hours=5, minutes=30))

_CITY_TIMEZONES: dict[str, timezone] = {
    "delhi": _INDIAN_TIMEZONE,
    "mumbai": _INDIAN_TIMEZONE,
    "bangalore": _INDIAN_TIMEZONE,
    "bengaluru": _INDIAN_TIMEZONE,
    "chennai": _INDIAN_TIMEZONE,
    "kolkata": _INDIAN_TIMEZONE,
    "hyderabad": _INDIAN_TIMEZONE,
    "pune": _INDIAN_TIMEZONE,
    "ahmedabad": _INDIAN_TIMEZONE,
    "jaipur": _INDIAN_TIMEZONE,
    "lucknow": _INDIAN_TIMEZONE,
    "new york": timezone(timedelta(hours=-5)),
    "london": timezone(timedelta(hours=0)),
    "tokyo": timezone(timedelta(hours=9)),
    "dubai": timezone(timedelta(hours=4)),
    "singapore": timezone(timedelta(hours=8)),
    "sydney": timezone(timedelta(hours=11)),
    "los angeles": timezone(timedelta(hours=-8)),
}


class DateTimeTool(BaseTool):
    """Get current date and time, with optional timezone for a city."""

    name = "get_datetime"
    description = (
        "Get the current date and time. Optionally specify a city to get "
        "the local time there. Supports major Indian cities and world cities. "
        "Use this when the user asks about the current time, date, or day."
    )
    parameters = {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "Optional city name for local time, e.g. 'Mumbai', 'New York'",
            }
        },
        "required": [],
    }

    async def execute(self, **kwargs) -> str:
        city = kwargs.get("city", "").strip()

        if city:
            tz = _CITY_TIMEZONES.get(city.lower())
            if tz is None:
                # Default to IST for unrecognized Indian-sounding cities
                tz = _INDIAN_TIMEZONE
            now = datetime.now(tz)
            offset_str = now.strftime("%z")
            return (
                f"Current date and time in {city}: "
                f"{now.strftime('%A, %d %B %Y, %I:%M %p')} "
                f"(UTC{offset_str[:3]}:{offset_str[3:]})"
            )
        else:
            now = datetime.now(_INDIAN_TIMEZONE)
            return (
                f"Current date and time (IST): "
                f"{now.strftime('%A, %d %B %Y, %I:%M %p')} "
                f"(UTC+05:30)"
            )


# ─── Tool Registry ────────────────────────────────────────────

class ToolRegistry:
    """Central registry for all available tools."""

    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        """Register a tool by its name."""
        self._tools[tool.name] = tool

    def get(self, name: str) -> BaseTool | None:
        """Get a tool by name. Returns None if not found."""
        return self._tools.get(name)

    def get_all_declarations(self) -> list[dict]:
        """Get function declarations for all registered tools (for Gemini)."""
        return [tool.get_declaration() for tool in self._tools.values()]

    def list_tools(self) -> list[str]:
        """List all registered tool names."""
        return list(self._tools.keys())

    def __len__(self) -> int:
        return len(self._tools)

    def __contains__(self, name: str) -> bool:
        return name in self._tools


def create_default_tools() -> ToolRegistry:
    """Create a ToolRegistry with all built-in tools registered."""
    registry = ToolRegistry()
    registry.register(WeatherTool())
    registry.register(CurrencyTool())
    registry.register(CalculatorTool())
    registry.register(SearchTool())
    registry.register(DateTimeTool())
    return registry
