import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { healthRouter } from "./modules/health/health.router.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { consentRouter } from "./modules/consent/consent.router.js";
import { enrollmentRouter } from "./modules/enrollment/enrollment.router.js";
import { verificationRouter } from "./modules/verification/verification.router.js";
import { historyRouter } from "./modules/history/history.router.js";
import { analyticsRouter } from "./modules/analytics/analytics.router.js";
import { dataRouter } from "./modules/data/data.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy if configured (e.g. Render / Heroku / Nginx)
  if (config.isProduction) {
    app.set("trust proxy", 1);
  }

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI and frontend integration
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [config.corsOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    })
  );

  // Parsers
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Structured request logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url?.startsWith("/health"),
      },
    })
  );

  // Health routes (no rate limiting, no csrf)
  app.use("/health", healthRouter);

  // OpenAPI Documentation
  const swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "KEYTRACE API",
      version: "1.0.0",
      description:
        "REST API for KEYTRACE: Continuous Behavioural Keystroke Dynamics User Authentication Platform",
    },
    servers: [{ url: config.apiPrefix, description: "Current API environment" }],
    paths: {
      "/auth/register": {
        post: { summary: "Register new user account", tags: ["Authentication"] },
      },
      "/auth/login": {
        post: { summary: "Authenticate user and issue HTTP-only session cookie", tags: ["Authentication"] },
      },
      "/auth/logout": {
        post: { summary: "Terminate session and clear cookies", tags: ["Authentication"] },
      },
      "/auth/me": {
        get: { summary: "Fetch current authenticated user profile and consent status", tags: ["Authentication"] },
      },
      "/consent/current": {
        get: { summary: "Get current behavioural biometric consent record", tags: ["Consent"] },
      },
      "/consent/accept": {
        post: { summary: "Explicitly accept informed consent terms", tags: ["Consent"] },
      },
      "/consent/withdraw": {
        post: { summary: "Withdraw consent and disable timing collection", tags: ["Consent"] },
      },
      "/enrollment/sessions": {
        post: { summary: "Record a valid keystroke timing sample", tags: ["Enrollment"] },
      },
      "/enrollment/status": {
        get: { summary: "Check profile enrolment progress and sample count", tags: ["Enrollment"] },
      },
      "/verification/sessions": {
        post: { summary: "Start continuous verification demonstration session", tags: ["Verification"] },
      },
      "/verification/sessions/{sessionId}/evaluate": {
        post: { summary: "Evaluate typing window against enrolled profile", tags: ["Verification"] },
      },
      "/analytics/overview": {
        get: { summary: "Retrieve overall verification metrics", tags: ["Analytics"] },
      },
      "/analytics/model-performance": {
        get: { summary: "Retrieve active ML model evaluation and ROC curves", tags: ["Analytics"] },
      },
      "/admin/overview": {
        get: { summary: "Administrative system health and statistics", tags: ["Administration"] },
      },
    },
  };

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Apply general rate limiter and CSRF protection for API v1 routes
  app.use(config.apiPrefix, apiRateLimiter);
  app.use(config.apiPrefix, csrfProtection);

  // Register API modules
  app.use(`${config.apiPrefix}/auth`, authRouter);
  app.use(`${config.apiPrefix}/consent`, consentRouter);
  app.use(`${config.apiPrefix}/enrollment`, enrollmentRouter);
  app.use(`${config.apiPrefix}/verification`, verificationRouter);
  app.use(`${config.apiPrefix}/history`, historyRouter);
  app.use(`${config.apiPrefix}/analytics`, analyticsRouter);
  app.use(`${config.apiPrefix}/data`, dataRouter);
  app.use(`${config.apiPrefix}/account`, dataRouter);
  app.use(`${config.apiPrefix}/profile`, dataRouter);
  app.use(`${config.apiPrefix}/admin`, adminRouter);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      ok: false,
      error: `Resource not found: ${req.method} ${req.originalUrl}`,
      code: "NOT_FOUND",
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
