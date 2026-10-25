import os
import logging
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.schemas import (
    SessionPayloadInput,
    FeatureVectorOutput,
    PredictRequest,
    PredictResponse,
    EvaluateRequest,
    EvaluateResponse,
    BuildModelRequest,
    BuildModelResponse,
    SavedModelInfoResponse
)
from app.features.extractor import extract_features_from_timing
from app.models.robust_distance import score_against_profile
from app.models.anomaly_detector import compute_anomaly_score
from app.evaluation.metrics import evaluate_classifier_performance
from app.models.model_store import (
    build_and_save_user_model,
    predict_from_saved_model,
    has_saved_model,
    get_saved_model_info,
    delete_user_model,
    list_saved_models
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("keytrace-ml")

API_SECRET_KEY = os.environ.get("ML_SERVICE_API_KEY", "keytrace-internal-service-secret-token")
MODEL_VERSION = os.environ.get("MODEL_VERSION", "v1.2.0-robust-distance")
FEATURE_SCHEMA_VERSION = "1.0"

app = FastAPI(
    title="KEYTRACE Machine Learning Service",
    description="Internal microservice providing feature extraction, model serialization, profile scoring, and evaluation for continuous keystroke dynamics authentication.",
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
        "persistenceEngine": "Joblib Compressed Serialized Artifacts",
        "defaultThreshold": 2.8,
        "strictThreshold": 2.2,
        "lenientThreshold": 3.4,
        "inputDimensions": 10
    }

@app.post("/api/v1/model/build", response_model=BuildModelResponse, tags=["Model Management"])
def build_model(req: BuildModelRequest, _auth: bool = Depends(verify_internal_auth)):
    """
    Completely trains, calibrates, and serializes a user's biometric keystroke model.
    Saves the artifact to disk (.joblib) and caches it in memory.
    Subsequent verification requests will use this saved model directly with zero re-training.
    """
    try:
        enrolled_dicts = [s.model_dump() for s in req.enrolled_samples]
        build_result = build_and_save_user_model(
            user_id=req.user_id,
            enrolled_samples=enrolled_dicts,
            threshold=req.threshold
        )
        return BuildModelResponse(
            ok=True,
            message="Model built, calibrated, and saved successfully.",
            **build_result
        )
    except ValueError as e:
        logger.warning(f"Model build error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error building model for user {req.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to build model: {str(e)}")

@app.get("/api/v1/model/user/{user_id}", response_model=SavedModelInfoResponse, tags=["Model Management"])
def get_user_model(user_id: str, _auth: bool = Depends(verify_internal_auth)):
    """Inspects metadata of a user's saved model artifact."""
    info = get_saved_model_info(user_id)
    if not info:
        return SavedModelInfoResponse(user_id=user_id, exists=False)
    return SavedModelInfoResponse(**info)

@app.delete("/api/v1/model/user/{user_id}", tags=["Model Management"])
def delete_model(user_id: str, _auth: bool = Depends(verify_internal_auth)):
    """Deletes a saved model artifact from disk and evicts it from memory cache."""
    success = delete_user_model(user_id)
    return {"ok": True, "deleted": success, "user_id": user_id}

@app.get("/api/v1/model/saved-list", tags=["Model Management"])
def list_models(_auth: bool = Depends(verify_internal_auth)):
    """Lists all saved models currently stored on disk."""
    return {"ok": True, "models": list_saved_models()}

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
    """
    Evaluates current typing sample against the biometric baseline.
    PRIORITY:
      1. If user_id has a saved model, inference runs directly from the saved model
         with zero re-training and sub-millisecond latency.
      2. If user_id has enrolled_samples passed, automatically builds and saves the model
         so future calls reuse the saved artifact.
      3. Fallback to live computation if no user_id or saved model.
    """
    try:
        current_dict = req.current_sample.model_dump()

        # CASE 1: Fast inference from pre-existing saved model
        if req.user_id and has_saved_model(req.user_id):
            result = predict_from_saved_model(
                user_id=req.user_id,
                current_sample=current_dict,
                threshold=req.threshold
            )
            if result is not None:
                decision, score, deviations, reason_codes, warnings, anomaly, meta = result
                return PredictResponse(
                    decision=decision,
                    score=score,
                    threshold=req.threshold,
                    model_version=MODEL_VERSION,
                    feature_schema_version=FEATURE_SCHEMA_VERSION,
                    reason_codes=reason_codes,
                    quality_warnings=warnings,
                    feature_deviations=deviations,
                    anomaly_score=anomaly,
                    model_source="saved_model",
                    is_cached=meta.get("is_cached", True),
                    model_trained_at=meta.get("trained_at"),
                    model_sample_count=meta.get("sample_count")
                )

        # CASE 2: user_id provided with enrolled samples -> build & save completely, then infer!
        if req.user_id and req.enrolled_samples and len(req.enrolled_samples) >= 1:
            logger.info(f"Building and saving model for user {req.user_id} prior to inference...")
            enrolled_dicts = [s.model_dump() for s in req.enrolled_samples]
            build_result = build_and_save_user_model(
                user_id=req.user_id,
                enrolled_samples=enrolled_dicts,
                threshold=req.threshold
            )
            # Now run inference directly from the newly saved model
            result = predict_from_saved_model(
                user_id=req.user_id,
                current_sample=current_dict,
                threshold=req.threshold
            )
            if result is not None:
                decision, score, deviations, reason_codes, warnings, anomaly, meta = result
                reason_codes.append("Biometric model was built, calibrated, and saved to disk.")
                return PredictResponse(
                    decision=decision,
                    score=score,
                    threshold=req.threshold,
                    model_version=MODEL_VERSION,
                    feature_schema_version=FEATURE_SCHEMA_VERSION,
                    reason_codes=reason_codes,
                    quality_warnings=warnings,
                    feature_deviations=deviations,
                    anomaly_score=anomaly,
                    model_source="saved_model",
                    is_cached=True,
                    model_trained_at=meta.get("trained_at"),
                    model_sample_count=meta.get("sample_count")
                )

        # CASE 3: Fallback on enrolled samples without user_id persistence
        if req.enrolled_samples and len(req.enrolled_samples) >= 1:
            enrolled_dicts = [s.model_dump() for s in req.enrolled_samples]
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
                anomaly_score=anomaly,
                model_source="live_fallback",
                is_cached=False,
                model_trained_at=None,
                model_sample_count=len(enrolled_dicts)
            )

        # CASE 4: Neither saved model nor enrolled samples available
        return PredictResponse(
            decision="PROFILE_NOT_READY",
            score=None,
            threshold=req.threshold,
            model_version=MODEL_VERSION,
            feature_schema_version=FEATURE_SCHEMA_VERSION,
            reason_codes=["No saved biometric model found for this user. Please complete enrollment and build the model."],
            quality_warnings=["Please record at least 10 enrollment sessions to construct a baseline model."],
            model_source="none",
            is_cached=False
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

