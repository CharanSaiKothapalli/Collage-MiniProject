import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many login/registration attempts. Please wait 15 minutes before retrying.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
});
