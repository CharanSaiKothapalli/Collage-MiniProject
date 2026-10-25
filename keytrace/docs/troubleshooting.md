# KEYTRACE Troubleshooting & Diagnostic Guide

This document provides diagnosis and resolution workflows for common operational, development, and runtime scenarios.

---

## 1. Quick Diagnostic Table

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| **API fails with `CSRF_ERROR: Invalid CSRF token`** | Client did not pass the `x-csrf-token` header or did not include cookies. | Ensure client sets `credentials: "include"` (Axios / Fetch) and copies the `keytrace_csrf` cookie value into the `x-csrf-token` header. |
| **Verification returns `SERVICE_UNAVAILABLE`** | Internal Python ML service is not running or unreachable on port 8000. | Check Python service: `curl http://localhost:8000/health/live`. If down, start via `./ml-service/venv/bin/uvicorn app.main:app --port 8000`. |
| **API logs `MongoNetworkError: failed to connect`** | Remote Atlas IP is not allowlisted, or local MongoDB is down. | 1. If using MongoDB Atlas, check Network Access in Atlas console and add your current public IP. 2. In local dev, leave `MONGODB_URI` unset to automatically activate the in-memory fallback engine (`mongodb-memory-server`). |
| **Frontend displays `Failed to fetch` on login** | Frontend Vite server cannot communicate with backend on port 4000. | Confirm backend is running (`curl http://localhost:4000/health/live`). Verify `VITE_API_URL` in `apps/web/.env` or Vite proxy. |
| **Port Conflict: `listen EADDRINUSE: address already in use :::4000`** | Another process is holding port 4000. | Locate process: `lsof -i :4000`, terminate via `kill -9 <PID>`, or adjust `PORT=4001` in `.env`. |

---

## 2. Machine Learning Service Diagnostics

To test the internal ML service directly:
```bash
# 1. Health Probe
curl -s http://localhost:8000/health/ready | jq .

# 2. Test Feature Extraction
curl -s -X POST http://localhost:8000/api/v1/features/extract \
  -H "Content-Type: application/json" \
  -H "X-Internal-ML-Key: dev_internal_ml_key_change_in_prod" \
  -d '{
    "schemaVersion": 1,
    "sessionId": "test-session",
    "elapsedMs": 5000,
    "observations": [
      {"holdMs": 90, "flightMs": 120},
      {"holdMs": 85, "flightMs": 110}
    ],
    "inputMethod": "keyboard",
    "consentVersion": "1.0"
  }' | jq .
```

---

## 3. Resetting Local Development Database

If the database contains conflicting test schemas or dirty test records:

### If using MongoMemoryServer (Default Dev Mode):
Simply restart the Node.js API process. An ephemeral in-memory MongoDB instance is spun up fresh on startup.

### If using a persistent MongoDB instance:
Run the seed script to reset and seed canonical accounts:
```bash
cd keytrace
npm run seed
```
This drops and recreates:
- `admin` (Role: ADMIN)
- `alice_genuine` (Pre-enrolled profile with 10 genuine samples)
- `bob_impostor` (Un-enrolled account for impostor testing)
