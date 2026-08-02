#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "=== calorie-tracker railway entrypoint ==="
echo "time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "pwd: $(pwd)"

exec sh scripts/start-railway.sh
