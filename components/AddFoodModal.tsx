import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { SpeechMicButton } from '@/components/SpeechMicButton';
import { Text } from '@/components/Themed';
import { isSpeechRecognitionAvailable } from '@/utils/speechRecognitionAvailable';

interface AddFoodModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export function AddFoodModal({ visible, loading, onClose, onSubmit }: AddFoodModalProps) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const speechAvailable = isSpeechRecognitionAvailable();

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    await onSubmit(trimmed);
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Log food</Text>
          <Text style={styles.subtitle}>
            {speechAvailable && listening
              ? 'Listening… tap the red stop button when you are done speaking.'
              : speechAvailable
                ? 'Describe what you ate, or tap the mic and speak. Cursor will estimate calories and macros.'
                : 'Describe what you ate in the text box. Cursor will estimate calories and macros.'}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder='e.g. "2 eggs, toast with butter, and black coffee for breakfast"'
              placeholderTextColor="#9CA3AF"
              value={text}
              onChangeText={setText}
              multiline
              editable={!loading && !listening}
            />
            {speechAvailable ? (
              <SpeechMicButton
                disabled={loading}
                text={text}
                onChangeText={setText}
                onListeningChange={setListening}
              />
            ) : null}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={loading}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>Parse with Cursor</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    minHeight: 120,
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
