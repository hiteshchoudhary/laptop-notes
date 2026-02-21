# ============================================================
# GyanSetu — Configuration (pydantic-settings)
# ============================================================
# All configuration is loaded from environment variables or .env file.
# Single source of truth for API keys, paths, and tuning parameters.
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
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"

    # --- ChromaDB ---
    CHROMA_PERSIST_PATH: str = "./chroma_data"
    CHROMA_COLLECTION_NAME: str = "gyansetu_chunks"

    # --- Chunking ---
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    DEFAULT_CHUNK_STRATEGY: str = "sentence"  # fixed, sentence, paragraph

    # --- Retrieval ---
    DEFAULT_N_RESULTS: int = 5
    MAX_N_RESULTS: int = 20

    # --- Database (metadata tracking) ---
    DATABASE_URL: str = "sqlite:///./gyansetu.db"

    # --- File Uploads ---
    ALLOWED_EXTENSIONS: list[str] = [".txt", ".md"]
    MAX_FILE_SIZE_MB: int = 50

    # --- App ---
    APP_NAME: str = "GyanSetu"
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
