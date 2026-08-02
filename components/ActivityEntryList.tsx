import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { ActivityEntry } from '@/types/profile';
import {
  formatStravaActivityTime,
  formatStravaDistance,
  formatStravaDuration,
  parseStravaActivitiesJson,
} from '@/utils/strava';

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
      {entries.map((entry) => {
        const stravaActivities = parseStravaActivitiesJson(entry.stravaActivitiesJson);

        return (
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
            {stravaActivities.length > 0 ? (
              <View style={styles.stravaBlock}>
                <Text style={styles.stravaTitle}>Included from Strava</Text>
                {stravaActivities.map((activity) => (
                  <View key={activity.id} style={styles.stravaItem}>
                    <View style={styles.stravaHeader}>
                      <Text style={styles.stravaName}>{activity.name}</Text>
                      <Text style={styles.stravaTime}>
                        {formatStravaActivityTime(activity.startDate)}
                      </Text>
                    </View>
                    <Text style={styles.stravaMeta}>
                      {activity.type} · {formatStravaDistance(activity.distanceMeters)} ·{' '}
                      {formatStravaDuration(activity.movingTimeSeconds)} moving
                      {activity.calories != null ? ` · ${Math.round(activity.calories)} kcal` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.rawInput} numberOfLines={3}>
              {entry.rawInput}
            </Text>
          </View>
        );
      })}
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
  stravaBlock: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  stravaTitle: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stravaItem: {
    gap: 2,
  },
  stravaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  stravaName: {
    flex: 1,
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  stravaTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  stravaMeta: {
    color: '#374151',
    fontSize: 12,
    lineHeight: 18,
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
    color: '#374151',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
