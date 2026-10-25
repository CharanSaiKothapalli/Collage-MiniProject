/**
 * KEYTRACE Shared Constants and Definitions
 */

export const APPLICATION_NAME = "KEYTRACE";
export const ACADEMIC_TITLE = "A Keystroke-Dynamics Classifier for Continuous Behavioural User Authentication";
export const CURRENT_CONSENT_VERSION = "1.0";
export const CURRENT_FEATURE_SCHEMA_VERSION = "1.0";
export const CURRENT_MODEL_VERSION = "v1.2.0-robust-distance";

export const FEATURE_NAMES = [
  "mean_hold",
  "std_hold",
  "median_hold",
  "mean_flight",
  "std_flight",
  "median_flight",
  "p90_flight",
  "chars_per_second",
  "pause_ratio",
  "hold_flight_ratio",
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

export const FEATURE_METADATA: Record<FeatureName, { label: string; unit: string; description: string }> = {
  mean_hold: {
    label: "Mean Hold Duration",
    unit: "ms",
    description: "Average duration between physical key press (keydown) and key release (keyup).",
  },
  std_hold: {
    label: "Std Dev Hold Duration",
    unit: "ms",
    description: "Standard deviation of key hold times, measuring press-length variability.",
  },
  median_hold: {
    label: "Median Hold Duration",
    unit: "ms",
    description: "Median key press duration, robust against outlier taps.",
  },
  mean_flight: {
    label: "Mean Flight Duration",
    unit: "ms",
    description: "Average inter-key flight time between successive keydown transitions.",
  },
  std_flight: {
    label: "Std Dev Flight Duration",
    unit: "ms",
    description: "Variability in flight transition times across typing rhythms.",
  },
  median_flight: {
    label: "Median Flight Duration",
    unit: "ms",
    description: "Median inter-key transition time between keystrokes.",
  },
  p90_flight: {
    label: "90th Percentile Flight",
    unit: "ms",
    description: "90th percentile flight time, capturing pauses between syllables or words.",
  },
  chars_per_second: {
    label: "Typing Cadence",
    unit: "chars/s",
    description: "Effective typing speed computed as total keystrokes divided by elapsed seconds.",
  },
  pause_ratio: {
    label: "Pause Ratio",
    unit: "ratio",
    description: "Proportion of keystroke flight intervals exceeding 250 milliseconds.",
  },
  hold_flight_ratio: {
    label: "Hold to Flight Ratio",
    unit: "ratio",
    description: "Proportion of mean hold duration relative to mean flight duration.",
  },
};

export const ENROLLMENT_THRESHOLDS = {
  MIN_SAMPLES_REQUIRED: 10,
  MIN_OBSERVATIONS_PER_SAMPLE: 8,
  MIN_ELAPSED_MS: 1500,
  MAX_ELAPSED_MS: 180000,
  MIN_HOLD_MS: 10,
  MAX_HOLD_MS: 2000,
  MIN_FLIGHT_MS: 10,
  MAX_FLIGHT_MS: 5000,
  DEFAULT_DISTANCE_THRESHOLD: 2.8,
  STRICT_DISTANCE_THRESHOLD: 2.2,
  LENIENT_DISTANCE_THRESHOLD: 3.4,
} as const;

export const PROFILE_STATUS = {
  NOT_ENROLLED: "NOT_ENROLLED",
  ENROLLING: "ENROLLING",
  READY_FOR_TESTING: "READY_FOR_TESTING",
  NEEDS_MORE_DATA: "NEEDS_MORE_DATA",
  DISABLED: "DISABLED",
  DELETED: "DELETED",
} as const;

export type ProfileStatusType = (typeof PROFILE_STATUS)[keyof typeof PROFILE_STATUS];

export const VERIFICATION_DECISION = {
  MATCH: "MATCH",
  REVIEW: "REVIEW",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  PROFILE_NOT_READY: "PROFILE_NOT_READY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type VerificationDecisionType = (typeof VERIFICATION_DECISION)[keyof typeof VERIFICATION_DECISION];

export const USER_ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type UserRoleType = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const CONSENT_STATUS = {
  ACCEPTED: "accepted",
  WITHDRAWN: "withdrawn",
} as const;

export type ConsentStatusType = (typeof CONSENT_STATUS)[keyof typeof CONSENT_STATUS];
