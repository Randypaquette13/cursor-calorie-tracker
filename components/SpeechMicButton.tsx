import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

interface SpeechMicButtonProps {
  disabled?: boolean;
  text: string;
  onChangeText: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

export function SpeechMicButton({
  disabled,
  text,
  onChangeText,
  onListeningChange,
}: SpeechMicButtonProps) {
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const baseTextRef = useRef('');

  const setListeningState = useCallback(
    (next: boolean) => {
      setListening(next);
      onListeningChange?.(next);
    },
    [onListeningChange],
  );

  useSpeechRecognitionEvent('start', () => setListeningState(true));
  useSpeechRecognitionEvent('end', () => {
    setListeningState(false);
    setStarting(false);
  });
  useSpeechRecognitionEvent('result', (event: {
    results: Array<{ transcript?: string }>;
    isFinal: boolean;
  }) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) return;

    const prefix = baseTextRef.current.trim();
    onChangeText(prefix ? `${prefix} ${transcript}` : transcript);

    if (event.isFinal) {
      baseTextRef.current = prefix ? `${prefix} ${transcript}` : transcript;
    }
  });
  useSpeechRecognitionEvent('error', (event: { error?: string; message?: string }) => {
    setListeningState(false);
    setStarting(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      Alert.alert('Speech recognition error', event.message || event.error || 'Unknown error');
    }
  });

  const toggleListening = useCallback(async () => {
    if (disabled || starting) return;

    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    setStarting(true);
    baseTextRef.current = text;

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
        continuous: true,
        requiresOnDeviceRecognition: true,
      });
    } catch (error) {
      Alert.alert(
        'Speech recognition unavailable',
        error instanceof Error ? error.message : 'Could not start speech recognition.',
      );
    } finally {
      setStarting(false);
    }
  }, [disabled, listening, starting, text]);

  return (
    <Pressable
      style={[
        styles.button,
        listening && styles.buttonActive,
        (disabled || starting) && styles.buttonDisabled,
      ]}
      onPress={toggleListening}
      disabled={disabled || starting}
      accessibilityLabel={listening ? 'Stop listening' : 'Start voice input'}>
      {starting ? (
        <ActivityIndicator color={listening ? '#FFFFFF' : '#059669'} size="small" />
      ) : (
        <Ionicons
          name={listening ? 'stop' : 'mic'}
          size={22}
          color={listening ? '#FFFFFF' : '#059669'}
        />
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
