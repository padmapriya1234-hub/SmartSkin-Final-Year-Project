import os
import uuid
from typing import Tuple

import numpy as np
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.config import settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _safe_filename(original_name: str) -> str:
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    return f"{uuid.uuid4().hex}{ext}"


async def validate_and_save_upload(file: UploadFile) -> Tuple[str, str]:
    """
    Validates file type/size/integrity, saves it, and returns (disk_path, public_url).
    Raises HTTPException with a friendly message on any validation failure.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPG, PNG, or WEBP image.",
        )

    contents = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty. Please choose an image.")
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Image is too large. Maximum allowed size is {settings.max_upload_size_mb}MB.",
        )

    # Verify it's a real, non-corrupted image
    import io
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
        img = Image.open(io.BytesIO(contents))  # reopen after verify() invalidates the file pointer
        img = img.convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="We couldn't read this image. Please upload a clear JPG or PNG image and try again.",
        )

    filename = _safe_filename(file.filename or "upload.jpg")
    disk_path = os.path.join(settings.upload_dir, filename)
    img.save(disk_path)

    public_url = f"/uploads/{filename}"
    return disk_path, public_url


def preprocess_image(disk_path: str, target_size: int) -> np.ndarray:
    """
    Loads an image from disk, resizes/normalizes it, and returns a batched
    float32 tensor (1, size, size, 3) of RGB values in 0-255 (the model normalises internally).
    """
    img = Image.open(disk_path).convert("RGB")
    img = img.resize((target_size, target_size))
    arr = np.asarray(img, dtype=np.float32)
    return np.expand_dims(arr, axis=0)
