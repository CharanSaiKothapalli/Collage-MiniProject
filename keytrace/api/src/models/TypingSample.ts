import mongoose, { Schema, Document } from "mongoose";
import { CURRENT_FEATURE_SCHEMA_VERSION, FeatureVector } from "@keytrace/shared";

export interface ITypingSample extends Document {
  userId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  featureVector: FeatureVector;
  featureSchemaVersion: string;
  qualityStatus: "valid" | "warning" | "rejected";
  sessionId: string;
  consentReference?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TypingSampleSchema = new Schema<ITypingSample>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "TypingProfile",
      required: true,
      index: true,
    },
    featureVector: {
      mean_hold: { type: Number, required: true },
      std_hold: { type: Number, required: true },
      median_hold: { type: Number, required: true },
      mean_flight: { type: Number, required: true },
      std_flight: { type: Number, required: true },
      median_flight: { type: Number, required: true },
      p90_flight: { type: Number, required: true },
      chars_per_second: { type: Number, required: true },
      pause_ratio: { type: Number, required: true },
      hold_flight_ratio: { type: Number, required: true },
    },
    featureSchemaVersion: {
      type: String,
      default: CURRENT_FEATURE_SCHEMA_VERSION,
    },
    qualityStatus: {
      type: String,
      enum: ["valid", "warning", "rejected"],
      default: "valid",
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    consentReference: {
      type: Schema.Types.ObjectId,
      ref: "ConsentRecord",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

TypingSampleSchema.index({ userId: 1, createdAt: -1 });

export const TypingSample = mongoose.model<ITypingSample>("TypingSample", TypingSampleSchema);
