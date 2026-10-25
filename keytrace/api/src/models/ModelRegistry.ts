import mongoose, { Schema, Document } from "mongoose";
import { CURRENT_FEATURE_SCHEMA_VERSION, CURRENT_MODEL_VERSION } from "@keytrace/shared";

export interface IModelRegistry extends Document {
  modelVersion: string;
  artifactReference: string;
  featureSchemaVersion: string;
  trainingMetadata?: Record<string, any>;
  evaluationMetrics?: {
    far: number;
    frr: number;
    eer: number;
    rocAuc: number;
    sampleCountGenuine: number;
    sampleCountImpostor: number;
    evaluatedAt: Date;
  };
  deploymentStatus: "active" | "staging" | "archived" | "rolled_back";
  createdAt: Date;
  updatedAt: Date;
}

const ModelRegistrySchema = new Schema<IModelRegistry>(
  {
    modelVersion: {
      type: String,
      required: true,
      unique: true,
      default: CURRENT_MODEL_VERSION,
      index: true,
    },
    artifactReference: {
      type: String,
      required: true,
      default: "models/v1.2.0-robust-distance.joblib",
    },
    featureSchemaVersion: {
      type: String,
      default: CURRENT_FEATURE_SCHEMA_VERSION,
    },
    trainingMetadata: {
      type: Schema.Types.Mixed,
    },
    evaluationMetrics: {
      far: Number,
      frr: Number,
      eer: Number,
      rocAuc: Number,
      sampleCountGenuine: Number,
      sampleCountImpostor: Number,
      evaluatedAt: Date,
    },
    deploymentStatus: {
      type: String,
      enum: ["active", "staging", "archived", "rolled_back"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ModelRegistry = mongoose.model<IModelRegistry>("ModelRegistry", ModelRegistrySchema);
