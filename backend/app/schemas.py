from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------- Auth ----------

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Prediction ----------

class TopPrediction(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    id: int
    prediction: str
    confidence: float
    top_predictions: List[TopPrediction]
    image_url: str
    low_confidence: bool
    model_version: str
    inference_ms: Optional[float] = None
    disclaimer: str
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionHistoryItem(BaseModel):
    id: int
    prediction: str
    confidence: float
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Skincare ----------

class SkincareInfo(BaseModel):
    condition: str
    about: str
    common_characteristics: List[str]
    general_causes: List[str]
    general_prevention: List[str]
    morning: List[str]
    evening: List[str]
    general_tips: List[str]


class PreferencesRequest(BaseModel):
    skin_type: str = "Unknown"
    sun_exposure: str = "Medium"
    routine_preferences: List[str] = []


class PreferencesOut(BaseModel):
    skin_type: str
    sun_exposure: str
    routine_preferences: List[str]

    class Config:
        from_attributes = True


class RoutineResponse(BaseModel):
    morning: List[str]
    afternoon: List[str]
    evening: List[str]
    personalized_note: Optional[str] = None


# ---------- Health / Admin ----------

class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool


class ModelStatus(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_loaded: bool
    load_error: Optional[str] = None
    model_version: str
    training_report: Optional[dict] = None
    metrics: Optional[dict] = None
    model_path: str
    num_classes: int
    class_labels: List[str]
    image_size: int
    confidence_threshold: float
