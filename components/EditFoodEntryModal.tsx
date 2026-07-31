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
import type { FoodEntry, MealType } from '@/types/food';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'unknown'];

export interface FoodEntryEditInput {
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface EditFoodEntryModalProps {
  visible: boolean;
  entry: FoodEntry | null;
  onClose: () => void;
  onSave: (input: FoodEntryEditInput) => Promise<void>;
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function EditFoodEntryModal({ visible, entry, onClose, onSave }: EditFoodEntryModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('unknown');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !entry) return;
    setName(entry.name);
    setMealType(entry.mealType);
    setCalories(String(Math.round(entry.calories)));
    setProtein(String(Math.round(entry.protein)));
    setCarbs(String(Math.round(entry.carbs)));
    setFat(String(Math.round(entry.fat)));
  }, [entry, visible]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;

    setSaving(true);
    try {
      await onSave({
        mealType,
        name: trimmedName,
        calories: parseNumber(calories),
        protein: parseNumber(protein),
        carbs: parseNumber(carbs),
        fat: parseNumber(fat),
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
            <Text style={styles.title}>Edit food</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />

            <Text style={styles.label}>Meal</Text>
            <View style={styles.mealRow}>
              {MEAL_TYPES.map((type) => {
                const selected = mealType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.mealChip, selected && styles.mealChipSelected]}
                    onPress={() => setMealType(type)}
                    disabled={saving}>
                    <Text style={[styles.mealChipText, selected && styles.mealChipTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Nutrition</Text>
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
                <Text style={styles.primaryText}>Save</Text>
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
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mealChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  mealChipText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealChipTextSelected: {
    color: '#047857',
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
