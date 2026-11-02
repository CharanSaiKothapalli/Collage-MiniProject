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
./venv/bin/pytest

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

# Clean up any transient test models generated during testing
git status --porcelain "${ROOT_DIR}/ml-service/saved_models/" 2>/dev/null | grep '^\?\?' | awk '{print $2}' | xargs rm -f 2>/dev/null || true

echo ""
echo "=========================================================="
echo "SUCCESS: All ML, API Backend, and Frontend suites passed!"
echo "=========================================================="

