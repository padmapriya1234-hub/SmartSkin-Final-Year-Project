from fastapi import APIRouter, Depends

from app import models, schemas
from app.auth import get_current_user
from app.config import settings
from app.services.model_service import model_service

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/health", response_model=schemas.HealthResponse)
def health():
    return schemas.HealthResponse(status="healthy", model_loaded=model_service.is_loaded())


@router.get("/admin/model-status", response_model=schemas.ModelStatus)
def model_status(_user: models.User = Depends(get_current_user)):
    info = model_service.training_report()
    return schemas.ModelStatus(
        model_loaded=model_service.is_loaded(),
        load_error=model_service.load_error,
        model_version=model_service.model_version,
        training_report=info["training_report"],
        metrics=info["metrics"],
        model_path=settings.model_path,
        num_classes=len(model_service.class_labels),
        class_labels=model_service.class_labels,
        image_size=settings.image_size,
        confidence_threshold=settings.confidence_threshold,
    )
