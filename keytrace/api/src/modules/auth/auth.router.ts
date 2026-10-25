import { Router, Request, Response } from "express";
import { User } from "../../models/User.js";
import { TypingProfile } from "../../models/TypingProfile.js";
import { ConsentRecord } from "../../models/ConsentRecord.js";
import { hashPassword, verifyPassword, signToken, generateCsrfToken } from "../../utils/security.js";
import { config } from "../../config/index.js";
import { authenticate } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../middleware/validate.js";
import { logAuditEvent } from "../../services/auditService.js";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ChangePasswordSchema,
  PROFILE_STATUS,
} from "@keytrace/shared";

export const authRouter = Router();

function setAuthCookies(res: Response, token: string, csrfToken: string) {
  // Set secure HTTP-only session cookie
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  // Set CSRF token cookie readable by JavaScript
  res.cookie("keytrace_csrf", csrfToken, {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

/**
 * POST /api/v1/auth/register
 */
authRouter.post(
  "/register",
  authRateLimiter,
  validate({ body: RegisterRequestSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      res.status(409).json({
        ok: false,
        error: "An account with that username or email address already exists.",
        code: "USER_ALREADY_EXISTS",
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role: "user",
      accountStatus: "active",
      hasConsent: false,
    });

    // Initialize blank typing profile
    await TypingProfile.create({
      userId: user._id,
      status: PROFILE_STATUS.NOT_ENROLLED,
      enrollmentCount: 0,
    });

    const token = signToken({ userId: user._id.toString(), username: user.username, role: user.role });
    const csrfToken = generateCsrfToken();
    setAuthCookies(res, token, csrfToken);

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "USER_REGISTERED",
      resourceType: "User",
      resourceId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      ok: true,
      message: "Registration successful. Please review and accept the behavioural biometric consent terms.",
      csrfToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasConsent: false,
        profileStatus: PROFILE_STATUS.NOT_ENROLLED,
        sampleCount: 0,
      },
    });
  }
);

/**
 * POST /api/v1/auth/login
 */
authRouter.post(
  "/login",
  authRateLimiter,
  validate({ body: LoginRequestSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [
        { username: emailOrUsername },
        { email: emailOrUsername.toLowerCase() },
      ],
    });

    if (!user) {
      res.status(401).json({
        ok: false,
        error: "Invalid username or password.",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAuditEvent({
        actorUsername: emailOrUsername,
        action: "FAILED_LOGIN_ATTEMPT",
        resourceType: "User",
        ipAddress: req.ip,
      });

      res.status(401).json({
        ok: false,
        error: "Invalid username or password.",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    if (user.accountStatus !== "active") {
      res.status(403).json({
        ok: false,
        error: "Your account is suspended or pending deletion.",
        code: "ACCOUNT_SUSPENDED",
      });
      return;
    }

    const token = signToken({ userId: user._id.toString(), username: user.username, role: user.role });
    const csrfToken = generateCsrfToken();
    setAuthCookies(res, token, csrfToken);

    const profile = await TypingProfile.findOne({ userId: user._id });

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.json({
      ok: true,
      message: "Login successful.",
      csrfToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasConsent: user.hasConsent,
        profileStatus: profile?.status || PROFILE_STATUS.NOT_ENROLLED,
        sampleCount: profile?.enrollmentCount || 0,
      },
    });
  }
);

/**
 * POST /api/v1/auth/logout
 */
authRouter.post("/logout", authenticate, async (req: Request, res: Response): Promise<void> => {
  res.clearCookie(config.cookieName, { path: "/" });
  res.clearCookie("keytrace_csrf", { path: "/" });

  if (req.user) {
    await logAuditEvent({
      actorId: req.user._id,
      actorUsername: req.user.username,
      action: "USER_LOGOUT",
      resourceType: "User",
      resourceId: req.user._id.toString(),
      ipAddress: req.ip,
    });
  }

  res.json({ ok: true, message: "Logged out successfully." });
});

/**
 * GET /api/v1/auth/me
 */
authRouter.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const profile = await TypingProfile.findOne({ userId: user._id });
  const csrfToken = req.cookies?.["keytrace_csrf"] || generateCsrfToken();

  // Refresh csrf cookie if missing
  if (!req.cookies?.["keytrace_csrf"]) {
    res.cookie("keytrace_csrf", csrfToken, {
      httpOnly: false,
      secure: config.cookieSecure,
      sameSite: config.cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }

  res.json({
    ok: true,
    csrfToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasConsent: user.hasConsent,
      profileStatus: profile?.status || PROFILE_STATUS.NOT_ENROLLED,
      sampleCount: profile?.enrollmentCount || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * POST /api/v1/auth/change-password
 */
authRouter.post(
  "/change-password",
  authenticate,
  validate({ body: ChangePasswordSchema }),
  async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        ok: false,
        error: "Incorrect current password.",
        code: "INVALID_CURRENT_PASSWORD",
      });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await logAuditEvent({
      actorId: user._id,
      actorUsername: user.username,
      action: "PASSWORD_CHANGED",
      resourceType: "User",
      resourceId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.json({ ok: true, message: "Password updated successfully." });
  }
);
