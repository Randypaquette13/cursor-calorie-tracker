/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json');

const isEasBuild = process.env.EAS_BUILD === 'true';
const isDevClientBuild = process.env.EAS_BUILD_PROFILE === 'development';
const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
const stravaOAuthRedirectUri = railwayPublicDomain
  ? `https://${railwayPublicDomain}/strava/oauth/callback`
  : 'http://localhost';
const stravaCallbackDomain = railwayPublicDomain ?? 'localhost';

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
      buildVersion: '2026-08-10-voice-mic',
      stravaOAuthRedirectUri,
      stravaCallbackDomain,
    },
  },
};
