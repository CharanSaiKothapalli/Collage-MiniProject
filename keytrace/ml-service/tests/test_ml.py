import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.features.extractor import extract_features_from_timing, FEATURE_NAMES
from app.models.robust_distance import score_against_profile
from app.evaluation.metrics import evaluate_classifier_performance

client = TestClient(app)

def test_health_endpoints():
    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json() == {"status": "alive"}

    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

def test_model_info():
    res = client.get("/api/v1/model/info")
    assert res.status_code == 200
    data = res.json()
    assert "modelVersion" in data
    assert data["inputDimensions"] == 10

def test_feature_extraction_normal():
    holds = [120, 110, 115, 130, 125, 105, 118, 122]
    flights = [150, 140, 160, 280, 145, 155, 135]
    elapsed = 2500.0

    features = extract_features_from_timing(holds, flights, elapsed)
    for name in FEATURE_NAMES:
        assert name in features
        assert features[name] >= 0

    assert 100 <= features["mean_hold"] <= 140
    assert 130 <= features["mean_flight"] <= 200
    assert 0 <= features["pause_ratio"] <= 1.0
    assert features["chars_per_second"] > 0

def test_feature_extraction_insufficient_samples():
    holds = [100, 110]
    flights = [150]
    with pytest.raises(ValueError, match="Insufficient hold observations"):
        extract_features_from_timing(holds, flights, 1500)

def test_robust_distance_scoring():
    base_sample = {
        "mean_hold": 110.0,
        "std_hold": 15.0,
        "median_hold": 108.0,
        "mean_flight": 150.0,
        "std_flight": 25.0,
        "median_flight": 145.0,
        "p90_flight": 180.0,
        "chars_per_second": 4.5,
        "pause_ratio": 0.12,
        "hold_flight_ratio": 0.73
    }
    # Create 5 enrolled samples with slight noise
    enrolled = []
    for offset in [-2, 0, 1, -1, 3]:
        s = dict(base_sample)
        s["mean_hold"] += offset
        s["mean_flight"] += offset * 2
        enrolled.append(s)

    # Identical or near sample should MATCH with low score
    decision, score, devs, reasons, _ = score_against_profile(enrolled, base_sample, threshold=2.8)
    assert decision == "MATCH"
    assert score < 1.0

    # Highly divergent sample (impostor typing much slower with different rhythm) should REVIEW
    divergent = dict(base_sample)
    divergent["mean_hold"] = 350.0
    divergent["median_hold"] = 340.0
    divergent["mean_flight"] = 900.0
    divergent["median_flight"] = 880.0
    divergent["p90_flight"] = 1200.0
    divergent["chars_per_second"] = 0.9
    divergent["pause_ratio"] = 0.85
    divergent["hold_flight_ratio"] = 0.38

    decision2, score2, devs2, reasons2, _ = score_against_profile(enrolled, divergent, threshold=2.8)
    assert decision2 == "REVIEW"
    assert score2 > 2.8

def test_evaluation_metrics():
    genuine_pool = [
        {
            "mean_hold": 100 + i * 2,
            "std_hold": 15,
            "median_hold": 98 + i * 2,
            "mean_flight": 140 + i * 3,
            "std_flight": 20,
            "median_flight": 138 + i * 3,
            "p90_flight": 170,
            "chars_per_second": 5.0,
            "pause_ratio": 0.1,
            "hold_flight_ratio": 0.71
        }
        for i in range(10)
    ]

    impostor_pool = [
        {
            "mean_hold": 250 + i * 5,
            "std_hold": 40,
            "median_hold": 245 + i * 5,
            "mean_flight": 400 + i * 10,
            "std_flight": 60,
            "median_flight": 390 + i * 10,
            "p90_flight": 500,
            "chars_per_second": 2.1,
            "pause_ratio": 0.45,
            "hold_flight_ratio": 0.62
        }
        for i in range(8)
    ]

    results = evaluate_classifier_performance(genuine_pool, impostor_pool, operational_threshold=2.8)
    assert "far" in results
    assert "frr" in results
    assert "eer" in results
    assert "roc_auc" in results
    assert results["roc_auc"] >= 0.7
    assert len(results["roc_curve"]) > 0

def test_api_predict_route():
    sample = {
        "mean_hold": 120.0,
        "std_hold": 18.0,
        "median_hold": 115.0,
        "mean_flight": 160.0,
        "std_flight": 22.0,
        "median_flight": 155.0,
        "p90_flight": 190.0,
        "chars_per_second": 4.2,
        "pause_ratio": 0.15,
        "hold_flight_ratio": 0.75
    }
    payload = {
        "enrolled_samples": [sample, sample, sample],
        "current_sample": sample,
        "threshold": 2.8
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "MATCH"
    assert data["score"] is not None
