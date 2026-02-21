# ============================================================
# ChitraVarnan — Gemini Vision Service
# ============================================================
# Handles all interactions with Google's Gemini Vision API.
# Each analysis mode has its own prompt and parser.
# ============================================================

import json
import logging
import re
import time

from PIL import Image

from models import (
    AnalysisMode,
    ImageAnalysis,
    ModerationResult,
    OCRResult,
    TagResult,
)

logger = logging.getLogger(__name__)

# ============================================================
# Prompts for each analysis mode
# ============================================================

DESCRIBE_PROMPT = """Describe this image in detail. Focus on:
- What the image contains (objects, people, scenes)
- Colors, textures, and visual style
- Any text visible in the image
- The likely context or purpose of the image

Provide a clear, detailed description in 2-3 sentences."""

TAG_PROMPT = """Analyze this image and return ONLY a JSON object with:
{
  "tags": ["list", "of", "relevant", "keywords"],
  "categories": ["broad", "categories"],
  "confidence": 0.95
}
Include at least 5 tags and 2 categories. Return ONLY valid JSON, no explanation, no markdown fences."""

OCR_PROMPT = """Extract ALL text visible in this image. Return ONLY a JSON object:
{
  "extracted_text": "all text found in the image, preserving line breaks",
  "language": "detected language code (en, hi, ta, etc.)",
  "confidence": 0.90
}
If no text is found, set extracted_text to "" and confidence to 0.0.
Return ONLY valid JSON, no explanation, no markdown fences."""

MODERATE_PROMPT = """Evaluate this image for content safety. Return ONLY a JSON object:
{
  "is_safe": true,
  "categories": {
    "violence": 0.01,
    "adult": 0.02,
    "hate": 0.00,
    "self_harm": 0.00,
    "dangerous": 0.00
  },
  "reason": ""
}
Scores are 0.0 (not present) to 1.0 (definitely present).
Set is_safe to false if any category exceeds 0.5.
Return ONLY valid JSON, no explanation, no markdown fences."""

FULL_PROMPT = """Analyze this image comprehensively. Return ONLY a JSON object with:
{
  "description": "2-3 sentence description of the image",
  "tags": {
    "tags": ["keyword1", "keyword2", "keyword3"],
    "categories": ["category1", "category2"],
    "confidence": 0.90
  },
  "ocr": {
    "extracted_text": "any text found in the image",
    "language": "en",
    "confidence": 0.85
  },
  "moderation": {
    "is_safe": true,
    "categories": {"violence": 0.0, "adult": 0.0, "hate": 0.0},
    "reason": ""
  }
}
Return ONLY valid JSON, no explanation, no markdown fences."""


# ============================================================
# Service Class
# ============================================================

class GeminiVisionService:
    """
    Handles all image analysis via Gemini Vision API.

    Usage:
        service = GeminiVisionService(api_key="your-key")
        result = service.analyze(image, "full", analysis_id, filename)
    """

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        """Initialize the Gemini model. Deferred import to avoid issues if
        google-generativeai is not installed during py_compile."""
        self.api_key = api_key
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        """Lazy-load the Gemini model on first use."""
        if self._model is None:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
        return self._model

    def analyze(
        self,
        image: Image.Image,
        mode: AnalysisMode,
        analysis_id: str,
        filename: str,
    ) -> ImageAnalysis:
        """
        Analyze an image using the specified mode.

        Args:
            image: PIL Image object to analyze.
            mode: One of describe, tag, ocr, moderate, full.
            analysis_id: Unique ID for this analysis.
            filename: Original filename.

        Returns:
            ImageAnalysis with structured results.
        """
        start = time.time()

        handlers = {
            AnalysisMode.DESCRIBE: self._describe,
            AnalysisMode.TAG: self._tag,
            AnalysisMode.OCR: self._ocr,
            AnalysisMode.MODERATE: self._moderate,
            AnalysisMode.FULL: self._full_analysis,
        }

        handler = handlers[mode]
        result_data = handler(image)

        elapsed_ms = (time.time() - start) * 1000

        return ImageAnalysis(
            id=analysis_id,
            filename=filename,
            description=result_data.get("description", ""),
            tags=TagResult(**result_data["tags"]) if result_data.get("tags") else None,
            ocr=OCRResult(**result_data["ocr"]) if result_data.get("ocr") else None,
            moderation=(
                ModerationResult(**result_data["moderation"])
                if result_data.get("moderation")
                else None
            ),
            mode=mode,
            model_used=self.model_name,
            processing_time_ms=round(elapsed_ms, 2),
        )

    # --------------------------------------------------------
    # Private analysis methods
    # --------------------------------------------------------

    def _describe(self, image: Image.Image) -> dict:
        """Generate a natural language description of the image."""
        model = self._get_model()
        response = model.generate_content([DESCRIBE_PROMPT, image])
        return {"description": response.text.strip()}

    def _tag(self, image: Image.Image) -> dict:
        """Extract tags and categories from the image."""
        model = self._get_model()
        response = model.generate_content([TAG_PROMPT, image])
        parsed = self._parse_json(response.text)
        return {"tags": parsed}

    def _ocr(self, image: Image.Image) -> dict:
        """Extract text from the image (OCR)."""
        model = self._get_model()
        response = model.generate_content([OCR_PROMPT, image])
        parsed = self._parse_json(response.text)
        return {"ocr": parsed}

    def _moderate(self, image: Image.Image) -> dict:
        """Evaluate image content safety."""
        model = self._get_model()
        response = model.generate_content([MODERATE_PROMPT, image])
        parsed = self._parse_json(response.text)
        return {"moderation": parsed}

    def _full_analysis(self, image: Image.Image) -> dict:
        """Run all analysis modes on the image."""
        model = self._get_model()
        response = model.generate_content([FULL_PROMPT, image])
        parsed = self._parse_json(response.text)
        return parsed

    # --------------------------------------------------------
    # JSON parsing with fallback
    # --------------------------------------------------------

    @staticmethod
    def _parse_json(text: str) -> dict:
        """
        Parse JSON from Gemini's response. Handles markdown fences and
        other formatting Gemini sometimes adds despite instructions.
        """
        # Try direct parsing first
        cleaned = text.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code fences
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", cleaned, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try finding the first { ... } block
        brace_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        logger.warning("Failed to parse Gemini response as JSON: %s", cleaned[:200])
        return {}
