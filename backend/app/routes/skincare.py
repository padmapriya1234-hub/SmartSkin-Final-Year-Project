import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.services.recommendation_service import get_condition_info, build_routine

router = APIRouter(prefix="/api/skincare", tags=["skincare"])


@router.get("/{condition}", response_model=schemas.SkincareInfo)
def skincare_for_condition(condition: str):
    return get_condition_info(condition)


@router.post("/preferences", response_model=schemas.PreferencesOut)
def save_preferences(
    payload: schemas.PreferencesRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(models.SkincarePreference).filter(
        models.SkincarePreference.user_id == current_user.id
    ).first()
    if not pref:
        pref = models.SkincarePreference(user_id=current_user.id)
        db.add(pref)

    pref.skin_type = payload.skin_type
    pref.sun_exposure = payload.sun_exposure
    pref.routine_preferences = json.dumps(payload.routine_preferences)
    db.commit()
    db.refresh(pref)

    return schemas.PreferencesOut(
        skin_type=pref.skin_type,
        sun_exposure=pref.sun_exposure,
        routine_preferences=json.loads(pref.routine_preferences),
    )


@router.get("/routine/get", response_model=schemas.RoutineResponse)
def get_routine(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(models.SkincarePreference).filter(
        models.SkincarePreference.user_id == current_user.id
    ).first()
    if pref:
        prefs_list = json.loads(pref.routine_preferences)
        return build_routine(pref.skin_type, pref.sun_exposure, prefs_list)
    return build_routine()
