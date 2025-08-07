from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_filters_config():
    response = client.get("/filters-config")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

def test_amr_records_basic():
    payload = {
        "selected_filters": [],
        "page": 1,
        "per_page": 10
    }
    response = client.post("/amr-records", json=payload)
    assert response.status_code == 200
    assert "data" in response.json()