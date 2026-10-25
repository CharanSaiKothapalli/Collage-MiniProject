from typing import List, Dict, Tuple, Any, Optional
import numpy as np
from app.features.extractor import FEATURE_NAMES, feature_dict_to_vector

def score_against_profile(
    enrolled_samples: List[Dict[str, float]],
    current_sample: Dict[str, float],
    threshold: float = 2.8
) -> Tuple[str, float, Dict[str, float], List[str], List[str]]:
    """
    Evaluates current typing sample against the user's enrolled profile using
    a robust statistical z-score distance based on Median and Median Absolute Deviation (MAD).
    
    Lower distance score indicates higher similarity to enrolled pattern.
    """
    if len(enrolled_samples) < 1:
        return "INSUFFICIENT_DATA", 99.0, {}, ["No enrolled samples found for profile."], []

    X = np.asarray([feature_dict_to_vector(s) for s in enrolled_samples], dtype=np.float64)
    x = np.asarray(feature_dict_to_vector(current_sample), dtype=np.float64)

    # Calculate median and robust MAD scale per dimension
    med = np.median(X, axis=0)
    mad = np.median(np.abs(X - med), axis=0)

    # Guard against zero MAD (identical repeated values) by setting a feature scale floor
    floor = np.maximum(np.abs(med) * 0.05, 1.0)
    scale = np.maximum(1.4826 * mad, floor)

    # Compute absolute standardized z-score deviation per feature
    z = np.abs((x - med) / scale)
    z_capped = np.minimum(z, 10.0)

    score = float(np.mean(z_capped))
    score = round(score, 3)

    feature_deviations = {
        name: round(float(z_val), 2)
        for name, z_val in zip(FEATURE_NAMES, z)
    }

    reason_codes = []
    quality_warnings = []

    # Identify primary diverging features
    outlier_features = [name for name, z_val in feature_deviations.items() if z_val > 3.0]
    if outlier_features:
        reason_codes.append(f"Deviations detected in: {', '.join(outlier_features)}")

    if score <= threshold:
        decision = "MATCH"
        reason_codes.append("Typing rhythm is consistent with enrolled behavioural baseline.")
    else:
        decision = "REVIEW"
        reason_codes.append(f"Typing cadence distance ({score}) exceeds threshold ({threshold}).")

    if len(enrolled_samples) < 5:
        quality_warnings.append(
            f"Preliminary evaluation: Enrolled profile has only {len(enrolled_samples)} samples (10 recommended)."
        )

    return decision, score, feature_deviations, reason_codes, quality_warnings
