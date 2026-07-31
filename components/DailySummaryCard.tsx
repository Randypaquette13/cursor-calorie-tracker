import { StyleSheet, View } from 'react-native';

import { SummaryNutritionValue } from '@/components/SummaryNutritionValue';
import { Text } from '@/components/Themed';
import type { DailySummary } from '@/types/food';

interface DailySummaryCardProps {
  summary: DailySummary;
  title?: string;
}

export function DailySummaryCard({ summary, title = "Today's totals" }: DailySummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <SummaryNutritionValue
        kind="calories"
        value={summary.calories}
        min={summary.caloriesMin}
        max={summary.caloriesMax}
        valueStyle={styles.calories}
        rangeStyle={styles.caloriesRange}
      />
      <View style={styles.macros}>
        <Macro
          label="Protein"
          value={summary.protein}
          min={summary.proteinMin}
          max={summary.proteinMax}
        />
        <Macro
          label="Carbs"
          value={summary.carbs}
          min={summary.carbsMin}
          max={summary.carbsMax}
        />
        <Macro label="Fat" value={summary.fat} min={summary.fatMin} max={summary.fatMax} />
      </View>
      <Text style={styles.meta}>{summary.entryCount} entries logged</Text>
    </View>
  );
}

function Macro({
  label,
  value,
  min,
  max,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
}) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <SummaryNutritionValue
        kind="macro"
        value={value}
        min={min}
        max={max}
        valueStyle={styles.macroValue}
        rangeStyle={styles.macroRange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  calories: {
    color: '#F9FAFB',
    fontSize: 40,
    fontWeight: '700',
  },
  caloriesRange: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
  },
  macroLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  macroValue: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
  },
  macroRange: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
});
