# ============================================================
# ChitraVarnan — Configuration (pydantic-settings)
# ============================================================
# All configuration is loaded from environment variables or .env file.
# This single source of truth prevents hardcoded API keys.
# ============================================================

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    In production, these come from actual env vars or a secrets manager.
    In development, they're loaded from a .env file.
    """

    # --- Gemini AI ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # --- Image Processing ---
    MAX_IMAGE_SIZE_MB: int = 10
    ALLOWED_CONTENT_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]
    MAX_IMAGE_DIMENSION: int = 4096  # Resize if larger than this
    THUMBNAIL_SIZE: int = 256

    # --- Caching ---
    CACHE_DB_PATH: str = "cache.db"
    CACHE_TTL_HOURS: int = 24

    # --- Rate Limiting ---
    RATE_LIMIT_RPM: int = 15  # Requests per minute to Gemini
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # --- Batch ---
    MAX_BATCH_SIZE: int = 10

    # --- App ---
    APP_NAME: str = "ChitraVarnan"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton — import this everywhere
settings = Settings()
