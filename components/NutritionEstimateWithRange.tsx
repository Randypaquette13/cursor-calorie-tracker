import { StyleSheet, StyleProp, TextStyle, View } from 'react-native';

import { Text } from '@/components/Themed';
import {
  formatCaloriesEstimate,
  formatCaloriesRange,
  formatMacroEstimate,
  formatMacroRange,
  hasNutritionRange,
} from '@/utils/nutrition';

interface NutritionEstimateWithRangeProps {
  kind: 'calories' | 'macro';
  value: number;
  min?: number | null;
  max?: number | null;
  valueStyle?: StyleProp<TextStyle>;
  rangeStyle?: StyleProp<TextStyle>;
  align?: 'left' | 'right';
}

export function NutritionEstimateWithRange({
  kind,
  value,
  min = value,
  max = value,
  valueStyle,
  rangeStyle,
  align = 'left',
}: NutritionEstimateWithRangeProps) {
  const resolvedMin = min ?? value;
  const resolvedMax = max ?? value;
  const estimate =
    kind === 'calories' ? formatCaloriesEstimate(value) : formatMacroEstimate(value);
  const range =
    kind === 'calories'
      ? formatCaloriesRange(resolvedMin, resolvedMax)
      : formatMacroRange(resolvedMin, resolvedMax);

  return (
    <View style={[styles.container, align === 'right' && styles.alignRight]}>
      <Text style={valueStyle}>{estimate}</Text>
      {range ? <Text style={[styles.range, rangeStyle]}>{range}</Text> : null}
    </View>
  );
}

export function formatMacroRangeLine(entry: {
  protein: number;
  carbs: number;
  fat: number;
  proteinMin?: number | null;
  proteinMax?: number | null;
  carbsMin?: number | null;
  carbsMax?: number | null;
  fatMin?: number | null;
  fatMax?: number | null;
}) {
  const parts = [
    hasNutritionRange(entry.proteinMin ?? entry.protein, entry.proteinMax ?? entry.protein)
      ? `P ${formatMacroRange(entry.proteinMin ?? entry.protein, entry.proteinMax ?? entry.protein)}`
      : null,
    hasNutritionRange(entry.carbsMin ?? entry.carbs, entry.carbsMax ?? entry.carbs)
      ? `C ${formatMacroRange(entry.carbsMin ?? entry.carbs, entry.carbsMax ?? entry.carbs)}`
      : null,
    hasNutritionRange(entry.fatMin ?? entry.fat, entry.fatMax ?? entry.fat)
      ? `F ${formatMacroRange(entry.fatMin ?? entry.fat, entry.fatMax ?? entry.fat)}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  range: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
});
