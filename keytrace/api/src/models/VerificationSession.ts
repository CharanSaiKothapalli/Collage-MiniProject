import mongoose, { Schema, Document } from "mongoose";
import {
  CURRENT_MODEL_VERSION,
  VERIFICATION_DECISION,
  VerificationDecisionType,
} from "@keytrace/shared";

export interface IVerificationSession extends Document {
  userId: mongoose.Types.ObjectId;
  status: "active" | "completed" | "interrupted";
  startTimestamp: Date;
  endTimestamp?: Date;
  totalEvaluations: number;
  matchCount: number;
  reviewCount: number;
  aggregateResult: VerificationDecisionType;
  modelVersion: string;
  clientMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationSessionSchema = new Schema<IVerificationSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "interrupted"],
      default: "active",
      index: true,
    },
    startTimestamp: {
      type: Date,
      default: Date.now,
    },
    endTimestamp: {
      type: Date,
    },
    totalEvaluations: {
      type: Number,
      default: 0,
    },
    matchCount: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    aggregateResult: {
      type: String,
      enum: Object.values(VERIFICATION_DECISION),
      default: VERIFICATION_DECISION.MATCH,
    },
    modelVersion: {
      type: String,
      default: CURRENT_MODEL_VERSION,
    },
    clientMetadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

VerificationSessionSchema.index({ userId: 1, startTimestamp: -1 });

export const VerificationSession = mongoose.model<IVerificationSession>(
  "VerificationSession",
  VerificationSessionSchema
);
