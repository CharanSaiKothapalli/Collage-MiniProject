import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ConsentRecord } from "../../models/ConsentRecord.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { logAuditEvent } from "../../services/auditService.js";
import {
  ConsentAcceptSchema,
  CURRENT_CONSENT_VERSION,
  CONSENT_STATUS,
  PROFILE_STATUS,
} from "@keytrace/shared";

export const consentRouter = Router();

consentRouter.use(authenticate);

/**
 * GET /api/v1/consent/current
 */
consentRouter.get("/current", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const latestRecord = await ConsentRecord.findOne({ userId: user._id }).sort({ timestamp: -1 });

  res.json({
    ok: true,
    hasConsent: user.hasConsent,
    currentVersion: CURRENT_CONSENT_VERSION,
    acceptedVersion: latestRecord?.consentVersion || null,
    status: latestRecord?.status || CONSENT_STATUS.WITHDRAWN,
    timestamp: latestRecord?.timestamp || null,
  });
});

/**
 * POST /api/v1/consent/accept
 */
consentRouter.post(
  "/accept",
  validate({ body: ConsentAcceptSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { consentVersion } = req.body;

    const record = await ConsentRecord.create({
      userId: user._id,
      consentVersion: consentVersion || CURRENT_CONSENT_VERSION,
      status: CONSENT_STATUS.ACCEPTED,
      timestamp: new Date(),
      ipHash: req.ip,
      metadata: {
        userAgent: req.headers["user-agent"],
      },
    });

    user.hasConsent = true;
    await user.save();

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "CONSENT_ACCEPTED",
      resourceType: "ConsentRecord",
      resourceId: record._id.toString(),
      ipAddress: req.ip,
      metadata: { version: consentVersion },
    });

    res.json({
      ok: true,
      message: "Consent accepted. You may now proceed with typing profile enrolment.",
      hasConsent: true,
      consentRecordId: record._id,
    });
  }
);

/**
 * POST /api/v1/consent/withdraw
 */
consentRouter.post("/withdraw", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const record = await ConsentRecord.create({
    userId: user._id,
    consentVersion: CURRENT_CONSENT_VERSION,
    status: CONSENT_STATUS.WITHDRAWN,
    timestamp: new Date(),
    ipHash: req.ip,
  });

  user.hasConsent = false;
  await user.save();

  // Mark typing profile as disabled upon consent revocation
  await TypingProfile.findOneAndUpdate(
    { userId: user._id },
    { status: PROFILE_STATUS.DISABLED }
  );

  await logAuditEvent({
    actorId: user._id,
    actorUsername: user.username,
    action: "CONSENT_WITHDRAWN",
    resourceType: "ConsentRecord",
    resourceId: record._id.toString(),
    ipAddress: req.ip,
  });

  res.json({
    ok: true,
    message: "Consent successfully withdrawn. Keystroke timing collection is disabled.",
    hasConsent: false,
  });
});
