# ============================================================
# GyanSetu — Document Loader
# ============================================================
# Loads text content from uploaded files (txt, md).
# Handles encoding detection for Indian language documents.
# ============================================================

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Supported file extensions
SUPPORTED_EXTENSIONS = {".txt", ".md"}


class DocumentLoadError(Exception):
    """Raised when a document cannot be loaded."""
    pass


class DocumentLoader:
    """
    Loads text content from various file formats.

    Supports .txt and .md files with automatic encoding detection.
    Handles UTF-8, UTF-8-BOM, and Latin-1 encodings commonly found
    in Indian government and education documents.
    """

    def validate_extension(self, filename: str) -> str:
        """
        Check if the file extension is supported.

        Returns the extension if valid, raises DocumentLoadError otherwise.
        """
        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise DocumentLoadError(
                f"Unsupported file type: '{ext}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            )
        return ext

    def load(self, filename: str, content: bytes) -> str:
        """
        Load and decode text content from raw file bytes.

        Args:
            filename: Original filename (used for extension check).
            content: Raw bytes of the uploaded file.

        Returns:
            Decoded text content as a string.

        Raises:
            DocumentLoadError: If file type is unsupported or decoding fails.
        """
        self.validate_extension(filename)

        # Try multiple encodings (Indian docs often have encoding issues)
        encodings = ["utf-8", "utf-8-sig", "latin-1"]
        for encoding in encodings:
            try:
                text = content.decode(encoding)
                logger.info(
                    "Loaded %s (%d bytes, encoding=%s)",
                    filename,
                    len(content),
                    encoding,
                )
                return self._clean_text(text)
            except UnicodeDecodeError:
                continue

        raise DocumentLoadError(
            f"Could not decode '{filename}' with any supported encoding "
            f"({', '.join(encodings)})"
        )

    @staticmethod
    def _clean_text(text: str) -> str:
        """Basic text cleaning: normalize whitespace, strip edges."""
        # Replace tabs with spaces
        text = text.replace("\t", "    ")
        # Remove excessive blank lines (keep max 2)
        lines = text.split("\n")
        cleaned_lines: list[str] = []
        blank_count = 0
        for line in lines:
            if line.strip() == "":
                blank_count += 1
                if blank_count <= 2:
                    cleaned_lines.append("")
            else:
                blank_count = 0
                cleaned_lines.append(line)

        return "\n".join(cleaned_lines).strip()
