import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { CopyableText } from '@/components/CopyableText';
import { Text } from '@/components/Themed';
import { useStrava } from '@/context/StravaContext';
import type { StravaActivitySummary } from '@/types/strava';
import {
  formatStravaActivityLine,
  formatStravaActivityTime,
  formatStravaDistance,
  formatStravaDuration,
} from '@/utils/strava';

interface StravaConnectCardProps {
  compact?: boolean;
}

export function StravaConnectCard({ compact = false }: StravaConnectCardProps) {
  const { connection, redirectUri, callbackDomain, connect, disconnect } = useStrava();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connect();
    } catch (error) {
      Alert.alert(
        'Could not connect Strava',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect Strava?', 'Workouts will no longer be pulled automatically.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => void disconnect(),
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bicycle" size={20} color="#FC4C02" />
          <Text style={styles.title}>Strava</Text>
        </View>
        {connection.connected ? (
          <Text style={styles.connectedBadge}>Connected</Text>
        ) : null}
      </View>

      {connection.connected ? (
        <>
          <Text style={styles.body}>
            {connection.athleteName
              ? `Linked as ${connection.athleteName}. Today's workouts are pulled in automatically when you log activity.`
              : 'Linked. Today\'s workouts are pulled in automatically when you log activity.'}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={handleDisconnect}>
            <Text style={styles.secondaryText}>Disconnect</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Connect Strava to automatically include recorded workouts for the selected day in your
            calorie burn estimate.
          </Text>
          {!compact ? (
            <>
              <Text style={styles.hint}>
                Set Strava Authorization Callback Domain to {callbackDomain}, then use:
              </Text>
              <CopyableText value={redirectUri} />
            </>
          ) : null}
          <Pressable style={styles.primaryButton} onPress={handleConnect} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Connect Strava</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

interface StravaActivitiesCardProps {
  activities: StravaActivitySummary[];
  loading?: boolean;
  dateLabel?: string;
}

export function StravaActivitiesCard({
  activities,
  loading = false,
  dateLabel = 'this day',
}: StravaActivitiesCardProps) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Strava activities</Text>
        <ActivityIndicator color="#FC4C02" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Strava activities</Text>
        <Text style={styles.body}>No Strava activities recorded for {dateLabel}.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Strava activities for {dateLabel}</Text>
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityName}>{activity.name}</Text>
            <Text style={styles.activityTime}>{formatStravaActivityTime(activity.startDate)}</Text>
          </View>
          <Text style={styles.activityMeta}>
            {activity.type} · {formatStravaDistance(activity.distanceMeters)} ·{' '}
            {formatStravaDuration(activity.movingTimeSeconds)} moving
            {activity.calories != null ? ` · ${Math.round(activity.calories)} kcal` : ''}
          </Text>
          <Text style={styles.activityPromptLine}>{formatStravaActivityLine(activity)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  connectedBadge: {
    color: '#FC4C02',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    color: '#6B7280',
    lineHeight: 20,
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#FC4C02',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  activityItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    gap: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  activityTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  activityMeta: {
    color: '#374151',
    fontSize: 13,
  },
  activityPromptLine: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
});
