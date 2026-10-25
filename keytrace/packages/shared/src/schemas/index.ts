import { z } from "zod";
import {
  CURRENT_CONSENT_VERSION,
  CURRENT_FEATURE_SCHEMA_VERSION,
  ENROLLMENT_THRESHOLDS,
  FEATURE_NAMES,
  PROFILE_STATUS,
  USER_ROLE,
  VERIFICATION_DECISION,
} from "../constants/index.js";

/**
 * Keystroke Timing Raw Observations Schema
 * NOTE: Never captures characters, key labels, or typed strings.
 */
export const KeystrokeObservationSchema = z.object({
  holdMs: z
    .number()
    .min(1, "Hold time must be >= 1ms")
    .max(ENROLLMENT_THRESHOLDS.MAX_HOLD_MS, "Hold time exceeds plausible limits"),
  flightMs: z
    .number()
    .min(1, "Flight time must be >= 1ms")
    .max(ENROLLMENT_THRESHOLDS.MAX_FLIGHT_MS, "Flight time exceeds plausible limits"),
});

export const KeystrokeSessionPayloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  sessionId: z.string().uuid("Invalid session UUID format"),
  elapsedMs: z
    .number()
    .min(ENROLLMENT_THRESHOLDS.MIN_ELAPSED_MS, "Session elapsed time is too short")
    .max(ENROLLMENT_THRESHOLDS.MAX_ELAPSED_MS, "Session elapsed time is too long"),
  observations: z
    .array(KeystrokeObservationSchema)
    .min(
      ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_SAMPLE,
      `At least ${ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_SAMPLE} observations required`
    ),
  inputMethod: z.enum(["keyboard", "virtual-keyboard", "unknown"]).default("keyboard"),
  consentVersion: z.string().default(CURRENT_CONSENT_VERSION),
});

/**
 * 10-Dimensional Extracted Feature Vector Schema
 */
export const FeatureVectorSchema = z.object({
  mean_hold: z.number().positive(),
  std_hold: z.number().nonnegative(),
  median_hold: z.number().positive(),
  mean_flight: z.number().positive(),
  std_flight: z.number().nonnegative(),
  median_flight: z.number().positive(),
  p90_flight: z.number().positive(),
  chars_per_second: z.number().positive(),
  pause_ratio: z.number().min(0).max(1),
  hold_flight_ratio: z.number().positive(),
});

/**
 * User Registration & Authentication Schemas
 */
export const RegisterRequestSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username cannot exceed 32 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and dashes"),
  email: z.string().email("Please provide a valid email address").max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const LoginRequestSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number"),
});

/**
 * Consent Acceptance Schema
 */
export const ConsentAcceptSchema = z.object({
  consentVersion: z.string().default(CURRENT_CONSENT_VERSION),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must explicitly accept the behavioural data collection terms" }),
  }),
});

/**
 * Verification Request & Response Schemas
 */
export const StartVerificationSessionSchema = z.object({
  clientMetadata: z
    .object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
});

export const EvaluateVerificationWindowSchema = z.object({
  payload: KeystrokeSessionPayloadSchema,
});

export const VerificationEventResponseSchema = z.object({
  eventId: z.string(),
  sessionId: z.string(),
  decision: z.nativeEnum(VERIFICATION_DECISION),
  score: z.number().nullable(),
  threshold: z.number(),
  modelVersion: z.string(),
  featureSchemaVersion: z.string().default(CURRENT_FEATURE_SCHEMA_VERSION),
  reasonCodes: z.array(z.string()),
  qualityWarnings: z.array(z.string()),
  featureDeviations: z.record(z.string(), z.number()).optional(),
  createdAt: z.string(),
});
