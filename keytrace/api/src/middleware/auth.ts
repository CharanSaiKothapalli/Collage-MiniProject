import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";
import { verifyToken, TokenPayload } from "../utils/security.js";
import { User, IUser } from "../models/User.js";
import { USER_ROLE, UserRoleType } from "@keytrace/shared";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: TokenPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Check cookie first, fallback to Authorization header
  let token = req.cookies?.[config.cookieName];

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({
      ok: false,
      error: "Authentication required",
      code: "UNAUTHENTICATED",
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      ok: false,
      error: "Invalid or expired session. Please sign in again.",
      code: "SESSION_EXPIRED",
    });
    return;
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user || user.accountStatus !== "active") {
      res.status(401).json({
        ok: false,
        error: "User account is inactive or not found.",
        code: "ACCOUNT_INACTIVE",
      });
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(role: UserRoleType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: "Authentication required", code: "UNAUTHENTICATED" });
      return;
    }
    if (req.user.role !== role && req.user.role !== USER_ROLE.ADMIN) {
      res.status(403).json({
        ok: false,
        error: "Access denied: insufficient permissions",
        code: "FORBIDDEN",
      });
      return;
    }
    next();
  };
}
