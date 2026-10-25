import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.schemas import (
    SessionPayloadInput,
    FeatureVectorOutput,
    PredictRequest,
    PredictResponse,
    EvaluateRequest,
    EvaluateResponse
)
from app.features.extractor import extract_features_from_timing
from app.models.robust_distance import score_against_profile
from app.models.anomaly_detector import compute_anomaly_score
from app.evaluation.metrics import evaluate_classifier_performance

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("keytrace-ml")

API_SECRET_KEY = os.environ.get("ML_SERVICE_API_KEY", "keytrace-internal-service-secret-token")
MODEL_VERSION = os.environ.get("MODEL_VERSION", "v1.2.0-robust-distance")
FEATURE_SCHEMA_VERSION = "1.0"

app = FastAPI(
    title="KEYTRACE Machine Learning Service",
    description="Internal microservice providing feature extraction, profile scoring, and evaluation for continuous keystroke dynamics authentication.",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_internal_auth(x_internal_service_key: Optional[str] = Header(None)):
    """Verifies internal service-to-service secret token."""
    # In development or if key not set, allow graceful local operation
    if not API_SECRET_KEY or API_SECRET_KEY == "keytrace-internal-service-secret-token":
        return True
    if x_internal_service_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal service call: invalid service token"
        )
    return True

@app.get("/health/live", tags=["Health"])
def health_live():
    return {"status": "alive"}

@app.get("/health/ready", tags=["Health"])
def health_ready():
    return {
        "status": "ready",
        "service": "keytrace-ml-service",
        "modelVersion": MODEL_VERSION,
        "featureSchemaVersion": FEATURE_SCHEMA_VERSION
    }

@app.get("/api/v1/model/info", tags=["Metadata"])
def get_model_info():
    return {
        "modelVersion": MODEL_VERSION,
        "featureSchemaVersion": FEATURE_SCHEMA_VERSION,
        "primaryAlgorithm": "Personalized Robust Distance (Median + MAD Z-Score Standardized)",
        "secondaryAlgorithm": "Per-User Isolation Forest Anomaly Detection",
        "defaultThreshold": 2.8,
        "strictThreshold": 2.2,
        "lenientThreshold": 3.4,
        "inputDimensions": 10
    }

@app.post("/api/v1/features/extract", response_model=FeatureVectorOutput, tags=["Features"])
def extract_features(payload: SessionPayloadInput, _auth: bool = Depends(verify_internal_auth)):
    try:
        holds = [obs.holdMs for obs in payload.observations]
        flights = [obs.flightMs for obs in payload.observations]
        feat_dict = extract_features_from_timing(holds, flights, payload.elapsedMs)
        return FeatureVectorOutput(**feat_dict)
    except ValueError as e:
        logger.warning(f"Feature extraction validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during feature extraction: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal feature extraction failure")

@app.post("/api/v1/predict", response_model=PredictResponse, tags=["Inference"])
def predict(req: PredictRequest, _auth: bool = Depends(verify_internal_auth)):
    try:
        enrolled_dicts = [s.model_dump() for s in req.enrolled_samples]
        current_dict = req.current_sample.model_dump()

        decision, score, deviations, reason_codes, warnings = score_against_profile(
            enrolled_dicts,
            current_dict,
            threshold=req.threshold
        )

        anomaly = compute_anomaly_score(enrolled_dicts, current_dict)

        return PredictResponse(
            decision=decision,
            score=score,
            threshold=req.threshold,
            model_version=MODEL_VERSION,
            feature_schema_version=FEATURE_SCHEMA_VERSION,
            reason_codes=reason_codes,
            quality_warnings=warnings,
            feature_deviations=deviations,
            anomaly_score=anomaly
        )
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference computation error: {str(e)}")

@app.post("/api/v1/evaluate", response_model=EvaluateResponse, tags=["Evaluation"])
def evaluate(req: EvaluateRequest, _auth: bool = Depends(verify_internal_auth)):
    try:
        genuine_dicts = [s.model_dump() for s in req.genuine_samples]
        impostor_dicts = [s.model_dump() for s in req.impostor_samples]

        eval_result = evaluate_classifier_performance(
            genuine_dicts,
            impostor_dicts,
            operational_threshold=req.threshold
        )
        return EvaluateResponse(**eval_result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Evaluation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Model evaluation failed: {str(e)}")
