import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./smartskin.db"
    secret_key: str  # REQUIRED: set SECRET_KEY in .env
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_path: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "models",
        "skin_model.keras",
    )
    class_labels_path: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "models",
        "class_labels.json",
    )
    confidence_threshold: float = 0.60
    max_upload_size_mb: int = 5
    image_size: int = 224
    upload_dir: str = "./uploads"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        protected_namespaces = ("settings_",)

    @property
    def cors_origin_list(self):
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

if len(settings.secret_key) < 32 or "change" in settings.secret_key.lower():
    raise RuntimeError(
        "SECRET_KEY must be set in .env to a random string of 32+ characters "
        '(generate: python -c "import secrets;print(secrets.token_hex(32))").'
    )

os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(os.path.dirname(settings.model_path) or ".", exist_ok=True)
