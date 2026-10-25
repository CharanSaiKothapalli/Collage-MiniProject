import mongoose, { Schema, Document } from "mongoose";
import { CONSENT_STATUS, ConsentStatusType } from "@keytrace/shared";

export interface IConsentRecord extends Document {
  userId: mongoose.Types.ObjectId;
  consentVersion: string;
  status: ConsentStatusType;
  timestamp: Date;
  ipHash?: string;
  metadata?: Record<string, any>;
}

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    consentVersion: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CONSENT_STATUS),
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipHash: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

ConsentRecordSchema.index({ userId: 1, timestamp: -1 });

export const ConsentRecord = mongoose.model<IConsentRecord>("ConsentRecord", ConsentRecordSchema);
