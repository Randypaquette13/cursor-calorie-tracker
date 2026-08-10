#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "→ No EXPO_TOKEN set — logging in via Expo CLI (browser/credentials)..."
  npx eas-cli whoami >/dev/null 2>&1 || npx eas-cli login
else
  echo "→ Using EXPO_TOKEN from the environment."
fi

echo "→ Ensuring speech recognition is installed for the native build..."
npx expo install expo-speech-recognition

echo "→ Linking project to Expo (if needed)..."
npx eas-cli init --force --non-interactive || true

echo ""
echo "→ Register your iPhone for internal installs if you have not yet."
echo "  (EAS will print a URL — open it on your iPhone to enroll the device.)"
npx eas-cli device:create || true

echo ""
echo "→ Starting iOS development build (speech + camera + sqlite)..."
echo "  This uses 1 of your free iOS builds this month on the Hobby plan."
npx eas-cli build \
  --profile development \
  --platform ios \
  --wait \
  --message "Cursor Calorie Tracker dev client with speech-to-text"

echo ""
echo "→ When finished, open the install link on your iPhone."
echo "→ Then open the Cursor Calorie Tracker app (not Expo Go) and connect to your Railway exp:// URL."
