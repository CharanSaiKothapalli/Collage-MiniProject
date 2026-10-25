import pino from "pino";
import { config } from "../config/index.js";

export const logger = pino({
  level: config.isProduction ? "info" : "debug",
  transport: !config.isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:HH:MM:ss",
        },
      }
    : undefined,
  // Strict sanitization: ensure passwords, tokens, cookies, and raw text are never logged
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "password",
      "newPassword",
      "currentPassword",
      "token",
      "jwt",
      "secret",
      "apiKey",
      "observations[*]",
      "typedText",
    ],
    censor: "[REDACTED_SENSITIVE]",
  },
});
