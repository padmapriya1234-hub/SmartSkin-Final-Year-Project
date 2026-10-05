import io


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_predict_requires_auth(client, sample_image_bytes):
    resp = client.post(
        "/api/predict",
        files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
    )
    assert resp.status_code == 401


def test_predict_success(client, registered_user_token, sample_image_bytes, loaded_model):
    loaded_model([0.7, 0.2, 0.06, 0.04])
    resp = client.post(
        "/api/predict",
        files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
        headers=auth_headers(registered_user_token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["prediction"]
    assert 0 <= body["confidence"] <= 1
    assert len(body["top_predictions"]) == 3
    assert "not a medical diagnosis" in body["disclaimer"]
    assert body["prediction"] == "ClassA" and body["low_confidence"] is False
    assert [t["label"] for t in body["top_predictions"]] == ["ClassA", "ClassB", "ClassC"]
    assert "model_version" in body


def test_predict_rejects_invalid_file_type(client, registered_user_token):
    resp = client.post(
        "/api/predict",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=auth_headers(registered_user_token),
    )
    assert resp.status_code == 400


def test_predict_rejects_corrupt_image(client, registered_user_token):
    resp = client.post(
        "/api/predict",
        files={"file": ("bad.jpg", io.BytesIO(b"not really an image"), "image/jpeg")},
        headers=auth_headers(registered_user_token),
    )
    assert resp.status_code == 400


def test_history_lists_predictions(client, registered_user_token, sample_image_bytes, loaded_model):
    loaded_model([0.7, 0.2, 0.06, 0.04])
    client.post(
        "/api/predict",
        files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
        headers=auth_headers(registered_user_token),
    )
    resp = client.get("/api/predictions", headers=auth_headers(registered_user_token))
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_delete_history_item(client, registered_user_token, sample_image_bytes, loaded_model):
    loaded_model([0.7, 0.2, 0.06, 0.04])
    pred = client.post(
        "/api/predict",
        files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
        headers=auth_headers(registered_user_token),
    ).json()

    resp = client.delete(f"/api/predictions/{pred['id']}", headers=auth_headers(registered_user_token))
    assert resp.status_code == 200

    resp = client.get(f"/api/predictions/{pred['id']}", headers=auth_headers(registered_user_token))
    assert resp.status_code == 404


def test_cannot_access_another_users_prediction(client, sample_image_bytes, loaded_model):
    loaded_model([0.7, 0.2, 0.06, 0.04])
    client.post("/api/auth/register", json={
        "name": "UserA", "email": "usera@example.com",
        "password": "StrongPass1", "confirm_password": "StrongPass1",
    })
    token_a = client.post("/api/auth/login", json={
        "email": "usera@example.com", "password": "StrongPass1"}).json()["access_token"]

    client.post("/api/auth/register", json={
        "name": "UserB", "email": "userb@example.com",
        "password": "StrongPass1", "confirm_password": "StrongPass1",
    })
    token_b = client.post("/api/auth/login", json={
        "email": "userb@example.com", "password": "StrongPass1"}).json()["access_token"]

    pred = client.post(
        "/api/predict",
        files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
        headers=auth_headers(token_a),
    ).json()

    resp = client.get(f"/api/predictions/{pred['id']}", headers=auth_headers(token_b))
    assert resp.status_code == 404


def test_predict_returns_503_when_no_model(client, registered_user_token, sample_image_bytes):
    resp = client.post("/api/predict",
                       files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
                       headers=auth_headers(registered_user_token))
    assert resp.status_code == 503
    assert "trained model" in resp.json()["detail"].lower()


def test_low_confidence_flag(client, registered_user_token, sample_image_bytes, loaded_model):
    loaded_model([0.30, 0.28, 0.22, 0.20])
    body = client.post("/api/predict",
                       files={"file": ("skin.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")},
                       headers=auth_headers(registered_user_token)).json()
    assert body["low_confidence"] is True


def test_oversized_file_rejected(client, registered_user_token):
    big = b"\xff\xd8" + b"0" * (6 * 1024 * 1024)
    resp = client.post("/api/predict", files={"file": ("big.jpg", io.BytesIO(big), "image/jpeg")},
                       headers=auth_headers(registered_user_token))
    assert resp.status_code == 400 and "too large" in resp.json()["detail"].lower()


def test_unsupported_format_gif_rejected(client, registered_user_token):
    resp = client.post("/api/predict", files={"file": ("a.gif", io.BytesIO(b"GIF89a"), "image/gif")},
                       headers=auth_headers(registered_user_token))
    assert resp.status_code == 400


def test_model_status_requires_auth_and_reports_unloaded(client, registered_user_token):
    assert client.get("/api/admin/model-status").status_code == 401
    body = client.get("/api/admin/model-status", headers=auth_headers(registered_user_token)).json()
    assert body["model_loaded"] is False and body["load_error"]
    assert body["class_labels"] == []
