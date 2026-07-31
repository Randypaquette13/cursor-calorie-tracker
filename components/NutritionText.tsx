import { StyleSheet, StyleProp, TextStyle } from 'react-native';

import { Text } from '@/components/Themed';
import { formatCalories, formatMacro, hasNutritionRange } from '@/utils/nutrition';

interface NutritionTextProps {
  kind: 'calories' | 'macro';
  value: number;
  min?: number | null;
  max?: number | null;
  style?: StyleProp<TextStyle>;
  rangeStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

export function NutritionText({
  kind,
  value,
  min = value,
  max = value,
  style,
  rangeStyle,
  numberOfLines,
  adjustsFontSizeToFit,
}: NutritionTextProps) {
  const resolvedMin = min ?? value;
  const resolvedMax = max ?? value;
  const isRange = hasNutritionRange(resolvedMin, resolvedMax);
  const label =
    kind === 'calories'
      ? formatCalories(value, resolvedMin, resolvedMax)
      : formatMacro(value, resolvedMin, resolvedMax);

  return (
    <Text
      style={[styles.base, style, isRange && (rangeStyle ?? styles.range)]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {},
  range: {
    fontSize: 16,
  },
});
