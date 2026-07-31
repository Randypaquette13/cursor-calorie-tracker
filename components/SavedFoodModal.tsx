import { useEffect, useState } from 'react';
import {
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
import type { SavedFoodInput } from '@/context/SavedFoodsContext';
import type { SavedFood } from '@/types/food';

interface SavedFoodModalProps {
  visible: boolean;
  food?: SavedFood | null;
  onClose: () => void;
  onSave: (input: SavedFoodInput) => Promise<void>;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SavedFoodModal({ visible, food, onClose, onSave }: SavedFoodModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(food?.name ?? '');
    setDescription(food?.description ?? '');
    setCalories(food?.calories != null ? String(food.calories) : '');
    setProtein(food?.protein != null ? String(food.protein) : '');
    setCarbs(food?.carbs != null ? String(food.carbs) : '');
    setFat(food?.fat != null ? String(food.fat) : '');
  }, [food, visible]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription || saving) return;

    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        description: trimmedDescription,
        calories: parseOptionalNumber(calories),
        protein: parseOptionalNumber(protein),
        carbs: parseOptionalNumber(carbs),
        fat: parseOptionalNumber(fat),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={() => !saving && onClose()} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            <Text style={styles.title}>{food ? 'Edit food' : 'Add food'}</Text>
            <Text style={styles.subtitle}>
              Give it a short name you will say when logging, plus a description Cursor can use to
              estimate nutrition.
            </Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder='e.g. "usual shake" or "homemade chili"'
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              editable={!saving}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ingredients, portions, how you make it..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!saving}
            />

            <Text style={styles.label}>Known nutrition (optional)</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Cal</Text>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                  editable={!saving}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>P</Text>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                  editable={!saving}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>C</Text>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                  editable={!saving}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>F</Text>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={onClose} disabled={saving}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}>
                <Text style={styles.primaryText}>{food ? 'Save' : 'Add'}</Text>
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
    maxHeight: '90%',
  },
  sheetContent: {
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroField: {
    flex: 1,
    gap: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  macroInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    flex: 1,
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
