#!/usr/bin/env bash
set -euo pipefail

fail() { echo "ERROR: $1"; exit 1; }

if rg -n "^<<<<<<<|^=======|^>>>>>>>" . >/dev/null; then
  fail "Merge conflict markers found. Resolve conflicts first."
fi

[ -f docker-compose.yml ] || fail "docker-compose.yml missing"

if rg -n '^version:' docker-compose.yml >/dev/null; then
  fail "Obsolete top-level 'version:' found in docker-compose.yml"
fi

build_count=$(rg -n '^\s{4}build:$' docker-compose.yml | wc -l | tr -d ' ')
if [ "$build_count" -ne 2 ]; then
  fail "Expected exactly 2 service build blocks (backend/frontend), found $build_count"
fi

for f in backend/Dockerfile frontend/Dockerfile; do
  [ -f "$f" ] || fail "$f missing"
  rg -n 'npm config set strict-ssl false && npm install --no-audit --no-fund' "$f" >/dev/null || fail "$f missing strict-ssl npm install command"
done

echo "Post-pull checks passed"
