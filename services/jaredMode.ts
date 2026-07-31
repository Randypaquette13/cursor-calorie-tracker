import * as SecureStore from 'expo-secure-store';

const JARED_MODE_KEY = 'jared_mode_enabled';

export async function getJaredModeEnabled() {
  const value = await SecureStore.getItemAsync(JARED_MODE_KEY);
  return value === 'true';
}

export async function setJaredModeEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(JARED_MODE_KEY, enabled ? 'true' : 'false');
}
