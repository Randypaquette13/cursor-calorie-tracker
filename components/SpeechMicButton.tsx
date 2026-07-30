import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, Pressable, StyleSheet } from 'react-native';

interface SpeechMicButtonProps {
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onFocusInput?: () => void;
}

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function SpeechMicButton({ disabled, onTranscript, onFocusInput }: SpeechMicButtonProps) {
  if (!isExpoGo) {
    const { NativeSpeechMicButton } = require('@/components/NativeSpeechMicButton');
    return <NativeSpeechMicButton disabled={disabled} onTranscript={onTranscript} />;
  }

  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={() => {
        onFocusInput?.();
        Alert.alert(
          'Use iPhone dictation',
          'Tap the microphone on your iPhone keyboard to speak. Your words will appear in the text box, then tap Parse with Cursor.',
        );
      }}
      disabled={disabled}>
      <Ionicons name="mic" size={22} color="#059669" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
