# KEYTRACE Automated Testing Strategy & Verification

**Test Automation**: Vitest (Node.js API & React Web) + pytest (Python ML) + Supertest  
**Master Test Runner**: `./scripts/test-all.sh`

---

## 1. Test Architecture & Coverage Summary

The KEYTRACE repository enforces automated testing at every architectural layer:

```
┌────────────────────────────────────────────────────────┐
│                   Test Suites (37+)                    │
├───────────────────┬───────────────────┬────────────────┤
│ Python ML Service │  Node.js Express  │   React Web    │
│     (pytest)      │     (Vitest)      │    (Vitest)    │
├───────────────────┼───────────────────┼────────────────┤
│ 7 unit tests:     │ 20 integration    │ 10 component   │
│ - Plausibility    │ tests:            │ tests:         │
│ - Feature extract │ - Health probes   │ - Brand render │
│ - Robust distance │ - User register   │ - Form schema  │
│ - Isolation Forest│ - Login & cookies │ - Consent flow │
│ - FAR/FRR/EER     │ - CSRF protection │ - Capture field│
│ - FastAPI predict │ - Consent engine  │ - Metric cards │
│ - Evaluate API    │ - Enrolment flow  │ - Status badges│
│                   │ - Verification API│ - Navigation   │
│                   │ - History paging  │                │
│                   │ - Data export     │                │
│                   │ - Admin RBAC      │                │
└───────────────────┴───────────────────┴────────────────┘
```

---

## 2. Running Automated Tests

### 1. Master Script (All Layers)
To execute all test suites across the monorepo in a single command:
```bash
./scripts/test-all.sh
```
This script sequentially:
1. Runs Python ML microservice tests with `pytest`.
2. Compiles `@keytrace/shared` TypeScript definitions.
3. Runs Node.js API integration tests with `vitest`.
4. Performs full TypeScript check on the API (`tsc --noEmit`).
5. Runs React Web frontend unit tests with `vitest`.
6. Executes full production bundle build (`vite build`).

### 2. Python ML Tests
```bash
cd ml-service
PYTHONPATH=. ./venv/bin/pytest tests/test_ml.py -v
```

### 3. Backend Integration Tests
```bash
cd api
npm run test
```
*Note*: Integration tests utilize `mongodb-memory-server` to run fully isolated tests without requiring an active external MongoDB daemon.

### 4. Frontend Component Tests
```bash
cd apps/web
npm run test
```

---

## 3. Synthetic Fixtures & Ethical Data Policy

Under no circumstances are real personal biometrics included in the version control repository. All test suites use **synthetic timing fixtures** generated with controlled distributions:
- `genuine_sample`: Mean hold $\approx 90\text{ms}$, flight $\approx 120\text{ms}$ with low variance ($\sigma \le 15\text{ms}$).
- `impostor_sample`: Mean hold $\approx 220\text{ms}$, flight $\approx 310\text{ms}$ with erratic pauses ($\sigma \ge 60\text{ms}$).

These fixtures mathematically exercise the decision boundaries without creating privacy liabilities.
