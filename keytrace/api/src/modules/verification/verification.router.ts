import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { VerificationSession } from "../../models/VerificationSession.js";
import { VerificationEvent } from "../../models/VerificationEvent.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { TypingSample } from "../../models/TypingSample.js";
import { extractFeaturesFromTiming } from "../../services/featureExtractor.js";
import { mlClient } from "../../services/mlClient.js";
import { logAuditEvent } from "../../services/auditService.js";
import {
  EvaluateVerificationWindowSchema,
  StartVerificationSessionSchema,
  ENROLLMENT_THRESHOLDS,
  PROFILE_STATUS,
  VERIFICATION_DECISION,
  CURRENT_FEATURE_SCHEMA_VERSION,
} from "@keytrace/shared";

export const verificationRouter = Router();

verificationRouter.use(authenticate);

/**
 * POST /api/v1/verification/sessions
 * Starts an explicit continuous/repeated verification session.
 */
verificationRouter.post(
  "/sessions",
  validate({ body: StartVerificationSessionSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;

    if (!user.hasConsent) {
      res.status(403).json({
        ok: false,
        error: "Active consent is required to perform behavioural verification.",
        code: "CONSENT_REQUIRED",
      });
      return;
    }

    const profile = await TypingProfile.findOne({ userId: user._id });
    const sampleCount = await TypingSample.countDocuments({
      userId: user._id,
      qualityStatus: { $ne: "rejected" },
    });

    if (sampleCount < 1) {
      res.status(400).json({
        ok: false,
        error: "Profile has no enrolled samples. Please complete enrolment before verification.",
        code: "PROFILE_NOT_READY",
      });
      return;
    }

    const session = await VerificationSession.create({
      userId: user._id,
      status: "active",
      startTimestamp: new Date(),
      totalEvaluations: 0,
      matchCount: 0,
      reviewCount: 0,
      aggregateResult: VERIFICATION_DECISION.MATCH,
      clientMetadata: req.body?.clientMetadata,
    });

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "VERIFICATION_SESSION_STARTED",
      resourceType: "VerificationSession",
      resourceId: session._id.toString(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      ok: true,
      message: "Continuous verification session initialized.",
      sessionId: session._id,
      session,
      profileStatus: profile?.status || PROFILE_STATUS.NOT_ENROLLED,
      enrolledSampleCount: sampleCount,
    });
  }
);

/**
 * POST /api/v1/verification/sessions/:sessionId/evaluate
 * Evaluates an incoming typing window against enrolled profile.
 */
verificationRouter.post(
  "/sessions/:sessionId/evaluate",
  validate({ body: EvaluateVerificationWindowSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { sessionId } = req.params;
    const { payload } = req.body;

    const session = await VerificationSession.findOne({
      _id: sessionId,
      userId: user._id,
      status: "active",
    });

    if (!session) {
      res.status(404).json({
        ok: false,
        error: "Active verification session not found or session has ended.",
        code: "SESSION_NOT_FOUND",
      });
      return;
    }

    // Extract features for this evaluation window
    let currentFeatures;
    try {
      currentFeatures = extractFeaturesFromTiming(payload.observations, payload.elapsedMs);
    } catch (err: any) {
      res.status(400).json({
        ok: false,
        error: err.message,
        code: "INVALID_TIMING_PAYLOAD",
      });
      return;
    }

    // Retrieve user's enrolled profile samples
    const enrolledSamples = await TypingSample.find({
      userId: user._id,
      qualityStatus: { $ne: "rejected" },
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const featureVectors = enrolledSamples.map((s) => s.featureVector);

    // Call internal Python ML service
    const mlResult = await mlClient.predict(
      featureVectors,
      currentFeatures,
      ENROLLMENT_THRESHOLDS.DEFAULT_DISTANCE_THRESHOLD,
      user._id.toString()
    );

    // Persist verification event
    const event = await VerificationEvent.create({
      userId: user._id,
      sessionId: session._id,
      decision: mlResult.decision,
      score: mlResult.score,
      threshold: mlResult.threshold,
      reasonCodes: mlResult.reasonCodes,
      qualityWarnings: mlResult.qualityWarnings,
      modelVersion: mlResult.modelVersion,
      featureSchemaVersion: CURRENT_FEATURE_SCHEMA_VERSION,
      featureDeviations: mlResult.featureDeviations,
      anomalyScore: mlResult.anomalyScore,
      timestamp: new Date(),
    });

    // Update session metrics
    session.totalEvaluations += 1;
    if (mlResult.decision === VERIFICATION_DECISION.MATCH) {
      session.matchCount += 1;
    } else if (mlResult.decision === VERIFICATION_DECISION.REVIEW) {
      session.reviewCount += 1;
    }

    const matchRate = session.totalEvaluations > 0 ? session.matchCount / session.totalEvaluations : 1.0;
    session.aggregateResult =
      matchRate >= 0.6 ? VERIFICATION_DECISION.MATCH : VERIFICATION_DECISION.REVIEW;

    await session.save();

    res.json({
      ok: true,
      eventId: event._id,
      sessionId: session._id,
      decision: mlResult.decision,
      score: mlResult.score,
      threshold: mlResult.threshold,
      modelVersion: mlResult.modelVersion,
      featureSchemaVersion: CURRENT_FEATURE_SCHEMA_VERSION,
      reasonCodes: mlResult.reasonCodes,
      qualityWarnings: mlResult.qualityWarnings,
      featureDeviations: mlResult.featureDeviations,
      anomalyScore: mlResult.anomalyScore,
      createdAt: event.timestamp.toISOString(),
      sessionSummary: {
        totalEvaluations: session.totalEvaluations,
        matchCount: session.matchCount,
        reviewCount: session.reviewCount,
        matchRate: Number(matchRate.toFixed(2)),
      },
    });
  }
);

/**
 * GET /api/v1/verification/sessions/:sessionId
 */
verificationRouter.get("/sessions/:sessionId", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { sessionId } = req.params;

  const session = await VerificationSession.findOne({
    _id: sessionId,
    userId: user._id,
  });

  if (!session) {
    res.status(404).json({ ok: false, error: "Session not found", code: "NOT_FOUND" });
    return;
  }

  const events = await VerificationEvent.find({ sessionId: session._id }).sort({ timestamp: -1 });

  res.json({
    ok: true,
    session,
    events,
  });
});

/**
 * POST /api/v1/verification/sessions/:sessionId/end
 */
verificationRouter.post("/sessions/:sessionId/end", async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { sessionId } = req.params;

  const session = await VerificationSession.findOne({
    _id: sessionId,
    userId: user._id,
  });

  if (!session) {
    res.status(404).json({ ok: false, error: "Session not found", code: "NOT_FOUND" });
    return;
  }

  session.status = "completed";
  session.endTimestamp = new Date();
  await session.save();

  await logAuditEvent({
    actorId: user._id,
    actorUsername: user.username,
    action: "VERIFICATION_SESSION_ENDED",
    resourceType: "VerificationSession",
    resourceId: session._id.toString(),
    ipAddress: req.ip,
    metadata: {
      totalEvaluations: session.totalEvaluations,
      matchCount: session.matchCount,
      reviewCount: session.reviewCount,
    },
  });

  res.json({
    ok: true,
    message: "Continuous verification session ended successfully.",
    session,
  });
});
