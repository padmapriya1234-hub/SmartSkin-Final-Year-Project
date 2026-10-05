from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("Prediction", back_populates="owner", cascade="all, delete-orphan")
    preferences = relationship("SkincarePreference", back_populates="owner", uselist=False, cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String, nullable=False)
    prediction = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    top_predictions = Column(Text, nullable=False)  # JSON-encoded list
    model_version = Column(String, default="unknown")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="predictions")


class SkincarePreference(Base):
    __tablename__ = "skincare_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    skin_type = Column(String, default="Unknown")
    sun_exposure = Column(String, default="Medium")
    routine_preferences = Column(Text, default="[]")  # JSON-encoded list
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="preferences")
