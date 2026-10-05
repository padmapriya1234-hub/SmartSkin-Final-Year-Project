import io
import os
import sys

import pytest
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["DATABASE_URL"] = "sqlite:///./test_smartskin.db"
os.environ["UPLOAD_DIR"] = "./test_uploads"
os.environ["SECRET_KEY"] = "test-only-secret-0123456789abcdef0123456789abcdef"

from app.main import app  # noqa: E402
from app.database import init_db, engine, Base  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    os.makedirs("./test_uploads", exist_ok=True)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def sample_image_bytes():
    img = Image.new("RGB", (300, 300), color=(200, 150, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


@pytest.fixture()
def registered_user_token(client):
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test.user@example.com",
        "password": "SecurePass123",
        "confirm_password": "SecurePass123",
    })
    resp = client.post("/api/auth/login", json={
        "email": "test.user@example.com",
        "password": "SecurePass123",
    })
    return resp.json()["access_token"]


class FakeKerasModel:
    """TEST DOUBLE ONLY - lets API tests exercise routing/DB/threshold logic without TensorFlow.
    It is never used by the application; real predictions come from train.py's skin_model.keras."""
    output_shape = (None, 4)

    def __init__(self, probs):
        self.probs = probs

    def predict(self, tensor, verbose=0):
        import numpy as np
        assert tensor.shape == (1, 224, 224, 3) and tensor.max() > 1.0  # raw 0-255 RGB contract
        return np.array([self.probs])


@pytest.fixture()
def loaded_model(monkeypatch):
    from app.services.model_service import model_service

    def _install(probs):
        monkeypatch.setattr(model_service, "model", FakeKerasModel(probs))
        monkeypatch.setattr(model_service, "class_labels", ["ClassA", "ClassB", "ClassC", "ClassD"])
    return _install
