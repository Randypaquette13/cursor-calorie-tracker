/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json');

const isEasBuild = process.env.EAS_BUILD === 'true';

const expoGoPlugins = base.expo.plugins.filter((plugin) => {
  const name = Array.isArray(plugin) ? plugin[0] : plugin;
  return name !== 'expo-dev-client' && name !== 'expo-speech-recognition';
});

module.exports = {
  expo: {
    ...base.expo,
    plugins: isEasBuild ? base.expo.plugins : expoGoPlugins,
  },
};
