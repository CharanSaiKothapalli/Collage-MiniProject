import { z } from "zod";
import {
  ChangePasswordSchema,
  ConsentAcceptSchema,
  EvaluateVerificationWindowSchema,
  FeatureVectorSchema,
  KeystrokeObservationSchema,
  KeystrokeSessionPayloadSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  StartVerificationSessionSchema,
  VerificationEventResponseSchema,
} from "../schemas/index.js";
import {
  ConsentStatusType,
  FeatureName,
  ProfileStatusType,
  UserRoleType,
  VerificationDecisionType,
} from "../constants/index.js";

export type KeystrokeObservation = z.infer<typeof KeystrokeObservationSchema>;
export type KeystrokeSessionPayload = z.infer<typeof KeystrokeSessionPayloadSchema>;
export type FeatureVector = z.infer<typeof FeatureVectorSchema>;

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type ConsentAcceptRequest = z.infer<typeof ConsentAcceptSchema>;
export type StartVerificationSessionRequest = z.infer<typeof StartVerificationSessionSchema>;
export type EvaluateVerificationWindowRequest = z.infer<typeof EvaluateVerificationWindowSchema>;
export type VerificationEventResponse = z.infer<typeof VerificationEventResponseSchema>;

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: UserRoleType;
  accountStatus: "active" | "suspended" | "pending_deletion";
  hasConsent: boolean;
  profileStatus: ProfileStatusType;
  sampleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecordDto {
  userId: string;
  consentVersion: string;
  status: ConsentStatusType;
  timestamp: string;
}

export interface TypingProfileDto {
  id: string;
  userId: string;
  status: ProfileStatusType;
  featureSchemaVersion: string;
  enrollmentCount: number;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface TypingSampleDto {
  id: string;
  userId: string;
  profileId: string;
  featureVector: FeatureVector;
  featureSchemaVersion: string;
  qualityStatus: "valid" | "warning" | "rejected";
  sessionId: string;
  createdAt: string;
}

export interface VerificationSessionDto {
  id: string;
  userId: string;
  status: "active" | "completed" | "interrupted";
  startTimestamp: string;
  endTimestamp?: string;
  totalEvaluations: number;
  matchCount: number;
  reviewCount: number;
  aggregateResult: VerificationDecisionType;
  modelVersion: string;
}

export interface VerificationEventDto {
  id: string;
  userId: string;
  sessionId: string;
  decision: VerificationDecisionType;
  score: number | null;
  threshold: number;
  reasonCodes: string[];
  qualityWarnings: string[];
  modelVersion: string;
  featureSchemaVersion: string;
  featureDeviations?: Record<string, number>;
  createdAt: string;
}

export interface ModelMetricsDto {
  far: number;
  frr: number;
  eer: number;
  rocAuc: number;
  sampleCountGenuine: number;
  sampleCountImpostor: number;
  evaluatedAt: string;
  status: "healthy" | "preliminary" | "degraded";
}

export interface SystemOverviewStatsDto {
  totalUsers: number;
  enrolledUsers: number;
  enrollingUsers: number;
  totalEnrollmentSamples: number;
  totalVerificationEvents: number;
  recentVerificationDecisions: {
    match: number;
    review: number;
    insufficientData: number;
  };
  mlServiceStatus: "healthy" | "degraded" | "offline";
  activeModelVersion: string;
}
