from typing import Dict, Any, List
import numpy as np

FEATURE_NAMES = [
    "mean_hold",
    "std_hold",
    "median_hold",
    "mean_flight",
    "std_flight",
    "median_flight",
    "p90_flight",
    "chars_per_second",
    "pause_ratio",
    "hold_flight_ratio"
]

def extract_features_from_timing(holds: List[float], flights: List[float], elapsed_ms: float) -> Dict[str, float]:
    """
    Deterministically computes a 10-dimensional keystroke dynamics feature vector
    from hold times, flight times, and total elapsed duration.
    
    Adheres strictly to the keytrace feature schema v1.0.
    """
    h_arr = np.asarray(holds, dtype=np.float64)
    f_arr = np.asarray(flights, dtype=np.float64)
    
    if len(h_arr) < 5:
        raise ValueError(f"Insufficient hold observations: {len(h_arr)} provided, at least 5 required.")
    if len(f_arr) < 4:
        raise ValueError(f"Insufficient flight observations: {len(f_arr)} provided, at least 4 required.")
    if elapsed_ms <= 0:
        raise ValueError("Elapsed session duration must be strictly positive.")

    # Guard against non-finite values (NaN / Inf)
    if not np.all(np.isfinite(h_arr)) or not np.all(np.isfinite(f_arr)):
        raise ValueError("Timing observations contain non-finite numbers (NaN/Inf).")

    # Plausibility clipping for browser events
    h_clipped = np.clip(h_arr, 1.0, 2000.0)
    f_clipped = np.clip(f_arr, 1.0, 5000.0)

    mean_h = float(np.mean(h_clipped))
    std_h = float(np.std(h_clipped))
    med_h = float(np.median(h_clipped))

    mean_f = float(np.mean(f_clipped))
    std_f = float(np.std(f_clipped))
    med_f = float(np.median(f_clipped))
    p90_f = float(np.percentile(f_clipped, 90.0))

    elapsed_sec = max(elapsed_ms / 1000.0, 0.001)
    chars_ps = float(len(h_clipped) / elapsed_sec)
    pause_ratio = float(np.mean(f_clipped > 250.0))
    hf_ratio = float(mean_h / max(mean_f, 1.0))

    return {
        "mean_hold": round(mean_h, 3),
        "std_hold": round(std_h, 3),
        "median_hold": round(med_h, 3),
        "mean_flight": round(mean_f, 3),
        "std_flight": round(std_f, 3),
        "median_flight": round(med_f, 3),
        "p90_flight": round(p90_f, 3),
        "chars_per_second": round(chars_ps, 3),
        "pause_ratio": round(pause_ratio, 4),
        "hold_flight_ratio": round(hf_ratio, 4)
    }

def feature_dict_to_vector(feat_dict: Dict[str, float]) -> List[float]:
    return [float(feat_dict[k]) for k in FEATURE_NAMES]
