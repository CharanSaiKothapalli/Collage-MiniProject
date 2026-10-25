import os
import shutil
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.model_store import (
    build_and_save_user_model,
    predict_from_saved_model,
    has_saved_model,
    load_user_model,
    delete_user_model,
    get_saved_model_info,
    SAVED_MODELS_DIR
)

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_models():
    test_user_id = "test_user_saved_model_123"
    delete_user_model(test_user_id)
    yield
    delete_user_model(test_user_id)

def get_dummy_samples(n=10):
    base_sample = {
        "mean_hold": 115.0,
        "std_hold": 12.0,
        "median_hold": 114.0,
        "mean_flight": 145.0,
        "std_flight": 20.0,
        "median_flight": 142.0,
        "p90_flight": 170.0,
        "chars_per_second": 4.8,
        "pause_ratio": 0.10,
        "hold_flight_ratio": 0.79
    }
    samples = []
    for i in range(n):
        s = dict(base_sample)
        s["mean_hold"] += (i % 3) - 1
        s["mean_flight"] += (i % 4) - 2
        samples.append(s)
    return samples

def test_build_and_save_model_direct():
    user_id = "test_user_saved_model_123"
    samples = get_dummy_samples(10)

    # 1. Build and save model
    res = build_and_save_user_model(user_id, samples, threshold=2.8)
    assert res["user_id"] == user_id
    assert res["sample_count"] == 10
    assert os.path.isfile(res["saved_path"])
    assert has_saved_model(user_id) is True

    # 2. Verify inspection metadata
    info = get_saved_model_info(user_id)
    assert info is not None
    assert info["exists"] is True
    assert info["sample_count"] == 10
    assert "mean_training_distance" in info["training_metrics"]

    # 3. Predict from saved model directly (no retraining!)
    test_current = samples[0]
    pred = predict_from_saved_model(user_id, test_current, threshold=2.8)
    assert pred is not None
    decision, score, deviations, reason_codes, warnings, anomaly, meta = pred
    assert decision == "MATCH"
    assert score < 1.0
    assert meta["model_source"] == "saved_model"
    assert meta["is_cached"] is True

    # 4. Predict divergent sample from saved model
    impostor = dict(test_current)
    impostor["mean_hold"] = 350.0
    impostor["median_hold"] = 340.0
    impostor["mean_flight"] = 900.0
    impostor["median_flight"] = 880.0
    impostor["p90_flight"] = 1200.0
    impostor["chars_per_second"] = 0.8
    impostor["pause_ratio"] = 0.85
    impostor["hold_flight_ratio"] = 0.35
    pred2 = predict_from_saved_model(user_id, impostor, threshold=2.8)
    assert pred2 is not None
    decision2, score2, _, _, _, _, _ = pred2
    assert decision2 == "REVIEW"
    assert score2 > 2.8

def test_model_build_and_predict_api_routes():
    user_id = "test_user_saved_model_123"
    samples = get_dummy_samples(10)

    # 1. API route: POST /api/v1/model/build
    build_payload = {
        "user_id": user_id,
        "enrolled_samples": samples,
        "threshold": 2.8
    }
    res_build = client.post("/api/v1/model/build", json=build_payload)
    assert res_build.status_code == 200
    data_build = res_build.json()
    assert data_build["ok"] is True
    assert data_build["user_id"] == user_id
    assert data_build["sample_count"] == 10

    # 2. API route: GET /api/v1/model/user/{user_id}
    res_info = client.get(f"/api/v1/model/user/{user_id}")
    assert res_info.status_code == 200
    assert res_info.json()["exists"] is True

    # 3. API route: POST /api/v1/predict using ONLY user_id and current_sample (saved model)
    # Notice: NO enrolled_samples passed! Should use saved model!
    predict_payload = {
        "user_id": user_id,
        "current_sample": samples[0],
        "threshold": 2.8
    }
    res_pred = client.post("/api/v1/predict", json=predict_payload)
    assert res_pred.status_code == 200
    data_pred = res_pred.json()
    assert data_pred["decision"] == "MATCH"
    assert data_pred["model_source"] == "saved_model"
    assert data_pred["is_cached"] is True
    assert data_pred["model_sample_count"] == 10

    # 4. API route: DELETE /api/v1/model/user/{user_id}
    res_del = client.delete(f"/api/v1/model/user/{user_id}")
    assert res_del.status_code == 200
    assert res_del.json()["deleted"] is True

    # Verify model no longer exists
    res_info2 = client.get(f"/api/v1/model/user/{user_id}")
    assert res_info2.json()["exists"] is False
