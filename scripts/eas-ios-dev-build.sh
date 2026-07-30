#!/usr/bin/env sh
set -eu

if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "ERROR: EXPO_TOKEN is not set."
  echo "Create one on your phone: https://expo.dev/settings/access-tokens"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "→ Installing speech recognition native module for EAS build..."
npx expo install expo-speech-recognition

echo "→ Linking project to Expo (if needed)..."
npx eas-cli init --force --non-interactive

echo ""
echo "→ Register your iPhone for internal installs (open this URL on your phone if you have not yet):"
npx eas-cli device:create || true

echo ""
echo "→ Starting iOS development build (speech + camera + sqlite)..."
echo "  This uses 1 of your 15 free iOS builds this month."
npx eas-cli build \
  --profile development \
  --platform ios \
  --non-interactive \
  --wait \
  --message "Cursor Calorie Tracker dev client with speech-to-text"

echo ""
echo "→ When finished, open the install link above on your iPhone."
echo "→ Then open the app (not Expo Go) and connect to:"
echo "  exp://cursor-calorie-tracker-production.up.railway.app"
