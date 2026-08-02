import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { ActivityBurnSummary } from '@/types/profile';

interface ActivityBurnCardProps {
  summary: ActivityBurnSummary;
  title?: string;
}

export function ActivityBurnCard({ summary, title = "Today's burn" }: ActivityBurnCardProps) {
  if (summary.entryCount === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.total}>{Math.round(summary.totalBurned)} kcal</Text>
      <Text style={styles.meta}>
        BMR {Math.round(summary.bmrTotal)} kcal · Activity +{Math.round(summary.activityTotal)} kcal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  title: {
    color: '#BFDBFE',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  total: {
    color: '#F9FAFB',
    fontSize: 36,
    fontWeight: '700',
  },
  meta: {
    color: '#DBEAFE',
    fontSize: 14,
  },
});
