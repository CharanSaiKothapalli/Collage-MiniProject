import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { User } from "../../models/User.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { TypingSample } from "../../models/TypingSample.js";
import { VerificationSession } from "../../models/VerificationSession.js";
import { VerificationEvent } from "../../models/VerificationEvent.js";
import { ConsentRecord } from "../../models/ConsentRecord.js";
import { logAuditEvent } from "../../services/auditService.js";
import { config } from "../../config/index.js";
import { PROFILE_STATUS } from "@keytrace/shared";

export const dataRouter = Router();

dataRouter.use(authenticate);

/**
 * GET /api/v1/data/export
 * GDPR-aligned export of all user-associated behavioural and account data in JSON format.
 */
dataRouter.get("/export", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const [consentRecords, profile, samples, sessions, events] = await Promise.all([
    ConsentRecord.find({ userId: user._id }),
    TypingProfile.findOne({ userId: user._id }),
    TypingSample.find({ userId: user._id }),
    VerificationSession.find({ userId: user._id }),
    VerificationEvent.find({ userId: user._id }),
  ]);

  const exportPayload = {
    exportMetadata: {
      application: "KEYTRACE",
      exportedAt: new Date().toISOString(),
      formatVersion: "1.0",
    },
    account: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasConsent: user.hasConsent,
      createdAt: user.createdAt,
    },
    consentHistory: consentRecords.map((c) => ({
      version: c.consentVersion,
      status: c.status,
      timestamp: c.timestamp,
    })),
    typingProfile: profile
      ? {
          status: profile.status,
          sampleCount: profile.enrollmentCount,
          featureSchemaVersion: profile.featureSchemaVersion,
          modelVersion: profile.modelVersion,
          createdAt: profile.createdAt,
        }
      : null,
    enrolledSamples: samples.map((s) => ({
      id: s._id,
      featureVector: s.featureVector,
      qualityStatus: s.qualityStatus,
      createdAt: s.createdAt,
    })),
    verificationSessions: sessions.map((sess) => ({
      id: sess._id,
      startTimestamp: sess.startTimestamp,
      endTimestamp: sess.endTimestamp,
      totalEvaluations: sess.totalEvaluations,
      matchCount: sess.matchCount,
      reviewCount: sess.reviewCount,
      aggregateResult: sess.aggregateResult,
    })),
    verificationEvents: events.map((ev) => ({
      id: ev._id,
      decision: ev.decision,
      score: ev.score,
      threshold: ev.threshold,
      reasonCodes: ev.reasonCodes,
      timestamp: ev.timestamp,
    })),
  };

  await logAuditEvent({
    actorId: user._id,
    actorUsername: user.username,
    action: "DATA_EXPORT_DOWNLOADED",
    resourceType: "UserData",
    ipAddress: req.ip,
  });

  res.setHeader("Content-Disposition", `attachment; filename="keytrace-export-${user.username}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.json(exportPayload);
});

/**
 * DELETE /api/v1/profile
 * Deletes user's enrolled profile and timing samples while preserving the user account.
 */
dataRouter.delete("/profile", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  await TypingSample.deleteMany({ userId: user._id });
  await TypingProfile.findOneAndUpdate(
    { userId: user._id },
    {
      status: PROFILE_STATUS.NOT_ENROLLED,
      enrollmentCount: 0,
    }
  );

  await logAuditEvent({
    actorId: user._id,
    actorUsername: user.username,
    action: "TYPING_PROFILE_DELETED",
    resourceType: "TypingProfile",
    resourceId: user._id.toString(),
    ipAddress: req.ip,
  });

  res.json({
    ok: true,
    message: "Enrolled behavioural typing profile and all associated samples were deleted.",
  });
});

/**
 * DELETE /api/v1/account
 * Completely deletes the user account and all personal behavioural data.
 */
dataRouter.delete("/account", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  await Promise.all([
    TypingSample.deleteMany({ userId: user._id }),
    TypingProfile.deleteOne({ userId: user._id }),
    VerificationSession.deleteMany({ userId: user._id }),
    VerificationEvent.deleteMany({ userId: user._id }),
    ConsentRecord.deleteMany({ userId: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);

  await logAuditEvent({
    actorId: user._id,
    actorUsername: user.username,
    action: "ACCOUNT_DELETED",
    resourceType: "User",
    resourceId: user._id.toString(),
    ipAddress: req.ip,
  });

  res.clearCookie(config.cookieName, { path: "/" });
  res.clearCookie("keytrace_csrf", { path: "/" });

  res.json({
    ok: true,
    message: "User account and all associated behavioural biometric data have been permanently deleted.",
  });
});
