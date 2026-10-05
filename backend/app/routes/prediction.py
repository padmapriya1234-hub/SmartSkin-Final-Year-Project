import json
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.services.image_service import validate_and_save_upload
from app.services.model_service import ModelNotLoadedError, model_service

router = APIRouter(prefix="/api", tags=["prediction"])

DISCLAIMER = (
    "AI screening result only. This tool is for educational and preliminary "
    "screening purposes and is not a medical diagnosis. Consult a qualified "
    "dermatologist or healthcare professional for diagnosis and treatment."
)


@router.post("/predict", response_model=schemas.PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disk_path, public_url = await validate_and_save_upload(file)

    try:
        label, confidence, top3, ms = model_service.predict(disk_path)
    except ModelNotLoadedError:
        os.remove(disk_path)
        raise HTTPException(
            status_code=503,
            detail="No trained model is loaded on the server. An administrator must run train.py first.",
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="We couldn't analyze this image right now. Please try again shortly.",
        )

    record = models.Prediction(
        user_id=current_user.id,
        image_path=public_url,
        prediction=label,
        confidence=confidence,
        top_predictions=json.dumps(top3),
        model_version=model_service.model_version,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return schemas.PredictionResponse(
        id=record.id,
        prediction=label,
        confidence=confidence,
        top_predictions=top3,
        image_url=public_url,
        low_confidence=confidence < settings.confidence_threshold,
        model_version=model_service.model_version,
        inference_ms=ms,
        disclaimer=DISCLAIMER,
        created_at=record.created_at,
    )


@router.get("/predictions", response_model=list[schemas.PredictionHistoryItem])
def list_predictions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    condition: str | None = None,
):
    query = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id)
    if condition:
        query = query.filter(models.Prediction.prediction == condition)
    records = query.order_by(models.Prediction.created_at.desc()).offset(skip).limit(limit).all()
    return [
        schemas.PredictionHistoryItem(
            id=r.id, prediction=r.prediction, confidence=r.confidence,
            image_url=r.image_path, created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/predictions/{prediction_id}", response_model=schemas.PredictionResponse)
def get_prediction(
    prediction_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id,
        models.Prediction.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    top3 = json.loads(record.top_predictions)
    return schemas.PredictionResponse(
        id=record.id,
        prediction=record.prediction,
        confidence=record.confidence,
        top_predictions=top3,
        image_url=record.image_path,
        low_confidence=record.confidence < settings.confidence_threshold,
        model_version=record.model_version or "unknown",
        disclaimer=DISCLAIMER,
        created_at=record.created_at,
    )


@router.delete("/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id,
        models.Prediction.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    db.delete(record)
    db.commit()
    return {"message": "Prediction deleted."}
