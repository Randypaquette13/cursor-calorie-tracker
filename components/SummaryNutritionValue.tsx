import { StyleSheet, StyleProp, TextStyle, View } from 'react-native';

import { Text } from '@/components/Themed';
import {
  formatCaloriesEstimate,
  formatCaloriesRange,
  formatMacroEstimate,
  formatMacroRange,
} from '@/utils/nutrition';

interface SummaryNutritionValueProps {
  kind: 'calories' | 'macro';
  value: number;
  min?: number | null;
  max?: number | null;
  valueStyle?: StyleProp<TextStyle>;
  rangeStyle?: StyleProp<TextStyle>;
}

export function SummaryNutritionValue({
  kind,
  value,
  min = value,
  max = value,
  valueStyle,
  rangeStyle,
}: SummaryNutritionValueProps) {
  const estimate =
    kind === 'calories' ? formatCaloriesEstimate(value) : formatMacroEstimate(value);
  const range =
    kind === 'calories'
      ? formatCaloriesRange(min ?? value, max ?? value)
      : formatMacroRange(min ?? value, max ?? value);

  return (
    <View style={styles.container}>
      <Text style={valueStyle}>{estimate}</Text>
      {range ? <Text style={[styles.range, rangeStyle]}>{range}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  range: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
  },
});
