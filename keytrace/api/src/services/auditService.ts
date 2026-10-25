import { AuditEvent } from "../models/AuditEvent.js";
import { logger } from "../utils/logger.js";

export async function logAuditEvent(params: {
  actorId?: any;
  actorUsername?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await AuditEvent.create({
      actorId: params.actorId,
      actorUsername: params.actorUsername,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
      timestamp: new Date(),
    });
  } catch (err: any) {
    logger.error({ err: err.message }, "Failed to persist audit log");
  }
}
