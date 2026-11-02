# ==============================================================================
# KEYTRACE: Unified Single-Instance Dockerfile (Render / Cloud Deployments)
# Runs React 18 Frontend + Node.js API + Python FastAPI ML Engine in ONE container
# ==============================================================================

# Stage 1: Build Shared Contracts, React Web Frontend, and API Backend
FROM node:20-bookworm-slim AS builder

WORKDIR /app/keytrace

# Install required build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY keytrace/package*.json ./
COPY keytrace/packages/shared/package*.json ./packages/shared/
COPY keytrace/api/package*.json ./api/
COPY keytrace/apps/web/package*.json ./apps/web/

# Install dependencies across all workspaces
RUN npm install

# Copy source trees
COPY keytrace/packages/shared ./packages/shared
COPY keytrace/api ./api
COPY keytrace/apps/web ./apps/web

# Build shared types, React production bundle, and API TypeScript
RUN npm run build --workspace=@keytrace/shared
RUN npm run build --workspace=@keytrace/web
RUN npm run build --workspace=api

# ------------------------------------------------------------------------------
# Stage 2: Production Unified Single-Instance Runtime
# ------------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runner

# Install Node.js 20 and runtime utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/keytrace

# Install Python ML dependencies
COPY keytrace/ml-service/requirements.txt ./ml-service/
RUN pip install --no-cache-dir -r ./ml-service/requirements.txt

# Copy ML service application code and models
COPY keytrace/ml-service ./ml-service

# Setup Node.js production runtime dependencies
COPY keytrace/package*.json ./
COPY keytrace/packages/shared/package*.json ./packages/shared/
COPY keytrace/api/package*.json ./api/

RUN npm install --omit=dev --workspace=@keytrace/shared --workspace=api

# Copy compiled outputs from builder
COPY --from=builder /app/keytrace/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/keytrace/api/dist ./api/dist
COPY --from=builder /app/keytrace/apps/web/dist ./apps/web/dist

# Copy production startup script
COPY keytrace/scripts/start-production.sh ./scripts/
RUN chmod +x ./scripts/start-production.sh

# Environment Defaults for Render
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0
ENV ML_SERVICE_URL=http://127.0.0.1:8000
ENV CLIENT_DIST_DIR=/app/keytrace/apps/web/dist

EXPOSE 10000

CMD ["./scripts/start-production.sh"]
