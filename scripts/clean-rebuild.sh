#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "WARN: docker not found. Skipping container rebuild commands."
  exit 0
fi

echo "[1/4] stopping stack"
docker compose down --remove-orphans || true

echo "[2/4] removing old local images for this project"
docker compose rm -fsv || true

echo "[3/4] rebuilding images without cache"
docker compose build --no-cache

echo "[4/4] starting stack"
docker compose up -d

echo "Clean rebuild completed"
