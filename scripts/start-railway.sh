#!/usr/bin/env sh
set -eu

BRRR_URL="https://api.brrr.now/v1/br_usr_6d7e11e27448c0090bcbcc52eb9177975dcd74a10ce84b23ba036c0d6de6b091"
BRRR_MESSAGE="Calorie tracker server restarted"

echo "Sending brrr.now startup ping..."

if command -v curl >/dev/null 2>&1; then
  BRRR_RESPONSE="$(curl -sS -w '\n%{http_code}' -X POST "${BRRR_URL}" -d "${BRRR_MESSAGE}" || true)"
  BRRR_BODY="$(printf '%s' "${BRRR_RESPONSE}" | sed '$d')"
  BRRR_STATUS="$(printf '%s' "${BRRR_RESPONSE}" | tail -n 1)"
  echo "brrr.now curl response: HTTP ${BRRR_STATUS:-unknown} ${BRRR_BODY}"
else
  echo "curl not found, using node fetch..."
  node -e "
    fetch('${BRRR_URL}', {
      method: 'POST',
      body: '${BRRR_MESSAGE}',
    })
      .then(async (response) => {
        const body = await response.text();
        console.log('brrr.now fetch response: HTTP', response.status, body);
      })
      .catch((error) => {
        console.error('brrr.now fetch failed:', error);
        process.exit(0);
      });
  "
fi

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
