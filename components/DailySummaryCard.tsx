import { StyleSheet, View } from 'react-native';

import { NutritionEstimateWithRange } from '@/components/NutritionEstimateWithRange';
import { Text } from '@/components/Themed';
import type { DailySummary } from '@/types/food';
import type { MacroTargets } from '@/utils/macroTargets';
import { formatCaloriesEstimate, formatMacroEstimate } from '@/utils/nutrition';

interface DailySummaryCardProps {
  summary: DailySummary;
  title?: string;
  targets?: MacroTargets | null;
}

export function DailySummaryCard({
  summary,
  title = "Today's totals",
  targets = null,
}: DailySummaryCardProps) {
  const targetHint =
    targets?.basis === 'activity'
      ? 'Targets include logged activity and update when activity changes'
      : targets?.basis === 'bmr'
        ? 'Targets based on height and weight (BMR). Ideals will increase when you log activity.'
        : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <NutritionEstimateWithRange
        kind="calories"
        value={summary.calories}
        min={summary.caloriesMin}
        max={summary.caloriesMax}
        valueStyle={styles.calories}
        rangeStyle={styles.caloriesRange}
      />
      {targets ? (
        <Text style={styles.caloriesIdeal}>ideal {formatCaloriesEstimate(targets.calories)}</Text>
      ) : null}
      <View style={styles.macros}>
        <Macro
          label="Protein"
          value={summary.protein}
          min={summary.proteinMin}
          max={summary.proteinMax}
          ideal={targets?.protein}
          idealComparison="min"
        />
        <Macro
          label="Carbs"
          value={summary.carbs}
          min={summary.carbsMin}
          max={summary.carbsMax}
          ideal={targets?.carbs}
        />
        <Macro
          label="Fat"
          value={summary.fat}
          min={summary.fatMin}
          max={summary.fatMax}
          ideal={targets?.fat}
          idealComparison="max"
        />
      </View>
      <Text style={styles.meta}>{summary.entryCount} entries logged</Text>
      {targetHint ? <Text style={styles.targetHint}>{targetHint}</Text> : null}
    </View>
  );
}

function formatIdealMacro(ideal: number, comparison?: 'min' | 'max') {
  const amount = formatMacroEstimate(ideal);
  if (comparison === 'min') return `ideal > ${amount}`;
  if (comparison === 'max') return `ideal < ${amount}`;
  return `ideal ${amount}`;
}

function Macro({
  label,
  value,
  min,
  max,
  ideal,
  idealComparison,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  ideal?: number;
  idealComparison?: 'min' | 'max';
}) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <NutritionEstimateWithRange
        kind="macro"
        value={value}
        min={min}
        max={max}
        valueStyle={styles.macroValue}
        rangeStyle={styles.macroRange}
      />
      {ideal != null ? (
        <Text style={styles.macroIdeal}>{formatIdealMacro(ideal, idealComparison)}</Text>
      ) : null}
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
  caloriesIdeal: {
    color: '#6EE7B7',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
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
    gap: 2,
  },
  macroLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
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
  macroIdeal: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
  targetHint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
});
