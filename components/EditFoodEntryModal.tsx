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
import {
  formatCaloriesEstimate,
  formatCaloriesRange,
  formatFullNutrition,
  midpoint,
} from '@/utils/nutrition';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'unknown'];

export interface FoodEntryEditInput {
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  caloriesMin: number;
  caloriesMax: number;
  proteinMin: number;
  proteinMax: number;
  carbsMin: number;
  carbsMax: number;
  fatMin: number;
  fatMax: number;
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

function parseBounds(minValue: string, maxValue: string, fallback: number) {
  const min = parseNumber(minValue, fallback);
  const max = parseNumber(maxValue, min);
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    point: midpoint(Math.min(min, max), Math.max(min, max)),
  };
}

function BoundField({
  label,
  minValue,
  maxValue,
  onChangeMin,
  onChangeMax,
  disabled,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.boundField}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.boundInputs}>
        <TextInput
          style={styles.boundInput}
          keyboardType="numeric"
          value={minValue}
          onChangeText={onChangeMin}
          editable={!disabled}
          placeholder="Min"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.boundDash}>-</Text>
        <TextInput
          style={styles.boundInput}
          keyboardType="numeric"
          value={maxValue}
          onChangeText={onChangeMax}
          editable={!disabled}
          placeholder="Max"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );
}

export function EditFoodEntryModal({ visible, entry, onClose, onSave }: EditFoodEntryModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('unknown');
  const [caloriesMin, setCaloriesMin] = useState('');
  const [caloriesMax, setCaloriesMax] = useState('');
  const [proteinMin, setProteinMin] = useState('');
  const [proteinMax, setProteinMax] = useState('');
  const [carbsMin, setCarbsMin] = useState('');
  const [carbsMax, setCarbsMax] = useState('');
  const [fatMin, setFatMin] = useState('');
  const [fatMax, setFatMax] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !entry) return;
    setName(entry.name);
    setMealType(entry.mealType);
    setCaloriesMin(String(Math.round(entry.caloriesMin ?? entry.calories)));
    setCaloriesMax(String(Math.round(entry.caloriesMax ?? entry.calories)));
    setProteinMin(String(Math.round(entry.proteinMin ?? entry.protein)));
    setProteinMax(String(Math.round(entry.proteinMax ?? entry.protein)));
    setCarbsMin(String(Math.round(entry.carbsMin ?? entry.carbs)));
    setCarbsMax(String(Math.round(entry.carbsMax ?? entry.carbs)));
    setFatMin(String(Math.round(entry.fatMin ?? entry.fat)));
    setFatMax(String(Math.round(entry.fatMax ?? entry.fat)));
  }, [entry, visible]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;

    const calories = parseBounds(caloriesMin, caloriesMax, 0);
    const protein = parseBounds(proteinMin, proteinMax, 0);
    const carbs = parseBounds(carbsMin, carbsMax, 0);
    const fat = parseBounds(fatMin, fatMax, 0);

    setSaving(true);
    try {
      await onSave({
        mealType,
        name: trimmedName,
        calories: calories.point,
        protein: protein.point,
        carbs: carbs.point,
        fat: fat.point,
        caloriesMin: calories.min,
        caloriesMax: calories.max,
        proteinMin: protein.min,
        proteinMax: protein.max,
        carbsMin: carbs.min,
        carbsMax: carbs.max,
        fatMin: fat.min,
        fatMax: fat.max,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentPreview = entry
    ? [
        formatCaloriesEstimate(entry.calories),
        formatCaloriesRange(entry.caloriesMin, entry.caloriesMax),
        formatFullNutrition(entry),
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

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
            {entry && currentPreview ? (
              <Text style={styles.preview}>Current: {currentPreview}</Text>
            ) : null}
            <Text style={styles.helper}>
              Use a min-max range when the portion is uncertain. Set both fields the same for an
              exact value.
            </Text>

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

            <Text style={styles.label}>Nutrition ranges</Text>
            <BoundField
              label="Calories"
              minValue={caloriesMin}
              maxValue={caloriesMax}
              onChangeMin={setCaloriesMin}
              onChangeMax={setCaloriesMax}
              disabled={saving}
            />
            <BoundField
              label="Protein (g)"
              minValue={proteinMin}
              maxValue={proteinMax}
              onChangeMin={setProteinMin}
              onChangeMax={setProteinMax}
              disabled={saving}
            />
            <BoundField
              label="Carbs (g)"
              minValue={carbsMin}
              maxValue={carbsMax}
              onChangeMin={setCarbsMin}
              onChangeMax={setCarbsMax}
              disabled={saving}
            />
            <BoundField
              label="Fat (g)"
              minValue={fatMin}
              maxValue={fatMax}
              onChangeMin={setFatMin}
              onChangeMax={setFatMax}
              disabled={saving}
            />

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
  preview: {
    color: '#059669',
    fontWeight: '600',
    lineHeight: 20,
  },
  helper: {
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
  boundField: {
    gap: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  boundInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boundInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 16,
    textAlign: 'center',
  },
  boundDash: {
    color: '#6B7280',
    fontWeight: '700',
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
