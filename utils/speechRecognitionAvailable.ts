import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

export function isSpeechRecognitionAvailable(): boolean {
  if (Constants.executionEnvironment === 'storeClient') {
    return false;
  }

  return requireOptionalNativeModule('ExpoSpeechRecognition') != null;
}
