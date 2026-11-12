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

    // Prevent accidental duplicate submission of the exact same session
    if (payload.sessionId) {
      const existingSession = await TypingSample.findOne({
        userId: user._id,
        sessionId: payload.sessionId,
      });
      if (existingSession) {
        res.status(409).json({
          ok: false,
          error: "This session has already been recorded. Duplicate submission rejected.",
          code: "DUPLICATE_SESSION",
        });
        return;
      }
    }

    const sampleType = payload.sampleType || "calibration";

    // Prevent excess sample submission if profile is already fully enrolled and model is active
    if (profile.isModelBuilt && profile.status === PROFILE_STATUS.READY_FOR_TESTING) {
      const currentCount = await TypingSample.countDocuments({
        userId: user._id,
        qualityStatus: { $ne: "rejected" },
      });
      if (currentCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) {
        res.status(400).json({
          ok: false,
          error: "Enrollment is already complete and the hybrid model is active. Please proceed to Verification or delete a sample before recording new ones.",
          code: "ENROLLMENT_ALREADY_COMPLETE",
        });
        return;
      }
    }

    // Prevent exceeding stage capacity
    if (sampleType === "calibration") {
      const calCount = await TypingSample.countDocuments({
        userId: user._id,
        $or: [
          { sampleType: "calibration" },
          { sampleType: { $exists: false } },
          { sampleType: null },
          { sampleType: "" },
        ],
        qualityStatus: { $ne: "rejected" },
      });
      if (calCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES) {
        res.status(400).json({
          ok: false,
          error: "Stage 1 (Reference Calibration) is already complete with 5 samples. Please proceed to Stage 2 (Natural Typing).",
          code: "STAGE_FULL",
        });
        return;
      }
    } else if (sampleType === "natural") {
      const natCount = await TypingSample.countDocuments({
        userId: user._id,
        sampleType: "natural",
        qualityStatus: { $ne: "rejected" },
      });
      if (natCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES) {
        res.status(400).json({
          ok: false,
          error: "Stage 2 (Natural Typing) is already complete with 5 samples. Please compile your hybrid model or proceed to Verification.",
          code: "STAGE_FULL",
        });
        return;
      }
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
    const minObs = payload.sampleType === "natural"
      ? ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_NATURAL
      : ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_SAMPLE;

    const qualityStatus =
      features.std_hold > 0 && features.std_flight > 0 && payload.observations.length >= minObs
        ? "valid"
        : "warning";

    const latestConsent = await ConsentRecord.findOne({ userId: user._id }).sort({ timestamp: -1 });

    const sample = await TypingSample.create({
      userId: user._id,
      profileId: profile._id,
      sampleType,
      featureVector: features,
      featureSchemaVersion: CURRENT_FEATURE_SCHEMA_VERSION,
      qualityStatus,
      sessionId: payload.sessionId,
      consentReference: latestConsent?._id,
    });

    const [calibrationCount, naturalCount, totalRecorded] = await Promise.all([
      TypingSample.countDocuments({
        userId: user._id,
        $or: [
          { sampleType: "calibration" },
          { sampleType: { $exists: false } },
          { sampleType: null },
          { sampleType: "" },
        ],
        qualityStatus: { $ne: "rejected" },
      }),
      TypingSample.countDocuments({
        userId: user._id,
        sampleType: "natural",
        qualityStatus: { $ne: "rejected" },
      }),
      TypingSample.countDocuments({
        userId: user._id,
      }),
    ]);

    const totalValid = calibrationCount + naturalCount;

    profile.enrollmentCount = totalValid;
    profile.calibrationCount = calibrationCount;
    profile.naturalCount = naturalCount;

    let stage = "calibration";
    if (calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES) {
      if (naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES) {
        stage = "complete";
      } else {
        stage = "natural";
      }
    }
    profile.enrollmentStage = stage;

    let modelBuildResult = null;

    // Automatically build & save the model completely once required baseline samples exist
    const isReadyToBuild =
      calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES &&
      naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES;

    if (isReadyToBuild) {
      try {
        const allSamples = await TypingSample.find({
          userId: user._id,
          qualityStatus: { $ne: "rejected" },
        }).sort({ createdAt: -1 });
        const featureVectors = allSamples.map((s) => s.featureVector);
        const sampleTypes = allSamples.map((s) => s.sampleType || "calibration");

        modelBuildResult = await mlClient.buildAndSaveModel(
          user._id.toString(),
          featureVectors,
          ENROLLMENT_THRESHOLDS.DEFAULT_DISTANCE_THRESHOLD,
          sampleTypes
        );

        // Verify model artifact can be retrieved and loaded from disk
        const verifiedModel = await mlClient.getSavedModelInfo(user._id.toString());
        if (!verifiedModel.exists) {
          throw new Error("Serialized model verification failed: model artifact not loadable from disk.");
        }

        profile.isModelBuilt = true;
        profile.status = PROFILE_STATUS.READY_FOR_TESTING;
        profile.modelTrainedAt = new Date(modelBuildResult.trainedAt);
        profile.modelSampleCount = modelBuildResult.sampleCount;
        profile.stabilityScore = modelBuildResult.trainingMetrics?.stability_score;
        profile.calibratedThreshold = modelBuildResult.calibratedThreshold;
      } catch (err: any) {
        console.error("Auto model build error during enrollment:", err.message);
        profile.isModelBuilt = false;
        profile.status = PROFILE_STATUS.ENROLLING;
      }
    } else {
      profile.status = PROFILE_STATUS.ENROLLING;
      profile.isModelBuilt = false;
    }
    await profile.save();

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "ENROLLMENT_SAMPLE_RECORDED",
      resourceType: "TypingSample",
      resourceId: sample._id.toString(),
      ipAddress: req.ip,
      metadata: {
        sampleCount: totalValid,
        calibrationCount,
        naturalCount,
        stage,
        qualityStatus,
        isModelBuilt: profile.isModelBuilt,
      },
    });

    const completionMessage =
      stage === "complete"
        ? "Hybrid enrolment complete! Model built and saved. Profile is ready for instant verification."
        : stage === "natural"
        ? `Reference calibration complete! Now in Natural Typing mode (${naturalCount}/${ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES} samples).`
        : `Calibration sample ${calibrationCount} of ${ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES} recorded.`;

    res.status(201).json({
      ok: true,
      message: completionMessage,
      sampleId: sample._id,
      count: totalValid,
      calibrationCount,
      naturalCount,
      minCalibrationRequired: ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES,
      minNaturalRequired: ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES,
      stage,
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

  const calibrationCount = samples.filter((s) => s.sampleType !== "natural").length;
  const naturalCount = samples.filter((s) => s.sampleType === "natural").length;

  if (
    calibrationCount < ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES ||
    naturalCount < ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES
  ) {
    res.status(400).json({
      ok: false,
      error: `Insufficient samples for hybrid model compilation: requires at least 5 calibration samples (recorded: ${calibrationCount}) and 5 natural typing samples (recorded: ${naturalCount}).`,
      code: "INSUFFICIENT_SAMPLES",
      calibrationCount,
      naturalCount,
      requiredCalibration: ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES,
      requiredNatural: ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES,
    });
    return;
  }

  try {
    const featureVectors = samples.map((s) => s.featureVector);
    const sampleTypes = samples.map((s) => s.sampleType || "calibration");
    const buildResult = await mlClient.buildAndSaveModel(
      user._id.toString(),
      featureVectors,
      ENROLLMENT_THRESHOLDS.DEFAULT_DISTANCE_THRESHOLD,
      sampleTypes
    );

    // Verify model artifact can be retrieved and loaded from disk
    const verifiedModel = await mlClient.getSavedModelInfo(user._id.toString());
    if (!verifiedModel.exists) {
      throw new Error("Serialized model verification failed: model artifact not loadable from disk.");
    }

    let stage = "calibration";
    if (calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES) {
      if (naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES) {
        stage = "complete";
      } else {
        stage = "natural";
      }
    }

    if (!profile) {
      profile = await TypingProfile.create({
        userId: user._id,
        status: PROFILE_STATUS.READY_FOR_TESTING,
        enrollmentCount: samples.length,
        calibrationCount,
        naturalCount,
        enrollmentStage: stage,
      });
    } else {
      profile.calibrationCount = calibrationCount;
      profile.naturalCount = naturalCount;
      profile.enrollmentCount = samples.length;
      profile.enrollmentStage = stage;
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
    }

    profile.isModelBuilt = true;
    profile.modelTrainedAt = new Date(buildResult.trainedAt);
    profile.modelSampleCount = buildResult.sampleCount;
    profile.stabilityScore = buildResult.trainingMetrics?.stability_score;
    profile.calibratedThreshold = buildResult.calibratedThreshold;
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
      message: "Hybrid biometric model built and saved completely. Future verifications will run from this saved model without retraining.",
      buildResult,
    });
  } catch (err: any) {
    if (profile) {
      profile.isModelBuilt = false;
      await profile.save();
    }
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

  const [calibrationCount, naturalCount, totalSamples] = await Promise.all([
    TypingSample.countDocuments({
      userId: user._id,
      $or: [
        { sampleType: "calibration" },
        { sampleType: { $exists: false } },
        { sampleType: null },
        { sampleType: "" },
      ],
      qualityStatus: { $ne: "rejected" },
    }),
    TypingSample.countDocuments({
      userId: user._id,
      sampleType: "natural",
      qualityStatus: { $ne: "rejected" },
    }),
    TypingSample.countDocuments({ userId: user._id }),
  ]);

  const validSamples = calibrationCount + naturalCount;

  let stage = "calibration";
  if (calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES) {
    if (naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES) {
      stage = "complete";
    } else {
      stage = "natural";
    }
  }

  // Check whether saved model actually exists on disk
  let savedModelExists = false;
  if (profile?.isModelBuilt) {
    const modelCheck = await mlClient.getSavedModelInfo(user._id.toString());
    savedModelExists = modelCheck.exists;
    if (!savedModelExists) {
      profile.isModelBuilt = false;
      if (profile.status === PROFILE_STATUS.READY_FOR_TESTING) {
        profile.status = stage === "complete" ? PROFILE_STATUS.ENROLLING : PROFILE_STATUS.ENROLLING;
      }
    }
  }

  // Always keep profile.enrollmentCount, calibrationCount, naturalCount in sync with DB
  if (profile) {
    let profileUpdated = false;
    if (profile.enrollmentCount !== validSamples) {
      profile.enrollmentCount = validSamples;
      profileUpdated = true;
    }
    if (profile.calibrationCount !== calibrationCount) {
      profile.calibrationCount = calibrationCount;
      profileUpdated = true;
    }
    if (profile.naturalCount !== naturalCount) {
      profile.naturalCount = naturalCount;
      profileUpdated = true;
    }
    if (profile.enrollmentStage !== stage) {
      profile.enrollmentStage = stage;
      profileUpdated = true;
    }
    if (profileUpdated) {
      await profile.save();
    }
  }

  const isReady =
    profile?.isModelBuilt &&
    savedModelExists &&
    calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES &&
    naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES;

  res.json({
    ok: true,
    status: isReady ? PROFILE_STATUS.READY_FOR_TESTING : (profile?.status || PROFILE_STATUS.NOT_ENROLLED),
    count: validSamples,
    calibrationCount,
    naturalCount,
    minCalibrationRequired: ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES,
    minNaturalRequired: ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES,
    stage,
    totalRecorded: totalSamples,
    required: ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED,
    isReady: !!isReady,
    isModelBuilt: !!(profile?.isModelBuilt && savedModelExists),
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
      sampleType: s.sampleType || "calibration",
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

  const [calibrationCount, naturalCount] = await Promise.all([
    TypingSample.countDocuments({
      userId: user._id,
      $or: [
        { sampleType: "calibration" },
        { sampleType: { $exists: false } },
        { sampleType: null },
        { sampleType: "" },
      ],
      qualityStatus: { $ne: "rejected" },
    }),
    TypingSample.countDocuments({
      userId: user._id,
      sampleType: "natural",
      qualityStatus: { $ne: "rejected" },
    }),
  ]);

  const count = calibrationCount + naturalCount;

  let stage = "calibration";
  if (calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES) {
    if (naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES) {
      stage = "complete";
    } else {
      stage = "natural";
    }
  }

  const profile = await TypingProfile.findOne({ userId: user._id });
  if (profile) {
    profile.enrollmentCount = count;
    profile.calibrationCount = calibrationCount;
    profile.naturalCount = naturalCount;
    profile.enrollmentStage = stage;
    if (
      calibrationCount < ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES ||
      naturalCount < ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES
    ) {
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
    calibrationCount,
    naturalCount,
    stage,
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

  const calibrationCount = samples.filter((s) => s.sampleType !== "natural").length;
  const naturalCount = samples.filter((s) => s.sampleType === "natural").length;

  if (
    calibrationCount < ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES ||
    naturalCount < ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES
  ) {
    res.status(400).json({
      ok: false,
      error: `Cannot finalise enrolment: requires at least 5 calibration samples (${calibrationCount}/5) and 5 natural typing samples (${naturalCount}/5).`,
      code: "INSUFFICIENT_SAMPLES",
      calibrationCount,
      naturalCount,
    });
    return;
  }

  // Ensure model is built and saved completely
  try {
    const featureVectors = samples.map((s) => s.featureVector);
    const sampleTypes = samples.map((s) => s.sampleType || "calibration");
    const buildResult = await mlClient.buildAndSaveModel(
      user._id.toString(),
      featureVectors,
      ENROLLMENT_THRESHOLDS.DEFAULT_DISTANCE_THRESHOLD,
      sampleTypes
    );

    // Verify model artifact can be retrieved and loaded from disk
    const verifiedModel = await mlClient.getSavedModelInfo(user._id.toString());
    if (!verifiedModel.exists) {
      throw new Error("Serialized model verification failed: model artifact not loadable from disk.");
    }

    if (profile) {
      profile.status = PROFILE_STATUS.READY_FOR_TESTING;
      profile.enrollmentCount = samples.length;
      profile.calibrationCount = calibrationCount;
      profile.naturalCount = naturalCount;
      profile.enrollmentStage = "complete";
      profile.isModelBuilt = true;
      profile.modelTrainedAt = new Date(buildResult.trainedAt);
      profile.modelSampleCount = buildResult.sampleCount;
      profile.stabilityScore = buildResult.trainingMetrics?.stability_score;
      profile.calibratedThreshold = buildResult.calibratedThreshold;
      await profile.save();
    }

    res.json({
      ok: true,
      message: "Enrolment finalised. Hybrid biometric model built and verified on disk.",
      profileStatus: PROFILE_STATUS.READY_FOR_TESTING,
      buildResult,
    });
  } catch (err: any) {
    if (profile) {
      profile.isModelBuilt = false;
      await profile.save();
    }

    res.status(500).json({
      ok: false,
      error: `Model compilation failed: ${err.message}`,
      code: "COMPILATION_FAILED",
      profileStatus: profile?.status,
    });
  }
});

