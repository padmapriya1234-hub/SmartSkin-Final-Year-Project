def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert "model_loaded" in body


def test_skincare_info_known_condition(client):
    resp = client.get("/api/skincare/Acne")
    assert resp.status_code == 200
    body = resp.json()
    assert body["condition"] == "Acne"
    assert len(body["morning"]) > 0


def test_skincare_info_unknown_condition_falls_back(client):
    resp = client.get("/api/skincare/UnknownCondition")
    assert resp.status_code == 200
    assert resp.json()["morning"]  # default plan still returned


def test_save_and_get_routine(client, registered_user_token):
    headers = {"Authorization": f"Bearer {registered_user_token}"}
    resp = client.post("/api/skincare/preferences", json={
        "skin_type": "Oily",
        "sun_exposure": "High",
        "routine_preferences": ["Cleanser", "Sunscreen"],
    }, headers=headers)
    assert resp.status_code == 200

    resp = client.get("/api/skincare/routine/get", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["morning"]
    assert body["afternoon"]
    assert body["evening"]
