import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { FoodEntry } from '@/types/food';
import {
  effectiveNutrition,
  formatCaloriesEstimate,
  formatServingsLabel,
} from '@/utils/nutrition';

interface SelectableFoodEntryListProps {
  entries: FoodEntry[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}

export function SelectableFoodEntryList({
  entries,
  selectedIds,
  onToggle,
}: SelectableFoodEntryListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No food logged on this day.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => {
        const selected = selectedIds.has(entry.id);
        const scaled = effectiveNutrition(entry);
        const servingsLabel = formatServingsLabel(entry.servings);

        return (
          <Pressable
            key={entry.id}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => onToggle(entry.id)}>
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>
                {entry.name}
                {servingsLabel ? ` ${servingsLabel}` : ''}
              </Text>
              <Text style={styles.meta}>
                {formatCaloriesEstimate(scaled.calories)}
                {entry.mealType !== 'unknown' ? ` · ${entry.mealType}` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
  empty: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});
