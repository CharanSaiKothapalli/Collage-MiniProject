from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ObservationInput(BaseModel):
    holdMs: float = Field(..., ge=1, le=2000, description="Key press hold duration in ms")
    flightMs: float = Field(..., ge=1, le=5000, description="Inter-key flight duration in ms")

class SessionPayloadInput(BaseModel):
    schemaVersion: int = Field(default=1, description="Timing schema version")
    sessionId: str = Field(..., description="Unique UUID for session window")
    elapsedMs: float = Field(..., ge=1000, le=300000, description="Total window time in ms")
    observations: List[ObservationInput] = Field(..., min_length=5, description="Hold and flight pairs")
    inputMethod: str = Field(default="keyboard", description="Input type e.g. physical keyboard")
    consentVersion: str = Field(default="1.0", description="Accepted consent policy version")

class FeatureVectorOutput(BaseModel):
    mean_hold: float = Field(..., gt=0)
    std_hold: float = Field(..., ge=0)
    median_hold: float = Field(..., gt=0)
    mean_flight: float = Field(..., gt=0)
    std_flight: float = Field(..., ge=0)
    median_flight: float = Field(..., gt=0)
    p90_flight: float = Field(..., gt=0)
    chars_per_second: float = Field(..., gt=0)
    pause_ratio: float = Field(..., ge=0, le=1)
    hold_flight_ratio: float = Field(..., gt=0)

class PredictRequest(BaseModel):
    user_id: Optional[str] = None
    enrolled_samples: List[FeatureVectorOutput] = Field(..., min_length=1)
    current_sample: FeatureVectorOutput
    threshold: float = Field(default=2.8, gt=0, le=10.0)

class PredictResponse(BaseModel):
    decision: str = Field(..., description="MATCH, REVIEW, or INSUFFICIENT_DATA")
    score: Optional[float] = Field(None, description="Robust distance metric; lower is more similar")
    threshold: float = Field(default=2.8)
    model_version: str = Field(default="v1.2.0-robust-distance")
    feature_schema_version: str = Field(default="1.0")
    reason_codes: List[str] = Field(default_factory=list)
    quality_warnings: List[str] = Field(default_factory=list)
    feature_deviations: Dict[str, float] = Field(default_factory=dict)
    anomaly_score: Optional[float] = None

class EvaluateRequest(BaseModel):
    genuine_samples: List[FeatureVectorOutput] = Field(..., min_length=2)
    impostor_samples: List[FeatureVectorOutput] = Field(..., min_length=2)
    threshold: float = Field(default=2.8, gt=0, le=10.0)

class RocPoint(BaseModel):
    threshold: float
    far: float
    frr: float

class EvaluateResponse(BaseModel):
    far: float = Field(..., description="False Acceptance Rate")
    frr: float = Field(..., description="False Rejection Rate")
    eer: float = Field(..., description="Equal Error Rate")
    roc_auc: float = Field(..., description="Area Under ROC Curve")
    precision: float
    recall: float
    confusion_matrix: Dict[str, int]
    sample_counts: Dict[str, int]
    roc_curve: List[RocPoint]
    status: str = Field(default="preliminary")
