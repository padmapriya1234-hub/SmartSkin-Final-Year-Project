def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@example.com",
        "password": "StrongPass1",
        "confirm_password": "StrongPass1",
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_duplicate_email(client):
    payload = {
        "name": "Bob",
        "email": "bob@example.com",
        "password": "StrongPass1",
        "confirm_password": "StrongPass1",
    }
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_register_password_mismatch(client):
    resp = client.post("/api/auth/register", json={
        "name": "Carl",
        "email": "carl@example.com",
        "password": "StrongPass1",
        "confirm_password": "Different1",
    })
    assert resp.status_code == 422


def test_login_success(client):
    client.post("/api/auth/register", json={
        "name": "Dana",
        "email": "dana@example.com",
        "password": "StrongPass1",
        "confirm_password": "StrongPass1",
    })
    resp = client.post("/api/auth/login", json={"email": "dana@example.com", "password": "StrongPass1"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "name": "Eve",
        "email": "eve@example.com",
        "password": "StrongPass1",
        "confirm_password": "StrongPass1",
    })
    resp = client.post("/api/auth/login", json={"email": "eve@example.com", "password": "WrongPass"})
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_with_valid_token(client, registered_user_token):
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {registered_user_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "test.user@example.com"
