"""
SahayakAI Configuration
-----------------------
All settings are loaded from environment variables or .env file.
pydantic-settings handles the priority: env vars > .env > defaults.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "SahayakAI"
    DEBUG: bool = True

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Database
    DB_PATH: str = "data/sahayak.db"

    # Agent
    TOOL_TIMEOUT: int = 15
    MAX_HISTORY_MESSAGES: int = 20

    # System prompt for the agent
    SYSTEM_PROMPT: str = (
        "You are SahayakAI, an intelligent assistant for Indian small businesses.\n\n"
        "Your behavior:\n"
        "- Always respond in a helpful, concise manner\n"
        "- When the user asks about weather, currency, calculations, or current "
        "date/time, USE the available tools. Do not guess or make up data.\n"
        "- If a tool call fails, inform the user honestly and suggest alternatives\n"
        "- You can handle multiple requests in one message — use parallel tool calls\n"
        "- Format currency amounts with proper symbols (Rs., $, etc.)\n"
        "- Use the metric system (Celsius, kilometers)\n"
        "- When unsure, ask for clarification rather than guessing\n\n"
        "Your limitations:\n"
        "- You cannot browse the internet freely — only use the provided tools\n"
        "- You cannot remember information between separate conversations\n"
        "- You cannot perform actions outside your tool set\n\n"
        "Tone: Professional but warm, like a knowledgeable shop assistant.\n"
        "Language: Respond in the same language the user writes in."
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Singleton settings instance
settings = Settings()
