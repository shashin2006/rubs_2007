from concurrent.futures import ThreadPoolExecutor

from .conftest import client, auth_header


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_and_login():
    response = client.post(
        "/api/auth/register",
        json={"name": "Test Person", "email": "testperson@example.com", "password": "password123"},
    )
    assert response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={"email": "testperson@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_services():
    response = client.get("/api/services")
    assert response.status_code == 200
    assert len(response.json()) >= 3


def test_join_queue_and_status():
    headers = auth_header()
    response = client.post("/api/queues/join", json={"service_id": 1, "priority": "NORMAL"}, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["token_number"].startswith("B-")

    status = client.get("/api/queues/1/status")
    assert status.status_code == 200
    assert status.json()["waiting_count"] >= 1


def test_role_protection():
    headers = auth_header()
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 403


def test_counter_can_call_and_serve():
    user_headers = auth_header()
    join = client.post("/api/queues/join", json={"service_id": 2}, headers=user_headers)
    assert join.status_code == 201
    token_id = join.json()["token_id"]

    counter_headers = auth_header("counter@example.com", "counter123")
    called = client.post("/api/counters/2/next", headers=counter_headers)
    assert called.status_code == 200
    assert called.json()["token"]["id"] == token_id

    served = client.post(f"/api/counters/2/serve/{token_id}", headers=counter_headers)
    assert served.status_code == 200
    assert served.json()["status"] == "SERVED"


def test_concurrent_token_generation():
    # The test uses distinct users so the active-token-per-user rule does not interfere.
    for i in range(20):
        email = f"concurrent{i}@example.com"
        client.post(
            "/api/auth/register",
            json={"name": f"Concurrent {i}", "email": email, "password": "password123"},
        )

    def join(i):
        headers = auth_header(f"concurrent{i}@example.com", "password123")
        return client.post("/api/queues/join", json={"service_id": 3}, headers=headers)

    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(join, range(20)))

    assert all(r.status_code == 201 for r in responses)
    tokens = [r.json()["token_number"] for r in responses]
    assert len(tokens) == len(set(tokens))
