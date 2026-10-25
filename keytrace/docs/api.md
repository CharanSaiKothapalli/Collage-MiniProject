# KEYTRACE REST API Specification

**Project**: A Keystroke-Dynamics Classifier for Continuous Behavioural User Authentication  
**API Prefix**: `/api/v1`  
**OpenAPI Specification**: Available interactively at `/api/docs` via Swagger UI.

---

## 1. Authentication & Session Management

All cookie-based authenticated requests require the double-submit CSRF cookie `keytrace_csrf` and the header `x-csrf-token: <csrf_token_value>` unless using Bearer tokens in programmatic API calls.

### Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Rate Limit**: 10 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "671aa5f4e198b10012345678",
      "username": "alice",
      "email": "alice@example.com",
      "role": "USER",
      "status": "ACTIVE"
    },
    "csrfToken": "4f9d8a...",
    "message": "User registered successfully."
  }
  ```
- **Error Codes**: `400 Bad Request` (Zod schema validation), `409 Conflict` (Username or email already exists).

---

### Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Rate Limit**: 5 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "username": "alice",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**: Sets HTTP-only `keytrace_session` and readable `keytrace_csrf` cookies.
  ```json
  {
    "success": true,
    "user": {
      "id": "671aa5f4e198b10012345678",
      "username": "alice",
      "email": "alice@example.com",
      "role": "USER",
      "status": "ACTIVE"
    },
    "csrfToken": "4f9d8a..."
  }
  ```
- **Error Codes**: `401 Unauthorized` (Generic "Invalid credentials" error to prevent user enumeration).

---

### Logout
- **Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Response `200 OK`**: Clears `keytrace_session` and `keytrace_csrf` cookies.
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Authentication**: Required (`keytrace_session` cookie or `Authorization: Bearer <token>`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "671aa5f4e198b10012345678",
      "username": "alice",
      "email": "alice@example.com",
      "role": "USER",
      "status": "ACTIVE"
    },
    "hasConsent": true,
    "profileStatus": "READY_FOR_TESTING"
  }
  ```

---

## 2. Informed Consent Management

Under GDPR / behavioural biometrics ethics, keystroke timing cannot be collected without an active, explicit consent record.

### Get Current Consent Status
- **Method**: `GET`
- **Path**: `/api/v1/consent/current`
- **Response `200 OK`**:
  ```json
  {
    "hasConsent": true,
    "consentVersion": "1.0",
    "acceptedAt": "2026-10-25T05:00:00.000Z",
    "withdrawnAt": null
  }
  ```

### Accept Consent
- **Method**: `POST`
- **Path**: `/api/v1/consent/accept`
- **Request Body**:
  ```json
  {
    "version": "1.0"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Consent recorded successfully",
    "record": { ... }
  }
  ```

### Withdraw Consent
- **Method**: `POST`
- **Path**: `/api/v1/consent/withdraw`
- **Response `200 OK`**: Sets profile status to `DISABLED`.
  ```json
  {
    "success": true,
    "message": "Consent withdrawn. Enrolment and verification have been disabled."
  }
  ```

---

## 3. Profile Enrolment Engine

### Get Enrolment Status
- **Method**: `GET`
- **Path**: `/api/v1/enrollment/status`
- **Response `200 OK`**:
  ```json
  {
    "status": "ENROLLING",
    "enrolledSamples": 6,
    "minRequired": 10,
    "progressPercent": 60,
    "featureSchemaVersion": 1,
    "modelReady": false
  }
  ```

### Record Enrolment Typing Session
- **Method**: `POST`
- **Path**: `/api/v1/enrollment/sessions`
- **Request Body**: Canonical timing payload (Zero raw characters transmitted)
  ```json
  {
    "schemaVersion": 1,
    "sessionId": "4955b9a4-5690-4a8e-bc5c-9c7f215f7eb0",
    "elapsedMs": 14250,
    "observations": [
      { "holdMs": 88, "flightMs": 112 },
      { "holdMs": 95, "flightMs": 125 }
    ],
    "inputMethod": "keyboard",
    "consentVersion": "1.0"
  }
  ```
- **Validation**: Minimum 15 observations required per window; observations must pass physical plausibility thresholds (hold: 10ms - 1500ms, flight: -500ms - 3000ms).
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "sampleId": "671ab1e...",
    "enrolledCount": 7,
    "minRequired": 10,
    "profileStatus": "ENROLLING",
    "features": {
      "mean_hold": 91.5,
      "median_hold": 91.5,
      "chars_per_second": 3.8,
      ...
    }
  }
  ```

### Finalize Enrolment
- **Method**: `POST`
- **Path**: `/api/v1/enrollment/finalize`
- **Response `200 OK`**: Trains baseline template & initializes Isolation Forest in ML microservice. Transitions profile status to `READY_FOR_TESTING`.

---

## 4. Continuous Verification Engine

### Start Verification Session
- **Method**: `POST`
- **Path**: `/api/v1/verification/sessions`
- **Response `201 Created`**:
  ```json
  {
    "sessionId": "671ab5e..."
  }
  ```

### Evaluate Typing Window
- **Method**: `POST`
- **Path**: `/api/v1/verification/sessions/:sessionId/evaluate`
- **Request Body**: Canonical timing payload (observations)
- **Response `200 OK`**:
  ```json
  {
    "decision": "MATCH",
    "score": 1.42,
    "threshold": 2.8,
    "confidence": 0.85,
    "reasonCodes": ["STRONG_CADENCE_SIMILARITY"],
    "modelVersion": "1.0.0",
    "featureSchemaVersion": 1
  }
  ```
- **Decisions**: `MATCH`, `REVIEW`, `INSUFFICIENT_DATA`, `PROFILE_NOT_READY`, `SERVICE_UNAVAILABLE`.

### End Verification Session
- **Method**: `POST`
- **Path**: `/api/v1/verification/sessions/:sessionId/end`
- **Response `200 OK`**: Computes session statistics and archives session.

---

## 5. Analytics, History, and Data Portability

- `GET /api/v1/history`: Returns paginated list of verification evaluations (`limit`, `page`).
- `GET /api/v1/history/:eventId`: Detailed breakdown of a single evaluation.
- `GET /api/v1/analytics/overview`: Aggregate match rates, sample counts, and session summary.
- `GET /api/v1/analytics/model-performance`: FAR, FRR, EER, and ROC-AUC curve datapoints.
- `GET /api/v1/data/export`: Full JSON GDPR export of user profile, consent log, and all anonymized feature samples.
- `DELETE /api/v1/account`: Complete erasure of account, typing profiles, feature vectors, and verification logs.

---

## 6. Administration

Protected by `USER_ROLE.ADMIN` role-based access control.

- `GET /api/v1/admin/overview`: System-wide statistics (users, profile distribution, aggregate verification outcomes).
- `GET /api/v1/admin/users`: Paginated system user directory.
- `GET /api/v1/admin/audit-events`: Immutable audit trail of administrative and security events.
- `GET /api/v1/admin/models`: Active ML microservice versions, model metadata, and health.

---

## 7. System Health

Unauthenticated probes for container orchestrators (Kubernetes / Render / Docker):

- `GET /health/live`: Basic process liveness check (`200 OK`).
- `GET /health/ready`: Deep readiness probe checking MongoDB connection state and ML microservice connectivity.
