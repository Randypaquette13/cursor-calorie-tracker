/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json');

const isEasBuild = process.env.EAS_BUILD === 'true';
const isDevClientBuild = process.env.EAS_BUILD_PROFILE === 'development';

/** Stable Railway hostname used for Strava OAuth in standalone / App Store builds. */
const DEFAULT_PRODUCTION_STRAVA_DOMAIN = 'cursor-calorie-tracker-production.up.railway.app';

/**
 * Resolve the Strava callback domain:
 * 1. RAILWAY_PUBLIC_DOMAIN — Metro running on Railway (Expo Go dev server)
 * 2. STRAVA_CALLBACK_DOMAIN — explicit override (e.g. EAS build env)
 * 3. DEFAULT_PRODUCTION_STRAVA_DOMAIN — standalone EAS builds (dev client + App Store)
 * 4. null — local `expo start` without env → localhost fallback
 */
const stravaCallbackDomain =
  process.env.RAILWAY_PUBLIC_DOMAIN ??
  process.env.STRAVA_CALLBACK_DOMAIN ??
  (isEasBuild ? DEFAULT_PRODUCTION_STRAVA_DOMAIN : null);

const stravaOAuthRedirectUri =
  stravaCallbackDomain && stravaCallbackDomain !== 'localhost'
    ? `https://${stravaCallbackDomain}/strava/oauth/callback`
    : 'http://localhost';

const stravaCallbackDomainDisplay = stravaCallbackDomain ?? 'localhost';

const speechPlugin = [
  'expo-speech-recognition',
  {
    microphonePermission:
      'Allow Cursor Calorie Tracker to use the microphone for voice food logging.',
    speechRecognitionPermission:
      'Allow Cursor Calorie Tracker to transcribe what you ate.',
  },
];

/** expo-dev-client only for the development profile (not App Store). Speech on every EAS build. */
const easPlugins = [
  ...(isDevClientBuild ? ['expo-dev-client'] : []),
  ...(isEasBuild ? [speechPlugin] : []),
];

module.exports = {
  expo: {
    ...base.expo,
    plugins: [...base.expo.plugins, ...easPlugins],
    extra: {
      ...base.expo.extra,
      buildVersion: '2026-08-16-strava-oauth',
      stravaOAuthRedirectUri,
      stravaCallbackDomain: stravaCallbackDomainDisplay,
    },
  },
};
