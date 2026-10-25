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
  modelSource?: string;
  isCached?: boolean;
  modelTrainedAt?: string;
  modelSampleCount?: number;
}

export interface MLBuildModelResult {
  ok: boolean;
  message: string;
  userId: string;
  modelVersion: string;
  featureSchemaVersion: string;
  trainedAt: string;
  sampleCount: number;
  savedPath: string;
  threshold: number;
  calibratedThreshold: number;
  hasIsolationForest: boolean;
  trainingMetrics: {
    mean_training_distance: number;
    std_training_distance: number;
    max_training_distance: number;
    stability_score: number;
  };
}

export interface MLSavedModelInfo {
  userId: string;
  exists: boolean;
  modelVersion?: string;
  featureSchemaVersion?: string;
  trainedAt?: string;
  sampleCount?: number;
  threshold?: number;
  calibratedThreshold?: number;
  hasIsolationForest?: boolean;
  trainingMetrics?: any;
  savedPath?: string;
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

  async buildAndSaveModel(
    userId: string,
    enrolledSamples: FeatureVector[],
    threshold: number = 2.8
  ): Promise<MLBuildModelResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs * 2);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/model/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Service-Key": this.apiKey,
        },
        body: JSON.stringify({
          user_id: userId,
          enrolled_samples: enrolledSamples,
          threshold,
          force_rebuild: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ML model build failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return {
        ok: data.ok,
        message: data.message,
        userId: data.user_id,
        modelVersion: data.model_version,
        featureSchemaVersion: data.feature_schema_version,
        trainedAt: data.trained_at,
        sampleCount: data.sample_count,
        savedPath: data.saved_path,
        threshold: data.threshold,
        calibratedThreshold: data.calibrated_threshold,
        hasIsolationForest: data.has_isolation_forest,
        trainingMetrics: data.training_metrics,
      };
    } catch (err: any) {
      clearTimeout(timer);
      logger.error({ err: err.message, userId }, "Failed to build and save ML model");
      throw err;
    }
  }

  async getSavedModelInfo(userId: string): Promise<MLSavedModelInfo> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/api/v1/model/user/${userId}`, {
        headers: {
          "X-Internal-Service-Key": this.apiKey,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        return { userId, exists: false };
      }

      const data = await response.json();
      return {
        userId: data.user_id,
        exists: data.exists,
        modelVersion: data.model_version,
        featureSchemaVersion: data.feature_schema_version,
        trainedAt: data.trained_at,
        sampleCount: data.sample_count,
        threshold: data.threshold,
        calibratedThreshold: data.calibrated_threshold,
        hasIsolationForest: data.has_isolation_forest,
        trainingMetrics: data.training_metrics,
        savedPath: data.saved_path,
      };
    } catch {
      return { userId, exists: false };
    }
  }

  async deleteSavedModel(userId: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/api/v1/model/user/${userId}`, {
        method: "DELETE",
        headers: {
          "X-Internal-Service-Key": this.apiKey,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }

  async predict(
    enrolledSamples: FeatureVector[],
    currentSample: FeatureVector,
    threshold: number = 2.8,
    userId?: string
  ): Promise<MLPredictResult> {
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
          enrolled_samples: enrolledSamples && enrolledSamples.length > 0 ? enrolledSamples : undefined,
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
          modelSource: "error",
          isCached: false,
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
        modelSource: data.model_source || "saved_model",
        isCached: data.is_cached ?? true,
        modelTrainedAt: data.model_trained_at,
        modelSampleCount: data.model_sample_count,
      };
    } catch (err: any) {
      logger.warn({ err: err.message }, "ML service call timed out or failed to connect");
      return {
        decision: VERIFICATION_DECISION.SERVICE_UNAVAILABLE,
        score: null,
        threshold,
        modelVersion: "v1.2.0-robust-distance",
        featureSchemaVersion: "1.0",
        reasonCodes: ["Behavioral verification microservice is unreachable."],
        qualityWarnings: ["System cannot verify sample while ML engine is offline."],
        modelSource: "offline",
        isCached: false,
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
