import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { ActivityEntry } from '@/types/profile';

interface ActivityEntryListProps {
  entries: ActivityEntry[];
  onDelete?: (id: number) => void;
}

export function ActivityEntryList({ entries, onDelete }: ActivityEntryListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No activity logged yet</Text>
        <Text style={styles.emptyBody}>
          Describe what you did today and how active you were (0–100) to get a calorie burn estimate.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.total}>{Math.round(entry.totalBurnedCalories)} kcal burned</Text>
            {onDelete ? (
              <Pressable
                hitSlop={8}
                onPress={() =>
                  Alert.alert('Delete activity estimate?', entry.summary ?? entry.rawInput, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
                  ])
                }>
                <Ionicons name="ellipsis-vertical" size={18} color="#6B7280" />
              </Pressable>
            ) : null}
          </View>
          {entry.summary ? <Text style={styles.summary}>{entry.summary}</Text> : null}
          <Text style={styles.meta}>
            BMR {Math.round(entry.bmrCalories)} kcal · Activity +{Math.round(entry.activityCalories)}{' '}
            kcal
            {entry.activityScore != null ? ` · Score ${Math.round(entry.activityScore)}/100` : ''}
          </Text>
          <Text style={styles.rawInput} numberOfLines={3}>
            {entry.rawInput}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  summary: {
    color: '#111827',
    lineHeight: 20,
  },
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
  rawInput: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111827',
  },
  emptyBody: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
});
