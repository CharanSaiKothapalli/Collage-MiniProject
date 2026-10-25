import mongoose, { Schema, Document } from "mongoose";
import {
  CURRENT_FEATURE_SCHEMA_VERSION,
  CURRENT_MODEL_VERSION,
  VERIFICATION_DECISION,
  VerificationDecisionType,
} from "@keytrace/shared";

export interface IVerificationEvent extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  decision: VerificationDecisionType;
  score: number | null;
  threshold: number;
  reasonCodes: string[];
  qualityWarnings: string[];
  modelVersion: string;
  featureSchemaVersion: string;
  featureDeviations?: Map<string, number>;
  anomalyScore?: number;
  modelSource?: string;
  isCached?: boolean;
  timestamp: Date;
  createdAt: Date;
}

const VerificationEventSchema = new Schema<IVerificationEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "VerificationSession",
      required: true,
      index: true,
    },
    decision: {
      type: String,
      enum: Object.values(VERIFICATION_DECISION),
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: null,
    },
    threshold: {
      type: Number,
      required: true,
    },
    reasonCodes: {
      type: [String],
      default: [],
    },
    qualityWarnings: {
      type: [String],
      default: [],
    },
    modelVersion: {
      type: String,
      default: CURRENT_MODEL_VERSION,
    },
    featureSchemaVersion: {
      type: String,
      default: CURRENT_FEATURE_SCHEMA_VERSION,
    },
    featureDeviations: {
      type: Map,
      of: Number,
    },
    anomalyScore: {
      type: Number,
    },
    modelSource: {
      type: String,
      default: "saved_model",
    },
    isCached: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

VerificationEventSchema.index({ userId: 1, timestamp: -1 });

export const VerificationEvent = mongoose.model<IVerificationEvent>(
  "VerificationEvent",
  VerificationEventSchema
);
