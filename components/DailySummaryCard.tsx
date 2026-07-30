import { StyleSheet, View } from 'react-native';

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
      <Text style={styles.calories}>{Math.round(summary.calories)} kcal</Text>
      <View style={styles.macros}>
        <Macro label="Protein" value={summary.protein} unit="g" />
        <Macro label="Carbs" value={summary.carbs} unit="g" />
        <Macro label="Fat" value={summary.fat} unit="g" />
      </View>
      <Text style={styles.meta}>{summary.entryCount} entries logged</Text>
    </View>
  );
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {Math.round(value)}
        {unit}
      </Text>
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
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
});
