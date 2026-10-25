#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo "KEYTRACE: Starting All Microservices Locally"
echo "=========================================================="

# Trap SIGINT/SIGTERM to stop all child processes cleanly
trap 'echo ""; echo "Shutting down KEYTRACE services..."; kill $(jobs -p) 2>/dev/null; exit 0' SIGINT SIGTERM EXIT

# 1. Start Python Machine Learning Microservice (port 8000)
echo "[1/3] Starting Python ML Microservice on http://localhost:8000..."
cd "${ROOT_DIR}/ml-service"
PYTHONPATH=. ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info &
ML_PID=$!

# Wait for ML service health check
echo "Waiting for ML service to report ready..."
for i in {1..15}; do
  if curl -s http://localhost:8000/health/live > /dev/null; then
    echo "ML service is online!"
    break
  fi
  sleep 1
done

# 2. Start Node.js Express API Backend (port 4000)
echo ""
echo "[2/3] Starting Node.js Express API Backend on http://localhost:4000..."
cd "${ROOT_DIR}/api"
npm run dev &
API_PID=$!

# Wait for API health check
echo "Waiting for API backend to report ready..."
for i in {1..20}; do
  if curl -s http://localhost:4000/health/live > /dev/null; then
    echo "API backend is online!"
    break
  fi
  sleep 1
done

# 3. Start React Web Frontend (port 5173)
echo ""
echo "[3/3] Starting React Vite Web Frontend on http://localhost:5173..."
cd "${ROOT_DIR}/apps/web"
npm run dev &
WEB_PID=$!

echo ""
echo "=========================================================="
echo "KEYTRACE Services Active:"
echo " - Web Application: http://localhost:5173"
echo " - API Documentation: http://localhost:4000/api/docs"
echo " - ML Microservice: http://localhost:8000/health/ready"
echo "Press Ctrl+C to terminate all services."
echo "=========================================================="

wait
