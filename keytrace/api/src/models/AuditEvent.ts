import mongoose, { Schema, Document } from "mongoose";

export interface IAuditEvent extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorUsername?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    actorUsername: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

AuditEventSchema.index({ timestamp: -1 });

export const AuditEvent = mongoose.model<IAuditEvent>("AuditEvent", AuditEventSchema);
