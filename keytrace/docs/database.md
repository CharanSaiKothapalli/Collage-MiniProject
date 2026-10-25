# KEYTRACE Database Architecture & Schema Documentation

**Database Engine**: MongoDB (Compatible with MongoDB Atlas 7.0+ or Local/In-Memory MongoDB)  
**Object Data Modeling**: Mongoose 8.x + TypeScript

---

## 1. Design Principles

1. **Absolute Data Minimization**:
   - No raw characters, keystroke labels, or entered textual content are ever stored.
   - Only physical timing measurements (durations in milliseconds) and calculated mathematical summary features are persisted.
2. **Tenant & User Isolation**:
   - Every collection containing behavioural biometrics references `userId` explicitly.
   - All query operations in backend repositories enforce `{ userId: req.user.id }` checks.
3. **Auditability & Integrity**:
   - Timestamps (`createdAt`, `updatedAt`) are automatically tracked across all collections.
   - Security-relevant events (consent changes, administrative updates, verification outcomes) write immutable records.

---

## 2. Collections & Schemas

### `users`
Stores credentials, roles, and account lifecycle state.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `username` | `String` | Unique, lowercase, indexed, trim | Unique login identifier |
| `email` | `String` | Unique, lowercase, indexed, trim | Normalized user email |
| `passwordHash` | `String` | Required | Argon2id / bcrypt salted hash |
| `role` | `String` | Enum: `USER`, `ADMIN` | Role-based authorization |
| `status` | `String` | Enum: `ACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION` | Account lifecycle status |
| `createdAt` | `Date` | Automated | Account creation timestamp |
| `updatedAt` | `Date` | Automated | Last modification timestamp |

*Indexes*:
- `{ username: 1 }` (unique)
- `{ email: 1 }` (unique)

---

### `consent_records`
Maintains legal compliance audit records for behavioural biometrics collection.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `userId` | `ObjectId` | Ref: `User`, Indexed | Target account |
| `consentVersion` | `String` | Required | Document version accepted |
| `status` | `String` | Enum: `ACCEPTED`, `WITHDRAWN` | State of user consent |
| `acceptedAt` | `Date` | Required | Timestamp of affirmative consent |
| `withdrawnAt` | `Date` | Optional | Timestamp when consent was revoked |
| `ipHash` | `String` | Optional, SHA-256 | Anonymized audit record |

*Indexes*:
- `{ userId: 1, consentVersion: 1 }`
- `{ userId: 1, status: 1 }`

---

### `typing_profiles`
Maintains the enrollment state, model baseline parameters, and profile status.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `userId` | `ObjectId` | Ref: `User`, Unique index | Profile owner |
| `status` | `String` | Enum: `NOT_ENROLLED`, `ENROLLING`, `READY_FOR_TESTING`, `NEEDS_MORE_DATA`, `DISABLED`, `DELETED` | State machine status |
| `featureSchemaVersion` | `Number` | Default: 1 | Schema version for feature vectors |
| `enrolmentCount` | `Number` | Default: 0 | Number of verified enrollment sessions |
| `modelVersion` | `String` | Default: "1.0.0" | Version of active classifier |
| `baselineFeatureMedians` | `Map<String, Number>` | Optional | Calculated reference median vector |
| `baselineFeatureMads` | `Map<String, Number>` | Optional | Calculated reference MAD vector |

*Indexes*:
- `{ userId: 1 }` (unique)
- `{ status: 1 }`

---

### `typing_samples`
Individual enrollment sessions containing calculated feature vectors.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `userId` | `ObjectId` | Ref: `User`, Indexed | Sample owner |
| `profileId` | `ObjectId` | Ref: `TypingProfile` | Reference to parent profile |
| `sessionId` | `String` | UUIDv4, Indexed | Unique client session identifier |
| `featureVector` | `Map<String, Number>` | Required | 10-dimensional feature values |
| `featureSchemaVersion` | `Number` | Default: 1 | Canonical feature schema |
| `qualityStatus` | `String` | Enum: `VALID`, `SUSPICIOUS`, `REJECTED` | Quality validation outcome |
| `observationCount` | `Number` | Minimum: 15 | Number of physical key transitions |
| `elapsedMs` | `Number` | Positive integer | Total duration of the typing window |
| `inputMethod` | `String` | Default: "keyboard" | Device input modality |
| `consentVersion` | `String` | Required | Active consent version during capture |

*Indexes*:
- `{ userId: 1, createdAt: -1 }`
- `{ sessionId: 1 }`

---

### `verification_sessions`
Active continuous verification sessions.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `userId` | `ObjectId` | Ref: `User`, Indexed | Verified user |
| `startedAt` | `Date` | Default: Now | Session initiation timestamp |
| `endedAt` | `Date` | Optional | Session termination timestamp |
| `status` | `String` | Enum: `ACTIVE`, `COMPLETED`, `TERMINATED` | Verification session state |
| `totalEvaluations` | `Number` | Default: 0 | Count of evaluated windows |
| `matchCount` | `Number` | Default: 0 | Windows classified as MATCH |
| `reviewCount` | `Number` | Default: 0 | Windows classified as REVIEW |
| `modelVersion` | `String` | Default: "1.0.0" | Model version used |

---

### `verification_events`
Individual biometric evaluation decisions recorded during an active session.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `userId` | `ObjectId` | Ref: `User`, Indexed | Account evaluated |
| `sessionId` | `ObjectId` | Ref: `VerificationSession`, Indexed | Verification session reference |
| `decision` | `String` | Enum: `MATCH`, `REVIEW`, `INSUFFICIENT_DATA`, `PROFILE_NOT_READY`, `SERVICE_UNAVAILABLE` | Biometric outcome |
| `score` | `Number` | Required | Standardized robust distance score |
| `threshold` | `Number` | Default: 2.8 | Active decision boundary |
| `confidence` | `Number` | Range [0, 1] | Model confidence rating |
| `reasonCodes` | `[String]` | Array of reason codes | Diagnostic explanations |
| `featureVector` | `Map<String, Number>` | Required | Features calculated for window |
| `timestamp` | `Date` | Default: Now, Indexed | Event timestamp |

*Indexes*:
- `{ userId: 1, timestamp: -1 }`
- `{ sessionId: 1 }`
- `{ decision: 1 }`

---

### `audit_events`
Security and administrative event log.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `actorId` | `ObjectId` | Ref: `User`, Nullable | Originator of the action |
| `action` | `String` | Required, Indexed | Event action name |
| `resourceType` | `String` | Required | Targeted system resource |
| `resourceId` | `String` | Optional | Target identifier |
| `details` | `Object` | Sanitized metadata | Event-specific parameters |
| `timestamp` | `Date` | Default: Now, Indexed | Occurrence time |

---

## 3. Data Retention & Privacy Deletion Rules

1. **Immediate User Deletion (`DELETE /api/v1/account`)**:
   - Cascading atomic deletion removes all records across `users`, `typing_profiles`, `typing_samples`, `verification_sessions`, and `verification_events`.
   - `consent_records` status is updated to `WITHDRAWN` and personal identifiers are removed for regulatory audit preservation.
2. **Profile Reset (`DELETE /api/v1/profile`)**:
   - Deletes all `typing_samples` associated with the user.
   - Resets `typing_profiles` state to `NOT_ENROLLED` and clears baseline median/MAD vectors.
