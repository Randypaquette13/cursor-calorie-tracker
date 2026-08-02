#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

export BRRR_PING_PHASE=deploy-build
node scripts/ping-brrr.mjs || echo "[brrr] deploy-build ping failed, continuing build"
