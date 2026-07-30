import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

interface NativeSpeechMicButtonProps {
  disabled?: boolean;
  onTranscript: (text: string) => void;
}

export function NativeSpeechMicButton({ disabled, onTranscript }: NativeSpeechMicButtonProps) {
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    setStarting(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) {
      onTranscript(transcript);
    }
    if (event.isFinal) {
      ExpoSpeechRecognitionModule.stop();
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    setStarting(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      Alert.alert('Speech recognition error', event.message || event.error);
    }
  });

  const toggleListening = useCallback(async () => {
    if (disabled || starting) return;

    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    setStarting(true);
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone permission needed',
          'Allow microphone and speech recognition to log food by voice.',
        );
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      Alert.alert(
        'Speech recognition unavailable',
        error instanceof Error ? error.message : 'Could not start speech recognition.',
      );
    } finally {
      setStarting(false);
    }
  }, [disabled, listening, starting]);

  return (
    <Pressable
      style={[
        styles.button,
        listening && styles.buttonActive,
        (disabled || starting) && styles.buttonDisabled,
      ]}
      onPress={toggleListening}
      disabled={disabled || starting}>
      {starting ? (
        <ActivityIndicator color={listening ? '#FFFFFF' : '#059669'} size="small" />
      ) : (
        <Ionicons name={listening ? 'stop' : 'mic'} size={22} color={listening ? '#FFFFFF' : '#059669'} />
      )}
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
  buttonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
