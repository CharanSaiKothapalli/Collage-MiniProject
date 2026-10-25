from typing import List, Dict, Optional, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest
from app.features.extractor import feature_dict_to_vector

def compute_anomaly_score(
    enrolled_samples: List[Dict[str, float]],
    current_sample: Dict[str, float]
) -> Optional[float]:
    """
    Computes an Isolation Forest decision function score if adequate samples exist (>= 5).
    Positive values indicate inliers (conforming); negative values indicate anomalies.
    """
    if len(enrolled_samples) < 5:
        return None

    try:
        X = np.asarray([feature_dict_to_vector(s) for s in enrolled_samples], dtype=np.float64)
        x = np.asarray([feature_dict_to_vector(current_sample)], dtype=np.float64)

        # Train lightweight per-user Isolation Forest
        clf = IsolationForest(
            n_estimators=50,
            contamination=0.08,
            random_state=42
        )
        clf.fit(X)
        score = float(clf.decision_function(x)[0])
        return round(score, 3)
    except Exception:
        return None
