# ============================================================
# ChitraVarnan — SQLite Cache Service
# ============================================================
# Caches image analysis results keyed by image hash + mode.
# Avoids redundant (and expensive) Gemini API calls.
# ============================================================

import json
import logging
import sqlite3
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CacheService:
    """
    SQLite-based cache for image analysis results.

    Keys: SHA-256 hash of raw image bytes + analysis mode.
    Values: JSON-serialized analysis results.
    TTL: Configurable, default 24 hours.
    """

    def __init__(self, db_path: str = "cache.db", ttl_hours: int = 24):
        self.db_path = db_path
        self.ttl = timedelta(hours=ttl_hours)
        self._init_db()

    def _init_db(self) -> None:
        """Create the cache table if it does not exist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analysis_cache (
                    image_hash TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    analysis_id TEXT NOT NULL,
                    result_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (image_hash, mode)
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_cache_id
                ON analysis_cache (analysis_id)
            """)
            conn.commit()
        logger.info("Cache database initialized at %s", self.db_path)

    def get(self, image_hash: str, mode: str) -> dict | None:
        """
        Retrieve a cached result by image hash and mode.

        Returns None if not found or expired.
        """
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT result_json, created_at FROM analysis_cache "
                "WHERE image_hash = ? AND mode = ?",
                (image_hash, mode),
            ).fetchone()

        if row is None:
            return None

        created = datetime.fromisoformat(row[1])
        if datetime.utcnow() - created > self.ttl:
            logger.debug("Cache entry expired for hash=%s mode=%s", image_hash, mode)
            return None

        logger.debug("Cache HIT for hash=%s mode=%s", image_hash, mode)
        return json.loads(row[0])

    def get_by_id(self, analysis_id: str) -> dict | None:
        """Retrieve a cached result by analysis ID."""
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT result_json FROM analysis_cache WHERE analysis_id = ?",
                (analysis_id,),
            ).fetchone()

        if row is None:
            return None

        return json.loads(row[0])

    def store(
        self,
        image_hash: str,
        mode: str,
        analysis_id: str,
        result: dict,
    ) -> None:
        """Store an analysis result in the cache."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO analysis_cache "
                "(image_hash, mode, analysis_id, result_json, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    image_hash,
                    mode,
                    analysis_id,
                    json.dumps(result),
                    datetime.utcnow().isoformat(),
                ),
            )
            conn.commit()
        logger.debug("Cached result for hash=%s mode=%s", image_hash, mode)

    def get_stats(self) -> dict:
        """Return cache statistics."""
        with sqlite3.connect(self.db_path) as conn:
            total = conn.execute(
                "SELECT COUNT(*) FROM analysis_cache"
            ).fetchone()[0]

            cutoff = (datetime.utcnow() - self.ttl).isoformat()
            expired = conn.execute(
                "SELECT COUNT(*) FROM analysis_cache WHERE created_at < ?",
                (cutoff,),
            ).fetchone()[0]

        return {
            "total_cached": total,
            "expired": expired,
            "active": total - expired,
        }

    def clear_expired(self) -> int:
        """Delete expired cache entries. Returns count of deleted rows."""
        cutoff = (datetime.utcnow() - self.ttl).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "DELETE FROM analysis_cache WHERE created_at < ?",
                (cutoff,),
            )
            conn.commit()
            deleted = cursor.rowcount

        logger.info("Cleared %d expired cache entries", deleted)
        return deleted
