import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpeechMicButton } from '@/components/SpeechMicButton';
import { Text } from '@/components/Themed';
import { useAiProvider } from '@/hooks/useAiProvider';
import { isSpeechRecognitionAvailable } from '@/utils/speechRecognitionAvailable';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export function AddFoodModal({ visible, onClose, onSubmit }: AddFoodModalProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const insets = useSafeAreaInsets();
  const { label: providerLabel, refresh: refreshProvider } = useAiProvider();
  const voiceAvailable = isSpeechRecognitionAvailable();

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setText('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not start parse',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (visible) {
      void refreshProvider();
    }
  }, [refreshProvider, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <Pressable style={styles.backdrop} onPress={() => !submitting && onClose()} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            <Text style={styles.title}>Log food</Text>
            <Text style={styles.subtitle}>
              {listening
                ? 'Listening… tap the red stop button when you are done speaking.'
                : voiceAvailable
                  ? `Describe what you ate, or tap the mic and speak. Names from My Foods work too. ${providerLabel} estimates calories and macros in the background — you can close the app while it works.`
                  : `Describe what you ate, or use a name from My Foods (e.g. "usual shake"). ${providerLabel} will estimate calories and macros in the background — you can close the app while it works.`}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder='e.g. "2 eggs, toast with butter, and black coffee for breakfast"'
                placeholderTextColor="#9CA3AF"
                value={text}
                onChangeText={setText}
                multiline
                editable={!submitting && !listening}
              />
              <SpeechMicButton
                disabled={submitting}
                text={text}
                onChangeText={setText}
                onListeningChange={setListening}
              />
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={onClose} disabled={submitting}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, submitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>Send to {providerLabel}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  sheetContent: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 100,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    textAlignVertical: 'top',
    color: '#111827',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 12,
    backgroundColor: '#059669',
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
