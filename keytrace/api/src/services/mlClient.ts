import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { FeatureVector, VERIFICATION_DECISION, VerificationDecisionType } from "@keytrace/shared";

export interface MLPredictResult {
  decision: VerificationDecisionType;
  score: number | null;
  threshold: number;
  modelVersion: string;
  featureSchemaVersion: string;
  reasonCodes: string[];
  qualityWarnings: string[];
  featureDeviations?: Record<string, number>;
  anomalyScore?: number;
}

export class MLClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = config.mlServiceUrl.replace(/\/$/, "");
    this.apiKey = config.mlServiceApiKey;
    this.timeoutMs = config.mlServiceTimeoutMs;
  }

  async checkHealth(): Promise<{ status: "healthy" | "offline"; details?: any }> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.baseUrl}/health/ready`, {
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        return { status: "healthy", details: data };
      }
      return { status: "offline" };
    } catch {
      return { status: "offline" };
    }
  }

  async predict(
    enrolledSamples: FeatureVector[],
    currentSample: FeatureVector,
    threshold: number = 2.8,
    userId?: string
  ): Promise<MLPredictResult> {
    if (enrolledSamples.length === 0) {
      return {
        decision: VERIFICATION_DECISION.INSUFFICIENT_DATA,
        score: null,
        threshold,
        modelVersion: "v1.2.0-robust-distance",
        featureSchemaVersion: "1.0",
        reasonCodes: ["User has no enrolled typing samples."],
        qualityWarnings: ["Please complete profile enrolment first."],
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/api/v1/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Service-Key": this.apiKey,
        },
        body: JSON.stringify({
          user_id: userId,
          enrolled_samples: enrolledSamples,
          current_sample: currentSample,
          threshold,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, "ML service returned non-200 response");
        return {
          decision: VERIFICATION_DECISION.SERVICE_UNAVAILABLE,
          score: null,
          threshold,
          modelVersion: "v1.2.0-robust-distance",
          featureSchemaVersion: "1.0",
          reasonCodes: ["Machine learning classification microservice error."],
          qualityWarnings: ["Verification service temporarily degraded."],
        };
      }

      const data = await response.json();
      return {
        decision: data.decision as VerificationDecisionType,
        score: data.score,
        threshold: data.threshold,
        modelVersion: data.model_version,
        featureSchemaVersion: data.feature_schema_version,
        reasonCodes: data.reason_codes || [],
        qualityWarnings: data.quality_warnings || [],
        featureDeviations: data.feature_deviations || {},
        anomalyScore: data.anomaly_score,
      };
    } catch (err: any) {
      logger.warn({ err: err.message }, "ML service call timed out or failed to connect");
      // Circuit-breaker / defensive response: NEVER mark successful if ML service is down
      return {
        decision: VERIFICATION_DECISION.SERVICE_UNAVAILABLE,
        score: null,
        threshold,
        modelVersion: "v1.2.0-robust-distance",
        featureSchemaVersion: "1.0",
        reasonCodes: ["Behavioral verification microservice is unreachable."],
        qualityWarnings: ["System cannot verify sample while ML engine is offline."],
      };
    }
  }

  async evaluate(
    genuineSamples: FeatureVector[],
    impostorSamples: FeatureVector[],
    threshold: number = 2.8
  ): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs * 2);

    const response = await fetch(`${this.baseUrl}/api/v1/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": this.apiKey,
      },
      body: JSON.stringify({
        genuine_samples: genuineSamples,
        impostor_samples: impostorSamples,
        threshold,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`ML evaluation failed with status ${response.status}`);
    }
    return response.json();
  }
}

export const mlClient = new MLClient();
