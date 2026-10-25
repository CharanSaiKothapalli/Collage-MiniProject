import mongoose, { Schema, Document } from "mongoose";
import {
  CURRENT_FEATURE_SCHEMA_VERSION,
  CURRENT_MODEL_VERSION,
  PROFILE_STATUS,
  ProfileStatusType,
} from "@keytrace/shared";

export interface ITypingProfile extends Document {
  userId: mongoose.Types.ObjectId;
  status: ProfileStatusType;
  featureSchemaVersion: string;
  enrollmentCount: number;
  modelVersion: string;
  isModelBuilt: boolean;
  modelTrainedAt?: Date;
  modelSampleCount?: number;
  stabilityScore?: number;
  calibratedThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TypingProfileSchema = new Schema<ITypingProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PROFILE_STATUS),
      default: PROFILE_STATUS.NOT_ENROLLED,
      index: true,
    },
    featureSchemaVersion: {
      type: String,
      default: CURRENT_FEATURE_SCHEMA_VERSION,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    modelVersion: {
      type: String,
      default: CURRENT_MODEL_VERSION,
    },
    isModelBuilt: {
      type: Boolean,
      default: false,
    },
    modelTrainedAt: {
      type: Date,
    },
    modelSampleCount: {
      type: Number,
      default: 0,
    },
    stabilityScore: {
      type: Number,
    },
    calibratedThreshold: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const TypingProfile = mongoose.model<ITypingProfile>("TypingProfile", TypingProfileSchema);
