import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { TypingSample } from "../../models/TypingSample.js";
import { ConsentRecord } from "../../models/ConsentRecord.js";
import { extractFeaturesFromTiming } from "../../services/featureExtractor.js";
import { logAuditEvent } from "../../services/auditService.js";
import { mlClient } from "../../services/mlClient.js";
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
        isModelBuilt: false,
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
    let modelBuildResult = null;

    // Automatically build & save the model completely once required baseline samples exist
    if (newCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
      try {
        const allSamples = await TypingSample.find({
          userId: user._id,
          qualityStatus: { $ne: "rejected" },
        }).sort({ createdAt: -1 });
        const featureVectors = allSamples.map((s) => s.featureVector);

        modelBuildResult = await mlClient.buildAndSaveModel(user._id.toString(), featureVectors);
        profile.isModelBuilt = true;
        profile.modelTrainedAt = new Date(modelBuildResult.trainedAt);
        profile.modelSampleCount = modelBuildResult.sampleCount;
        profile.stabilityScore = modelBuildResult.trainingMetrics?.stability_score;
        profile.calibratedThreshold = modelBuildResult.calibratedThreshold;
      } catch (err: any) {
        console.error("Auto model build error during enrollment:", err.message);
      }
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
      metadata: { sampleCount: newCount, qualityStatus, isModelBuilt: profile.isModelBuilt },
    });

    res.status(201).json({
      ok: true,
      message:
        newCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED
          ? "Enrolment complete! Model built and saved. Profile is ready for instant verification."
          : `Sample ${newCount} of ${ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} saved successfully.`,
      sampleId: sample._id,
      count: newCount,
      required: ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED,
      profileStatus: profile.status,
      qualityStatus,
      features,
      isModelBuilt: profile.isModelBuilt,
      modelTrainedAt: profile.modelTrainedAt,
      modelBuildResult,
    });
  }
);

/**
 * POST /api/v1/enrollment/build-model
 * Explicitly trains and serializes the user's keystroke biometric model to disk.
 * Subsequent verifications will use the saved model with zero re-training.
 */
enrollmentRouter.post("/build-model", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  let profile = await TypingProfile.findOne({ userId: user._id });
  const samples = await TypingSample.find({
    userId: user._id,
    qualityStatus: { $ne: "rejected" },
  }).sort({ createdAt: -1 });

  if (samples.length === 0) {
    res.status(400).json({
      ok: false,
      error: "No enrolled samples available to build biometric model. Please record enrollment samples first.",
      code: "NO_SAMPLES",
    });
    return;
  }

  try {
    const featureVectors = samples.map((s) => s.featureVector);
    const buildResult = await mlClient.buildAndSaveModel(user._id.toString(), featureVectors);

    if (!profile) {
      profile = await TypingProfile.create({
        userId: user._id,
        status: samples.length >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED ? PROFILE_STATUS.READY_FOR_TESTING : PROFILE_STATUS.ENROLLING,
        enrollmentCount: samples.length,
      });
    }

    profile.isModelBuilt = true;
    profile.modelTrainedAt = new Date(buildResult.trainedAt);
    profile.modelSampleCount = buildResult.sampleCount;
    profile.stabilityScore = buildResult.trainingMetrics?.stability_score;
    profile.calibratedThreshold = buildResult.calibratedThreshold;
    if (samples.length >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
    }
    await profile.save();

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "MODEL_BUILT_AND_SAVED",
      resourceType: "TypingProfile",
      resourceId: profile._id.toString(),
      ipAddress: req.ip,
      metadata: { sampleCount: buildResult.sampleCount, savedPath: buildResult.savedPath },
    });

    res.json({
      ok: true,
      message: "Biometric model built and saved completely. Future verifications will run from this saved model without retraining.",
      buildResult,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to build and save model.",
      code: "BUILD_FAILED",
    });
  }
});

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
    isModelBuilt: profile?.isModelBuilt || false,
    modelTrainedAt: profile?.modelTrainedAt,
    stabilityScore: profile?.stabilityScore,
    calibratedThreshold: profile?.calibratedThreshold,
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
      profile.isModelBuilt = false;
      // Invalidate saved model if sample count dropped below required
      await mlClient.deleteSavedModel(user._id.toString()).catch(() => {});
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
    isModelBuilt: profile?.isModelBuilt || false,
  });
});

/**
 * POST /api/v1/enrollment/finalize
 */
enrollmentRouter.post("/finalize", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const profile = await TypingProfile.findOne({ userId: user._id });
  const samples = await TypingSample.find({
    userId: user._id,
    qualityStatus: "valid",
  }).sort({ createdAt: -1 });

  const count = samples.length;

  if (count < ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
    res.status(400).json({
      ok: false,
      error: `Cannot finalise enrolment: ${count} of ${ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} valid samples recorded.`,
      code: "INSUFFICIENT_SAMPLES",
    });
    return;
  }

  // Ensure model is built and saved completely
  try {
    const featureVectors = samples.map((s) => s.featureVector);
    const buildResult = await mlClient.buildAndSaveModel(user._id.toString(), featureVectors);

    if (profile) {
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
      profile.enrollmentCount = count;
      profile.isModelBuilt = true;
      profile.modelTrainedAt = new Date(buildResult.trainedAt);
      profile.modelSampleCount = buildResult.sampleCount;
      profile.stabilityScore = buildResult.trainingMetrics?.stability_score;
      profile.calibratedThreshold = buildResult.calibratedThreshold;
      await profile.save();
    }

    res.json({
      ok: true,
      message: "Enrolment finalised. Biometric model built and saved completely.",
      profileStatus: PROFILE_STATUS.READY_FOR_TESTING,
      buildResult,
    });
  } catch (err: any) {
    if (profile) {
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
      profile.enrollmentCount = count;
      await profile.save();
    }

    res.json({
      ok: true,
      message: "Enrolment finalised. Profile status updated.",
      profileStatus: PROFILE_STATUS.READY_FOR_TESTING,
    });
  }
});

