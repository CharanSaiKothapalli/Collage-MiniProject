import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { TypingSample } from "../../models/TypingSample.js";
import { ConsentRecord } from "../../models/ConsentRecord.js";
import { extractFeaturesFromTiming } from "../../services/featureExtractor.js";
import { logAuditEvent } from "../../services/auditService.js";
import {
  KeystrokeSessionPayloadSchema,
  ENROLLMENT_THRESHOLDS,
  PROFILE_STATUS,
  CURRENT_FEATURE_SCHEMA_VERSION,
} from "@keytrace/shared";

export const enrollmentRouter = Router();

enrollmentRouter.use(authenticate);

/**
 * Middleware: require active behavioural consent before enrolment operations
 */
function requireActiveConsent(req: Request, res: Response, next: () => void) {
  if (!req.user?.hasConsent) {
    res.status(403).json({
      ok: false,
      error: "Active informed consent is required before recording behavioural timing data.",
      code: "CONSENT_REQUIRED",
    });
    return;
  }
  next();
}

/**
 * POST /api/v1/enrollment/sessions
 */
enrollmentRouter.post(
  "/sessions",
  requireActiveConsent,
  validate({ body: KeystrokeSessionPayloadSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const payload = req.body;

    let profile = await TypingProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = await TypingProfile.create({
        userId: user._id,
        status: PROFILE_STATUS.ENROLLING,
        enrollmentCount: 0,
      });
    }

    if (profile.status === PROFILE_STATUS.DISABLED) {
      res.status(400).json({
        ok: false,
        error: "Profile is currently disabled. Please review consent settings.",
        code: "PROFILE_DISABLED",
      });
      return;
    }

    // Extract deterministic feature vector from timing observations
    let features;
    try {
      features = extractFeaturesFromTiming(payload.observations, payload.elapsedMs);
    } catch (err: any) {
      res.status(400).json({
        ok: false,
        error: err.message,
        code: "INVALID_TIMING_PAYLOAD",
      });
      return;
    }

    // Quality assessment: verify typing cadence variability and minimum key count
    const qualityStatus =
      features.std_hold > 0 && features.std_flight > 0 && payload.observations.length >= 8
        ? "valid"
        : "warning";

    const latestConsent = await ConsentRecord.findOne({ userId: user._id }).sort({ timestamp: -1 });

    const sample = await TypingSample.create({
      userId: user._id,
      profileId: profile._id,
      featureVector: features,
      featureSchemaVersion: CURRENT_FEATURE_SCHEMA_VERSION,
      qualityStatus,
      sessionId: payload.sessionId,
      consentReference: latestConsent?._id,
    });

    const newCount = await TypingSample.countDocuments({
      userId: user._id,
      qualityStatus: { $ne: "rejected" },
    });

    profile.enrollmentCount = newCount;
    if (newCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
    } else {
      profile.status = PROFILE_STATUS.ENROLLING;
    }
    await profile.save();

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "ENROLLMENT_SAMPLE_RECORDED",
      resourceType: "TypingSample",
      resourceId: sample._id.toString(),
      ipAddress: req.ip,
      metadata: { sampleCount: newCount, qualityStatus },
    });

    res.status(201).json({
      ok: true,
      message:
        newCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED
          ? "Enrolment complete! Profile is ready for behavioural verification."
          : `Sample ${newCount} of ${ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} saved successfully.`,
      sampleId: sample._id,
      count: newCount,
      required: ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED,
      profileStatus: profile.status,
      qualityStatus,
      features,
    });
  }
);

/**
 * GET /api/v1/enrollment/status
 */
enrollmentRouter.get("/status", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  let profile = await TypingProfile.findOne({ userId: user._id });

  const totalSamples = await TypingSample.countDocuments({ userId: user._id });
  const validSamples = await TypingSample.countDocuments({ userId: user._id, qualityStatus: "valid" });

  res.json({
    ok: true,
    status: profile?.status || PROFILE_STATUS.NOT_ENROLLED,
    count: validSamples,
    totalRecorded: totalSamples,
    required: ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED,
    isReady: (profile?.enrollmentCount || 0) >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED,
  });
});

/**
 * GET /api/v1/enrollment/samples
 */
enrollmentRouter.get("/samples", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const samples = await TypingSample.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    ok: true,
    samples: samples.map((s) => ({
      id: s._id,
      sessionId: s.sessionId,
      featureVector: s.featureVector,
      qualityStatus: s.qualityStatus,
      createdAt: s.createdAt,
    })),
  });
});

/**
 * DELETE /api/v1/enrollment/samples/:sampleId
 */
enrollmentRouter.delete("/samples/:sampleId", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { sampleId } = req.params;

  const sample = await TypingSample.findOne({ _id: sampleId, userId: user._id });
  if (!sample) {
    res.status(404).json({ ok: false, error: "Sample not found.", code: "NOT_FOUND" });
    return;
  }

  await sample.deleteOne();

  const count = await TypingSample.countDocuments({
    userId: user._id,
    qualityStatus: { $ne: "rejected" },
  });

  const profile = await TypingProfile.findOne({ userId: user._id });
  if (profile) {
    profile.enrollmentCount = count;
    if (count < ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
      profile.status = count === 0 ? PROFILE_STATUS.NOT_ENROLLED : PROFILE_STATUS.NEEDS_MORE_DATA;
    }
    await profile.save();
  }

  await logAuditEvent({
    actorId: user._id,
    actorUsername: user.username,
    action: "ENROLLMENT_SAMPLE_DELETED",
    resourceType: "TypingSample",
    resourceId: sampleId,
    ipAddress: req.ip,
  });

  res.json({
    ok: true,
    message: "Enrolment sample deleted.",
    remainingCount: count,
    profileStatus: profile?.status,
  });
});

/**
 * POST /api/v1/enrollment/finalize
 */
enrollmentRouter.post("/finalize", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const profile = await TypingProfile.findOne({ userId: user._id });
  const count = await TypingSample.countDocuments({
    userId: user._id,
    qualityStatus: "valid",
  });

  if (count < ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
    res.status(400).json({
      ok: false,
      error: `Cannot finalise enrolment: ${count} of ${ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} valid samples recorded.`,
      code: "INSUFFICIENT_SAMPLES",
    });
    return;
  }

  if (profile) {
    profile.status = PROFILE_STATUS.READY_FOR_TESTING;
    profile.enrollmentCount = count;
    await profile.save();
  }

  res.json({
    ok: true,
    message: "Enrolment finalised. Behavioural profile is ready.",
    profileStatus: PROFILE_STATUS.READY_FOR_TESTING,
  });
});
