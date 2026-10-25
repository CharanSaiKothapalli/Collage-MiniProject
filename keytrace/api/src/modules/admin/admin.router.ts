import { Router, Request, Response } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { User } from "../../models/User.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { TypingSample } from "../../models/TypingSample.js";
import { VerificationEvent } from "../../models/VerificationEvent.js";
import { VerificationSession } from "../../models/VerificationSession.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { AuditEvent } from "../../models/AuditEvent.js";
import { mlClient } from "../../services/mlClient.js";
import { logAuditEvent } from "../../services/auditService.js";
import { USER_ROLE, PROFILE_STATUS, VERIFICATION_DECISION } from "@keytrace/shared";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole(USER_ROLE.ADMIN));

/**
 * GET /api/v1/admin/overview
 */
adminRouter.get("/overview", async (req: Request, res: Response): Promise<void> => {
  const [
    totalUsers,
    enrolledUsers,
    enrollingUsers,
    totalSamples,
    totalVerificationEvents,
    matchCount,
    reviewCount,
    insufficientCount,
    mlHealth,
    activeModel,
  ] = await Promise.all([
    User.countDocuments(),
    TypingProfile.countDocuments({ status: PROFILE_STATUS.READY_FOR_TESTING }),
    TypingProfile.countDocuments({ status: PROFILE_STATUS.ENROLLING }),
    TypingSample.countDocuments(),
    VerificationEvent.countDocuments(),
    VerificationEvent.countDocuments({ decision: VERIFICATION_DECISION.MATCH }),
    VerificationEvent.countDocuments({ decision: VERIFICATION_DECISION.REVIEW }),
    VerificationEvent.countDocuments({ decision: VERIFICATION_DECISION.INSUFFICIENT_DATA }),
    mlClient.checkHealth(),
    ModelRegistry.findOne({ deploymentStatus: "active" }),
  ]);

  res.json({
    ok: true,
    stats: {
      totalUsers,
      enrolledUsers,
      enrollingUsers,
      totalEnrollmentSamples: totalSamples,
      totalVerificationEvents,
      recentVerificationDecisions: {
        match: matchCount,
        review: reviewCount,
        insufficientData: insufficientCount,
      },
      mlServiceStatus: mlHealth.status,
      activeModelVersion: activeModel?.modelVersion || "v1.2.0-robust-distance",
    },
  });
});

/**
 * GET /api/v1/admin/users
 */
adminRouter.get("/users", async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}, "-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(),
  ]);

  const userIds = users.map((u) => u._id);
  const profiles = await TypingProfile.find({ userId: { $in: userIds } });
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const enrichedUsers = users.map((u) => {
    const prof = profileMap.get(u._id.toString());
    return {
      id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      accountStatus: u.accountStatus,
      hasConsent: u.hasConsent,
      profileStatus: prof?.status || PROFILE_STATUS.NOT_ENROLLED,
      sampleCount: prof?.enrollmentCount || 0,
      createdAt: u.createdAt,
    };
  });

  res.json({
    ok: true,
    users: enrichedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * POST /api/v1/admin/users/:userId/role
 */
adminRouter.post("/users/:userId/role", async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { role } = req.body;

  if (role !== USER_ROLE.USER && role !== USER_ROLE.ADMIN) {
    res.status(400).json({ ok: false, error: "Invalid role specified", code: "INVALID_ROLE" });
    return;
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    res.status(404).json({ ok: false, error: "User not found", code: "NOT_FOUND" });
    return;
  }

  targetUser.role = role;
  await targetUser.save();

  await logAuditEvent({
    actorId: req.user!._id,
    actorUsername: req.user!.username,
    action: "USER_ROLE_UPDATED",
    resourceType: "User",
    resourceId: targetUser._id.toString(),
    metadata: { newRole: role },
  });

  res.json({
    ok: true,
    message: `User role updated to ${role}.`,
    user: { id: targetUser._id, username: targetUser.username, role: targetUser.role },
  });
});

/**
 * GET /api/v1/admin/models
 */
adminRouter.get("/models", async (req: Request, res: Response): Promise<void> => {
  const models = await ModelRegistry.find().sort({ createdAt: -1 });

  res.json({
    ok: true,
    models,
  });
});

/**
 * GET /api/v1/admin/audit-events
 */
adminRouter.get("/audit-events", async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    AuditEvent.find().sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditEvent.countDocuments(),
  ]);

  res.json({
    ok: true,
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
