#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo "KEYTRACE: Starting Production Single-Instance on Render"
echo "=========================================================="

# Trap SIGINT/SIGTERM to stop all child processes cleanly
trap 'echo ""; echo "Shutting down KEYTRACE services..."; kill $(jobs -p) 2>/dev/null || true; exit 0' SIGINT SIGTERM EXIT

# 1. Start Python Machine Learning Microservice (port 8000 on internal loopback)
echo "[1/2] Starting Python ML Microservice on 127.0.0.1:8000..."
cd "${ROOT_DIR}/ml-service"

# Detect Python uvicorn executable
if [ -f "./venv/bin/uvicorn" ]; then
  UVICORN_BIN="./venv/bin/uvicorn"
elif [ -f "./.venv/bin/uvicorn" ]; then
  UVICORN_BIN="./.venv/bin/uvicorn"
elif command -v uvicorn >/dev/null 2>&1; then
  UVICORN_BIN="uvicorn"
elif command -v python3 >/dev/null 2>&1; then
  UVICORN_BIN="python3 -m uvicorn"
else
  UVICORN_BIN="python -m uvicorn"
fi

PYTHONPATH=. $UVICORN_BIN app.main:app --host 127.0.0.1 --port 8000 --log-level info &
ML_PID=$!

# Wait for ML service health check
echo "Waiting for ML microservice to report ready..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/health/live > /dev/null 2>&1; then
    echo "✓ ML microservice is online and healthy!"
    break
  fi
  sleep 0.5
done

# 2. Start Node.js Express Server (serves API + static Web frontend)
echo ""
echo "[2/2] Starting Node.js Express Server on port ${PORT:-5000} (host: ${HOST:-0.0.0.0})..."
cd "${ROOT_DIR}/api"

export PORT="${PORT:-5000}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"
export ML_SERVICE_URL="${ML_SERVICE_URL:-http://127.0.0.1:8000}"

echo "=========================================================="
echo "KEYTRACE Unified Deployment Active:"
echo " - Public Web & API: http://${HOST}:${PORT}"
echo " - Health Endpoint: http://${HOST}:${PORT}/health/live"
echo " - API Documentation: http://${HOST}:${PORT}/api/docs"
echo " - Internal ML Service: ${ML_SERVICE_URL}"
echo "=========================================================="

exec node dist/server.js
