#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "=== calorie-tracker railway entrypoint ==="
echo "time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "pwd: $(pwd)"

export BRRR_PING_PHASE=startup
node scripts/ping-brrr.mjs || echo "[brrr] startup ping failed, continuing anyway"

exec sh scripts/start-railway.sh
