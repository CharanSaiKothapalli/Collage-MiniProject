#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo "KEYTRACE: Running Complete Monorepo Test & Build Suite"
echo "=========================================================="

echo ""
echo "[1/4] Running Python ML Microservice Tests..."
cd "${ROOT_DIR}/ml-service"
PYTHONPATH=. ./venv/bin/pytest tests/test_ml.py

echo ""
echo "[2/4] Building Shared TypeScript Definitions..."
cd "${ROOT_DIR}/packages/shared"
npm run build

echo ""
echo "[3/4] Running Node.js API Backend Tests & TypeScript Compilation..."
cd "${ROOT_DIR}/api"
npm run test
npm run build

echo ""
echo "[4/4] Running React Web Frontend Tests & Vite Production Build..."
cd "${ROOT_DIR}/apps/web"
npm run test
npm run build

echo ""
echo "=========================================================="
echo "SUCCESS: All ML, API Backend, and Frontend suites passed!"
echo "=========================================================="
