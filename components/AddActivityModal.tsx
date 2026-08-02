import { useState } from 'react';
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

import { Text } from '@/components/Themed';
import {
  ACTIVITY_SCORE_EXPLANATION,
  ACTIVITY_SCORE_SHORT,
} from '@/utils/activityScore';

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export function AddActivityModal({ visible, onClose, onSubmit }: AddActivityModalProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

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
        'Could not start estimate',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            <Text style={styles.title}>Log activity</Text>
            <Text style={styles.subtitle}>
              What did you do today? Rate how the day felt overall on a {ACTIVITY_SCORE_EXPLANATION}{' '}
              Cursor estimates your daily BMR and activity burn using your height and weight.
            </Text>
            <Text style={styles.scaleHint}>{ACTIVITY_SCORE_SHORT}</Text>
            <TextInput
              style={styles.input}
              placeholder={'e.g. "Morning run 3 miles, desk job all afternoon, evening walk. Score: 55/100"'}
              placeholderTextColor="#9CA3AF"
              value={text}
              onChangeText={setText}
              multiline
              editable={!submitting}
            />
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
                  <Text style={styles.primaryText}>Send to Cursor</Text>
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  sheetContent: { padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6B7280', lineHeight: 20 },
  scaleHint: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
  },
  input: {
    minHeight: 120,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    textAlignVertical: 'top',
    color: '#111827',
    fontSize: 16,
  },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: '#374151', fontWeight: '600' },
  primaryButton: {
    flex: 1.4,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.7 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
});
