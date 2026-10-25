import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4000", 10),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  
  // Security
  jwtSecret: process.env.JWT_SECRET || "development-jwt-secret-do-not-use-in-production-replace-with-64-byte-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "keytrace_session",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || "lax",
  csrfSecret: process.env.CSRF_SECRET || "development-csrf-secret-replace-in-production",
  
  // Rate limits
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300", 10),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "20", 10),
  
  // MongoDB
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/keytrace",
  mongoDbName: process.env.MONGODB_DB_NAME || "keytrace",
  
  // ML Service
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  mlServiceApiKey: process.env.ML_SERVICE_API_KEY || "keytrace-internal-service-secret-token",
  mlServiceTimeoutMs: parseInt(process.env.ML_SERVICE_TIMEOUT_MS || "5000", 10),
  
  // Admin Bootstrap
  adminBootstrap: {
    enabled: process.env.ADMIN_BOOTSTRAP_ENABLED === "true",
    username: process.env.ADMIN_BOOTSTRAP_USERNAME || "admin",
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@keytrace.local",
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || "AdminSecurePass123!",
  }
};
