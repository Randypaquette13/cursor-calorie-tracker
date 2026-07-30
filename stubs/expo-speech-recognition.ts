import { useEventListener } from 'expo';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { PermissionResponse } from 'expo-modules-core';

type SpeechModule = {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  requestPermissionsAsync: () => Promise<PermissionResponse>;
  addListener?: (eventName: string, listener: (...args: unknown[]) => void) => { remove: () => void };
};

const nativeModule = requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');

const deniedPermission: PermissionResponse = {
  granted: false,
  status: 'denied',
  expires: 'never',
  canAskAgain: true,
};

const noopModule: SpeechModule = {
  start: () => {},
  stop: () => {},
  abort: () => {},
  requestPermissionsAsync: async () => deniedPermission,
};

export const ExpoSpeechRecognitionModule = nativeModule ?? noopModule;

export function useSpeechRecognitionEvent(
  eventName: string,
  listener: (...args: unknown[]) => void,
): void {
  useEventListener(
    (nativeModule ?? noopModule) as Parameters<typeof useEventListener>[0],
    eventName as never,
    listener as never,
  );
}
