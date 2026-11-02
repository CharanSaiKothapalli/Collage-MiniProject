import { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // If request uses Bearer token authorization header, it is immune to cross-site cookie forgery
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  const normalizedPath = (req.path || "").replace(/\/+$/, "");

  // Exempt public auth routes like register, login, and logout from CSRF header requirements
  if (
    normalizedPath.endsWith("/auth/register") ||
    normalizedPath.endsWith("/auth/login") ||
    normalizedPath.endsWith("/auth/logout")
  ) {
    return next();
  }

  const cookieToken = req.cookies?.["keytrace_csrf"];
  const headerToken = req.headers["x-csrf-token"] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      ok: false,
      error: "Invalid or missing CSRF token",
      code: "CSRF_ERROR",
    });
    return;
  }

  next();
}
