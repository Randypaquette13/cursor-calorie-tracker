import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActivityEntryList } from '@/components/ActivityEntryList';
import { AddActivityModal } from '@/components/AddActivityModal';
import { InProgressActivityParseList } from '@/components/InProgressActivityParseList';
import { LogDateSelector } from '@/components/LogDateSelector';
import { StravaActivitiesCard, StravaConnectCard } from '@/components/StravaSection';
import { SettingsLinkCard } from '@/components/SettingsLinkCard';
import { Text } from '@/components/Themed';
import { useActivity } from '@/context/ActivityContext';
import { useActivityJobs } from '@/context/ActivityJobsContext';
import { useFood } from '@/context/FoodContext';
import { useProfile } from '@/context/ProfileContext';
import { useStrava } from '@/context/StravaContext';
import type { StravaActivitySummary } from '@/types/strava';
import { formatHeightCm, formatWeightKg } from '@/utils/bodyMetrics';
import { collectUniqueStravaActivities, summarizeStravaActivities } from '@/utils/strava';

export default function ActivityScreen() {
  const { today, logDate, setLogDate } = useFood();
  const { profile, latestWeight } = useProfile();
  const { entries, burnSummary, removeActivityEntry } = useActivity();
  const { displayJobs, submitActivityParse, dismissJob, retryJob } = useActivityJobs();
  const { connection, loadActivitiesForDate } = useStrava();
  const [modalVisible, setModalVisible] = useState(false);
  const [stravaActivities, setStravaActivities] = useState<StravaActivitySummary[]>([]);
  const [stravaLoading, setStravaLoading] = useState(false);

  const profileReady = profile.heightCm != null && latestWeight != null;

  const dateLabel = useMemo(() => {
    if (logDate === today) return 'today';
    try {
      return format(parseISO(logDate), 'MMM d, yyyy');
    } catch {
      return logDate;
    }
  }, [logDate, today]);

  useEffect(() => {
    if (!connection.connected) {
      setStravaActivities([]);
      return;
    }

    let cancelled = false;
    setStravaLoading(true);

    loadActivitiesForDate(logDate)
      .then((activities) => {
        if (!cancelled) {
          setStravaActivities(activities);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStravaActivities([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStravaLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connection.connected, loadActivitiesForDate, logDate]);

  const storedStravaActivities = useMemo(() => collectUniqueStravaActivities(entries), [entries]);
  const summaryStravaActivities =
    connection.connected && stravaActivities.length > 0 ? stravaActivities : storedStravaActivities;
  const stravaSummaryLine = summarizeStravaActivities(summaryStravaActivities);

  const handleSubmit = async (text: string) => {
    await submitActivityParse(text);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Activity</Text>
        <Text style={styles.subheading}>
          Describe your day and how active you were (0–100). Cursor estimates total calories burned
          including BMR. When Strava is connected, workouts for the selected day are included
          automatically.
        </Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Used for estimates</Text>
          <Text style={styles.statsLine}>Height: {formatHeightCm(profile.heightCm)}</Text>
          <Text style={styles.statsLine}>
            Weight: {latestWeight ? formatWeightKg(latestWeight.weightKg) : 'Not logged'}
          </Text>
          {!profileReady ? (
            <Text style={styles.statsWarning}>
              Set your height in Profile and log your weight before estimating burn.
            </Text>
          ) : null}
        </View>

        <StravaConnectCard compact />

        <SettingsLinkCard compact />

        <LogDateSelector logDate={logDate} today={today} onChange={setLogDate} />

        {connection.connected ? (
          <StravaActivitiesCard
            activities={stravaActivities}
            loading={stravaLoading}
            dateLabel={dateLabel}
          />
        ) : null}

        {burnSummary.entryCount > 0 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Day burn estimate</Text>
            <Text style={styles.summaryTotal}>{Math.round(burnSummary.totalBurned)} kcal</Text>
            <Text style={styles.summaryMeta}>
              BMR {Math.round(burnSummary.bmrTotal)} · Activity +{Math.round(burnSummary.activityTotal)}
            </Text>
            {stravaSummaryLine ? (
              <Text style={styles.summaryStrava}>{stravaSummaryLine}</Text>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryAction, !profileReady && styles.disabledAction]}
          onPress={() => setModalVisible(true)}
          disabled={!profileReady}>
          <Text style={styles.primaryActionText}>Log today&apos;s activity</Text>
        </Pressable>

        <InProgressActivityParseList
          jobs={displayJobs}
          onDismiss={dismissJob}
          onRetry={retryJob}
        />

        <Text style={styles.sectionTitle}>Estimates</Text>
        <ActivityEntryList entries={entries} onDelete={removeActivityEntry} />
      </ScrollView>

      <AddActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subheading: { color: '#6B7280', lineHeight: 21 },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  statsTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  statsLine: { color: '#374151' },
  statsWarning: { color: '#B45309', marginTop: 4, lineHeight: 20 },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  summaryTitle: { color: '#1D4ED8', fontWeight: '700' },
  summaryTotal: { fontSize: 28, fontWeight: '700', color: '#1E3A8A' },
  summaryMeta: { color: '#2563EB' },
  summaryStrava: { color: '#FC4C02', fontSize: 13, lineHeight: 18, marginTop: 4 },
  primaryAction: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledAction: { opacity: 0.5 },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
});
