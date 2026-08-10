import { requireOptionalNativeModule } from 'expo-modules-core';

export function isSpeechRecognitionAvailable(): boolean {
  return requireOptionalNativeModule('ExpoSpeechRecognition') != null;
}
