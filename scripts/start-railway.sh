#!/usr/bin/env sh
set -eu

PORT="${PORT:-8081}"

if [ -z "${RAILWAY_PUBLIC_DOMAIN:-}" ]; then
  echo "ERROR: RAILWAY_PUBLIC_DOMAIN is not set."
  echo "In Railway, open your service → Settings → Networking → Generate Domain."
  exit 1
fi

export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export REACT_NATIVE_PACKAGER_HOSTNAME="${RAILWAY_PUBLIC_DOMAIN}"
export EXPO_PACKAGER_PROXY_URL="https://${RAILWAY_PUBLIC_DOMAIN}"
unset CI

echo "Metro proxy URL: ${EXPO_PACKAGER_PROXY_URL}"
echo "Open your dev build app → Enter URL manually: exp://${RAILWAY_PUBLIC_DOMAIN}"
echo "Or fetch manifest links: https://${RAILWAY_PUBLIC_DOMAIN}/_expo/open?platform=ios"

exec expo start --port "${PORT}" --host lan --dev-client
