import os
import logging
from datetime import datetime
from typing import List, Dict, Tuple, Any, Optional
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

from app.features.extractor import FEATURE_NAMES, feature_dict_to_vector

logger = logging.getLogger("keytrace-ml.model_store")

# Default saved models directory (can be overridden via environment)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAVED_MODELS_DIR = os.environ.get("SAVED_MODELS_DIR", os.path.join(BASE_DIR, "saved_models"))
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

MODEL_VERSION = os.environ.get("MODEL_VERSION", "v1.2.0-robust-distance")
FEATURE_SCHEMA_VERSION = "1.0"

# In-memory cache for fast, zero-delay prediction
_MODEL_CACHE: Dict[str, Dict[str, Any]] = {}

def get_model_path(user_id: str) -> str:
    """Returns normalized filepath for a user's serialized model artifact."""
    safe_user_id = "".join(c for c in user_id if c.isalnum() or c in ("-", "_"))
    return os.path.join(SAVED_MODELS_DIR, f"{safe_user_id}.joblib")

def has_saved_model(user_id: str) -> bool:
    """Checks whether a saved model artifact exists in cache or on disk."""
    if user_id in _MODEL_CACHE:
        return True
    return os.path.isfile(get_model_path(user_id))

def load_user_model(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Loads a saved model from memory cache or reads it from disk.
    Loads into memory cache on first read.
    """
    if user_id in _MODEL_CACHE:
        return _MODEL_CACHE[user_id]

    path = get_model_path(user_id)
    if not os.path.isfile(path):
        return None

    try:
        model_artifact = joblib.load(path)
        _MODEL_CACHE[user_id] = model_artifact
        logger.info(f"Loaded saved model for user {user_id} from {path}")
        return model_artifact
    except Exception as e:
        logger.error(f"Failed to load saved model artifact for user {user_id}: {str(e)}")
        return None

def build_and_save_user_model(
    user_id: str,
    enrolled_samples: List[Dict[str, float]],
    threshold: float = 2.8
) -> Dict[str, Any]:
    """
    Completely trains, calibrates, and serializes a user's keystroke biometric model.
    Saves the artifact to disk (.joblib) and caches it in memory.
    Subsequent predictions will load directly from this model rather than re-running training.
    """
    if not enrolled_samples:
        raise ValueError("Cannot build model: enrolled samples list is empty.")

    X = np.asarray([feature_dict_to_vector(s) for s in enrolled_samples], dtype=np.float64)
    sample_count = len(enrolled_samples)

    # 1. Calibrate robust baseline spatial vectors (Median + MAD)
    med = np.median(X, axis=0)
    mad = np.median(np.abs(X - med), axis=0)
    floor = np.maximum(np.abs(med) * 0.05, 1.0)
    scale = np.maximum(1.4826 * mad, floor)

    # 2. Compute empirical distances on the training set
    training_distances = []
    for row in X:
        z = np.minimum(np.abs((row - med) / scale), 10.0)
        training_distances.append(float(np.mean(z)))

    mean_dist = float(np.mean(training_distances))
    std_dist = float(np.std(training_distances)) if len(training_distances) > 1 else 0.0
    max_dist = float(np.max(training_distances))

    # Dynamic threshold recommendation (clamped between 2.2 and 3.4)
    calibrated_threshold = float(np.clip(mean_dist + 2.5 * max(std_dist, 0.2), 2.2, 3.4))

    # 3. Fit Isolation Forest anomaly detector if adequate samples (>= 5)
    clf = None
    if sample_count >= 5:
        try:
            clf = IsolationForest(
                n_estimators=100,
                contamination=0.08,
                random_state=42
            )
            clf.fit(X)
        except Exception as e:
            logger.warning(f"Could not fit Isolation Forest for user {user_id}: {str(e)}")

    # 4. Construct complete serialized model artifact
    model_artifact = {
        "user_id": user_id,
        "model_version": MODEL_VERSION,
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "sample_count": sample_count,
        "feature_names": FEATURE_NAMES,
        "median_vector": med,
        "scale_vector": scale,
        "feature_medians": {name: round(float(m), 3) for name, m in zip(FEATURE_NAMES, med)},
        "feature_scales": {name: round(float(s), 3) for name, s in zip(FEATURE_NAMES, scale)},
        "isolation_forest": clf,
        "threshold": float(threshold),
        "calibrated_threshold": round(calibrated_threshold, 2),
        "training_metrics": {
            "mean_training_distance": round(mean_dist, 3),
            "std_training_distance": round(std_dist, 3),
            "max_training_distance": round(max_dist, 3),
            "stability_score": round(max(0.0, 100.0 - std_dist * 25.0), 1)
        }
    }

    # 5. Persist to disk (.joblib)
    path = get_model_path(user_id)
    joblib.dump(model_artifact, path, compress=3)
    logger.info(f"Successfully serialized and saved model for user {user_id} at {path}")

    # 6. Cache in memory
    _MODEL_CACHE[user_id] = model_artifact

    return {
        "user_id": user_id,
        "model_version": MODEL_VERSION,
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "trained_at": model_artifact["trained_at"],
        "sample_count": sample_count,
        "saved_path": path,
        "threshold": float(threshold),
        "calibrated_threshold": round(calibrated_threshold, 2),
        "has_isolation_forest": clf is not None,
        "training_metrics": model_artifact["training_metrics"]
    }

def predict_from_saved_model(
    user_id: str,
    current_sample: Dict[str, float],
    threshold: Optional[float] = None
) -> Optional[Tuple[str, float, Dict[str, float], List[str], List[str], Optional[float], Dict[str, Any]]]:
    """
    Executes fast inference directly against the user's precomputed, saved model artifact.
    DOES NOT retrain or recalculate baseline vectors on every request!
    
    Returns:
        (decision, score, feature_deviations, reason_codes, quality_warnings, anomaly_score, metadata)
    """
    model = load_user_model(user_id)
    if model is None:
        return None

    med = model["median_vector"]
    scale = model["scale_vector"]
    clf = model.get("isolation_forest")

    x = np.asarray(feature_dict_to_vector(current_sample), dtype=np.float64)

    # 1. Fast O(d) z-score distance against pre-computed baseline
    z = np.abs((x - med) / scale)
    z_capped = np.minimum(z, 10.0)
    score = round(float(np.mean(z_capped)), 3)

    feature_deviations = {
        name: round(float(zv), 2)
        for name, zv in zip(FEATURE_NAMES, z)
    }

    # 2. Fast O(1) decision function from saved Isolation Forest
    anomaly_score = None
    if clf is not None:
        try:
            anomaly_score = round(float(clf.decision_function([x])[0]), 3)
        except Exception as e:
            logger.warning(f"Error evaluating saved IsolationForest: {str(e)}")

    eff_threshold = threshold if threshold is not None else model.get("threshold", 2.8)

    reason_codes = []
    quality_warnings = []

    outlier_features = [name for name, zv in feature_deviations.items() if zv > 3.0]
    if outlier_features:
        reason_codes.append(f"Deviations detected in: {', '.join(outlier_features)}")

    if score <= eff_threshold:
        decision = "MATCH"
        reason_codes.append("Typing rhythm is consistent with enrolled behavioural baseline.")
    else:
        decision = "REVIEW"
        reason_codes.append(f"Typing cadence distance ({score}) exceeds threshold ({eff_threshold}).")

    if model["sample_count"] < 5:
        quality_warnings.append(
            f"Preliminary model: Trained with {model['sample_count']} samples (10 recommended for production)."
        )

    metadata = {
        "model_source": "saved_model",
        "is_cached": True,
        "saved_path": get_model_path(user_id),
        "trained_at": model["trained_at"],
        "sample_count": model["sample_count"],
        "stability_score": model.get("training_metrics", {}).get("stability_score", 100.0)
    }

    return decision, score, feature_deviations, reason_codes, quality_warnings, anomaly_score, metadata

def delete_user_model(user_id: str) -> bool:
    """Deletes the saved model from disk and evicts it from memory cache."""
    _MODEL_CACHE.pop(user_id, None)
    path = get_model_path(user_id)
    if os.path.isfile(path):
        try:
            os.remove(path)
            logger.info(f"Deleted saved model artifact for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete model file {path}: {str(e)}")
            return False
    return False

def get_saved_model_info(user_id: str) -> Optional[Dict[str, Any]]:
    """Returns metadata for a user's saved model without raw internal arrays."""
    model = load_user_model(user_id)
    if model is None:
        return None

    return {
        "user_id": user_id,
        "exists": True,
        "model_version": model["model_version"],
        "feature_schema_version": model["feature_schema_version"],
        "trained_at": model["trained_at"],
        "sample_count": model["sample_count"],
        "threshold": model["threshold"],
        "calibrated_threshold": model.get("calibrated_threshold", model["threshold"]),
        "has_isolation_forest": model.get("isolation_forest") is not None,
        "training_metrics": model.get("training_metrics", {}),
        "feature_medians": model.get("feature_medians", {}),
        "saved_path": get_model_path(user_id)
    }

def list_saved_models() -> List[Dict[str, Any]]:
    """Lists all saved user models found on disk."""
    results = []
    if not os.path.exists(SAVED_MODELS_DIR):
        return results

    for fname in os.listdir(SAVED_MODELS_DIR):
        if fname.endswith(".joblib"):
            user_id = fname[:-7]
            info = get_saved_model_info(user_id)
            if info:
                results.append(info)
    return results
