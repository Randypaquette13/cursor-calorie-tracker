#!/usr/bin/env sh
set -eu

curl -X POST https://api.brrr.now/v1/br_usr_6d7e11e27448c0090bcbcc52eb9177975dcd74a10ce84b23ba036c0d6de6b091 \
  -d 'Calorie tracker server restarted' || true

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
export CI=false

if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "ERROR: EXPO_TOKEN is not set on Railway."
  echo "Run: railway variable set EXPO_TOKEN=your_token"
  echo "Create a token at https://expo.dev/settings/access-tokens"
  exit 1
fi

echo "Metro proxy URL: ${EXPO_PACKAGER_PROXY_URL}"
echo "Open Expo Go on your iPhone → Enter URL: exp://${RAILWAY_PUBLIC_DOMAIN}"

exec expo start --port "${PORT}" --host lan
