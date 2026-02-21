# ============================================================
# ChitraVarnan — Image Processor
# ============================================================
# Validates, resizes, and converts uploaded images.
# Ensures only safe, properly-sized images reach the AI model.
# ============================================================

import hashlib
import io
import logging

from PIL import Image

logger = logging.getLogger(__name__)

# Magic bytes for supported image formats
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",  # WebP starts with RIFF...WEBP
}


class ProcessedImage:
    """Container for a validated and processed image."""

    def __init__(
        self,
        image: Image.Image,
        image_bytes: bytes,
        content_type: str,
        original_filename: str,
    ):
        self.image = image
        self.image_bytes = image_bytes
        self.content_type = content_type
        self.original_filename = original_filename
        self.hash = hashlib.sha256(image_bytes).hexdigest()
        self.width = image.width
        self.height = image.height


class ImageProcessingError(Exception):
    """Raised when image validation or processing fails."""
    pass


class ImageProcessor:
    """
    Validates and processes uploaded images before AI analysis.

    Performs three-layer validation:
    1. Content-Type header check
    2. Magic bytes verification
    3. Pillow parsing test
    """

    def __init__(
        self,
        max_size_mb: int = 10,
        max_dimension: int = 4096,
        allowed_types: list[str] | None = None,
    ):
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.max_dimension = max_dimension
        self.allowed_types = allowed_types or [
            "image/jpeg",
            "image/png",
            "image/webp",
        ]

    async def process(
        self,
        file_content: bytes,
        content_type: str | None,
        filename: str,
    ) -> ProcessedImage:
        """
        Validate and process an uploaded image.

        Args:
            file_content: Raw bytes of the uploaded file.
            content_type: MIME type from the upload header.
            filename: Original filename.

        Returns:
            ProcessedImage with validated PIL Image and metadata.

        Raises:
            ImageProcessingError: If validation fails at any stage.
        """
        # --- Step 1: Check file size ---
        if len(file_content) > self.max_size_bytes:
            max_mb = self.max_size_bytes // (1024 * 1024)
            raise ImageProcessingError(
                f"Image size exceeds {max_mb} MB limit"
            )

        # --- Step 2: Check Content-Type ---
        if content_type and content_type not in self.allowed_types:
            raise ImageProcessingError(
                f"Unsupported content type: {content_type}. "
                f"Allowed: {', '.join(self.allowed_types)}"
            )

        # --- Step 3: Check magic bytes ---
        detected_type = self._check_magic_bytes(file_content)
        if detected_type is None:
            raise ImageProcessingError(
                "File does not appear to be a valid image (magic bytes check failed)"
            )

        # --- Step 4: Try opening with Pillow ---
        try:
            image = Image.open(io.BytesIO(file_content))
            image.verify()  # Verify it's not corrupt
            # Re-open after verify (verify closes the image)
            image = Image.open(io.BytesIO(file_content))
        except Exception as e:
            raise ImageProcessingError(
                f"Cannot parse image file: {str(e)}"
            )

        # --- Step 5: Resize if too large ---
        image = self._resize_if_needed(image)

        # --- Step 6: Convert to RGB if needed (for JPEG compat) ---
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")

        logger.info(
            "Processed image: %s (%dx%d, %s)",
            filename,
            image.width,
            image.height,
            detected_type,
        )

        return ProcessedImage(
            image=image,
            image_bytes=file_content,
            content_type=detected_type,
            original_filename=filename,
        )

    def _check_magic_bytes(self, data: bytes) -> str | None:
        """Check the first few bytes to detect the real file format."""
        for magic, mime_type in MAGIC_BYTES.items():
            if data[:len(magic)] == magic:
                return mime_type
        return None

    def _resize_if_needed(self, image: Image.Image) -> Image.Image:
        """Resize image if any dimension exceeds max_dimension."""
        if (
            image.width <= self.max_dimension
            and image.height <= self.max_dimension
        ):
            return image

        ratio = min(
            self.max_dimension / image.width,
            self.max_dimension / image.height,
        )
        new_width = int(image.width * ratio)
        new_height = int(image.height * ratio)

        logger.info(
            "Resizing image from %dx%d to %dx%d",
            image.width,
            image.height,
            new_width,
            new_height,
        )

        return image.resize((new_width, new_height), Image.LANCZOS)
