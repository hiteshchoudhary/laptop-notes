# ============================================================
# ChitraVarnan — Analysis Routes
# ============================================================
# Endpoints for single image analysis, batch analysis, and
# retrieving previous results by ID.
# ============================================================

import logging
import uuid

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from config import settings
from models import AnalysisMode, ImageAnalysis
from services.cache import CacheService
from services.gemini_vision import GeminiVisionService
from services.image_processor import ImageProcessor, ImageProcessingError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# --- Service instances ---
image_processor = ImageProcessor(
    max_size_mb=settings.MAX_IMAGE_SIZE_MB,
    max_dimension=settings.MAX_IMAGE_DIMENSION,
    allowed_types=settings.ALLOWED_CONTENT_TYPES,
)

vision_service = GeminiVisionService(
    api_key=settings.GEMINI_API_KEY,
    model_name=settings.GEMINI_MODEL,
)

cache_service = CacheService(
    db_path=settings.CACHE_DB_PATH,
    ttl_hours=settings.CACHE_TTL_HOURS,
)


# ============================================================
# POST /analyze — Single image analysis
# ============================================================
@router.post("", response_model=ImageAnalysis)
async def analyze_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, or WebP)"),
    mode: AnalysisMode = Query(
        default=AnalysisMode.FULL,
        description="Analysis mode: describe, tag, ocr, moderate, or full",
    ),
) -> ImageAnalysis:
    """
    Analyze a single image using Gemini Vision.

    Upload an image and specify an analysis mode:
    - **describe**: Natural language description
    - **tag**: Keywords and categories
    - **ocr**: Extract text from the image
    - **moderate**: Content safety check
    - **full**: All of the above
    """
    analysis_id = str(uuid.uuid4())

    # Read file content
    file_content = await file.read()

    # Validate and process the image
    try:
        processed = await image_processor.process(
            file_content=file_content,
            content_type=file.content_type,
            filename=file.filename or "unknown",
        )
    except ImageProcessingError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check cache
    cached_result = cache_service.get(processed.hash, mode.value)
    if cached_result is not None:
        logger.info("Cache hit for %s (mode=%s)", processed.hash[:12], mode.value)
        # Update ID and cached flag for this request
        cached_result["id"] = analysis_id
        cached_result["cached"] = True
        return ImageAnalysis(**cached_result)

    # Analyze with Gemini
    try:
        result = vision_service.analyze(
            image=processed.image,
            mode=mode,
            analysis_id=analysis_id,
            filename=processed.original_filename,
        )
    except Exception as e:
        logger.error("Gemini analysis failed: %s", str(e))
        raise HTTPException(status_code=503, detail=f"AI analysis failed: {str(e)}")

    # Cache the result
    cache_service.store(
        image_hash=processed.hash,
        mode=mode.value,
        analysis_id=analysis_id,
        result=result.model_dump(),
    )

    return result


# ============================================================
# POST /analyze/batch — Batch image analysis
# ============================================================
@router.post("/batch", response_model=list[ImageAnalysis])
async def analyze_batch(
    files: list[UploadFile] = File(
        ..., description="Up to 10 images to analyze"
    ),
    mode: AnalysisMode = Query(
        default=AnalysisMode.TAG,
        description="Analysis mode applied to all images",
    ),
) -> list[ImageAnalysis]:
    """
    Analyze multiple images in a single request.

    Maximum 10 images per batch. Each image goes through the same
    validation, caching, and analysis pipeline as single analysis.
    Results are returned in the same order as uploaded files.
    """
    if len(files) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_BATCH_SIZE} images per batch",
        )

    results: list[ImageAnalysis] = []

    for file in files:
        analysis_id = str(uuid.uuid4())
        file_content = await file.read()

        # Validate
        try:
            processed = await image_processor.process(
                file_content=file_content,
                content_type=file.content_type,
                filename=file.filename or "unknown",
            )
        except ImageProcessingError as e:
            # For batch, include an error result instead of failing everything
            logger.warning("Skipping invalid image %s: %s", file.filename, str(e))
            continue

        # Check cache
        cached_result = cache_service.get(processed.hash, mode.value)
        if cached_result is not None:
            cached_result["id"] = analysis_id
            cached_result["cached"] = True
            results.append(ImageAnalysis(**cached_result))
            continue

        # Analyze
        try:
            result = vision_service.analyze(
                image=processed.image,
                mode=mode,
                analysis_id=analysis_id,
                filename=processed.original_filename,
            )
            cache_service.store(
                image_hash=processed.hash,
                mode=mode.value,
                analysis_id=analysis_id,
                result=result.model_dump(),
            )
            results.append(result)
        except Exception as e:
            logger.error("Analysis failed for %s: %s", file.filename, str(e))
            continue

    return results


# ============================================================
# GET /analyze/{analysis_id} — Retrieve previous result
# ============================================================
@router.get("/{analysis_id}", response_model=ImageAnalysis)
async def get_analysis(analysis_id: str) -> ImageAnalysis:
    """
    Retrieve a previous analysis result by its ID.

    Analysis results are cached in SQLite and available until the
    cache TTL expires (default: 24 hours).
    """
    result = cache_service.get_by_id(analysis_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis {analysis_id} not found or expired",
        )
    return ImageAnalysis(**result)
