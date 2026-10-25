# KEYTRACE Deployment & Production Operations

**Target Environments**: Docker Compose (Local), Render / Railway (Backend & ML), Vercel / Cloudflare Pages (Frontend), MongoDB Atlas (Database).

---

## 1. Local Development via Docker Compose

The repository includes a production-mirroring `docker-compose.yml` defining the four core services:

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]

  ml-service:
    build: { context: ./ml-service, dockerfile: Dockerfile }
    ports: ["8000:8000"]
    environment:
      - ML_SERVICE_SECRET=dev_internal_ml_key_change_in_prod

  api:
    build: { context: ., dockerfile: api/Dockerfile }
    ports: ["4000:4000"]
    depends_on:
      mongodb: { condition: service_healthy }
      ml-service: { condition: service_started }
    environment:
      - NODE_ENV=production
      - PORT=4000
      - MONGODB_URI=mongodb://mongodb:27017/keytrace
      - ML_SERVICE_URL=http://ml-service:8000
      - ML_SERVICE_SECRET=dev_internal_ml_key_change_in_prod

  web:
    build: { context: ., dockerfile: apps/web/Dockerfile }
    ports: ["5173:80"]
    depends_on:
      api: { condition: service_started }
```

### Launching Docker Environment
```bash
docker compose up --build
```
- Web Application: `http://localhost:5173`
- API & Swagger Docs: `http://localhost:4000/api/docs`
- Health Probe: `http://localhost:4000/health/ready`

---

## 2. Cloud Deployment Architecture

### A. MongoDB Atlas (Database Layer)
1. Provision a MongoDB Atlas cluster (M0 free tier or dedicated M10+).
2. Configure Database Access: Create an application user with read/write privileges on the `keytrace` database.
3. Configure Network Access: Whitelist the outgoing IP addresses of your backend application server (or allow `0.0.0.0/0` with strong password authentication).
4. Extract the connection URI:
   `mongodb+srv://keytrace_app:<password>@cluster0.abcde.mongodb.net/keytrace?retryWrites=true&w=majority`

### B. Machine Learning Service (Render / Cloud Run)
- Deploy `ml-service` as a private web service or background worker.
- Set environment variables:
  ```env
  PORT=8000
  ML_SERVICE_SECRET=<GENERATED_CRYPTOGRAPHIC_SECRET>
  ```
- Note the private internal URL (e.g., `http://ml-service.render.internal:8000`).

### C. Node.js API (Render / Railway / AWS ECS)
- Deploy root workspace with root directory `.` and build command:
  ```bash
  npm run build:shared && cd api && npm install && npm run build
  ```
- Start command:
  ```bash
  cd api && node dist/server.js
  ```
- Environment variables:
  ```env
  NODE_ENV=production
  PORT=4000
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=<STRONG_RANDOM_SECRET>
  COOKIE_SECRET=<STRONG_RANDOM_SECRET>
  ALLOWED_ORIGINS=https://keytrace.yourdomain.com
  ML_SERVICE_URL=http://ml-service.render.internal:8000
  ML_SERVICE_SECRET=<SAME_SECRET_AS_ABOVE>
  ADMIN_BOOTSTRAP_PASSWORD=<STRONG_INITIAL_PASSWORD>
  ```

### D. React Frontend (Vercel / Cloudflare Pages)
- Set root directory to `apps/web`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment variable:
  ```env
  VITE_API_URL=https://api.yourdomain.com
  ```

---

## 3. Production Readiness Checklist

- [x] **No Default Passwords**: Randomly generated admin bootstrap password.
- [x] **Secure Cookies**: `Secure: true` flag enabled when `NODE_ENV=production`.
- [x] **CORS Enforcement**: Strictly permits only designated frontend domain (`ALLOWED_ORIGINS`).
- [x] **Double-Submit CSRF**: Enabled and validated on all state-changing endpoints.
- [x] **Internal Networking**: ML service bound internally and authenticated via `X-Internal-ML-Key`.
- [x] **Health Check Routing**: Container orchestrators ping `/health/live` and `/health/ready`.
- [x] **Zero Plaintext Transmission**: Typed character keys never leave the browser.
