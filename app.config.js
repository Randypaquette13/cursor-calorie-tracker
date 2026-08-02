/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json');

require('./scripts/ping-brrr-once.cjs').pingBrrrOnce('app-config');

const isEasBuild = process.env.EAS_BUILD === 'true';

const easOnlyPlugins = [
  'expo-dev-client',
  [
    'expo-speech-recognition',
    {
      microphonePermission:
        'Allow Cursor Calorie Tracker to use the microphone for voice food logging.',
      speechRecognitionPermission:
        'Allow Cursor Calorie Tracker to transcribe what you ate.',
    },
  ],
];

module.exports = {
  expo: {
    ...base.expo,
    plugins: isEasBuild ? [...base.expo.plugins, ...easOnlyPlugins] : base.expo.plugins,
    extra: {
      ...base.expo.extra,
      buildVersion: '2026-08-02-activity-score-copy',
    },
  },
};
