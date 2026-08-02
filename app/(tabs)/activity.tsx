import { Ionicons } from '@expo/vector-icons';
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
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { useActivity } from '@/context/ActivityContext';
import { useActivityJobs } from '@/context/ActivityJobsContext';
import { useFood } from '@/context/FoodContext';
import { useProfile } from '@/context/ProfileContext';
import { useStrava } from '@/context/StravaContext';
import { useTabBar } from '@/context/TabBarContext';
import type { StravaActivitySummary } from '@/types/strava';
import { formatHeightCm, formatWeightKg } from '@/utils/bodyMetrics';
import { ACTIVITY_SCORE_EXPLANATION } from '@/utils/activityScore';
import { collectUniqueStravaActivities, summarizeStravaActivities } from '@/utils/strava';

export default function ActivityScreen() {
  const { today, logDate, setLogDate } = useFood();
  const { profile, latestWeight } = useProfile();
  const { entries, burnSummary, removeActivityEntry } = useActivity();
  const { displayJobs, submitActivityParse, dismissJob, retryJob } = useActivityJobs();
  const { connection, loadActivitiesForDate } = useStrava();
  const { onScroll } = useTabBar();
  const [modalVisible, setModalVisible] = useState(false);
  const [stravaActivities, setStravaActivities] = useState<StravaActivitySummary[]>([]);
  const [stravaLoading, setStravaLoading] = useState(false);

  const profileReady = profile.heightCm != null && latestWeight != null;

  const dateLabel = useMemo(() => {
    if (logDate === today) return 'today';
    try {
      return format(parseISO(logDate), 'MMM d');
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

  const hasEntries = burnSummary.entryCount > 0;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <Text style={styles.heading}>Activity</Text>

        <LogDateSelector logDate={logDate} today={today} onChange={setLogDate} />

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Burn {dateLabel === 'today' ? 'today' : dateLabel}</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="flame" size={14} color="#FDBA74" />
              <Text style={styles.heroBadgeText}>
                {hasEntries ? `${burnSummary.entryCount} logged` : 'Not logged'}
              </Text>
            </View>
          </View>

          {hasEntries ? (
            <>
              <Text style={styles.heroTotal}>
                {Math.round(burnSummary.totalBurned)}
                <Text style={styles.heroUnit}> kcal</Text>
              </Text>
              <View style={styles.heroBreakdown}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>BMR</Text>
                  <Text style={styles.heroStatValue}>{Math.round(burnSummary.bmrTotal)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Activity</Text>
                  <Text style={styles.heroStatValue}>+{Math.round(burnSummary.activityTotal)}</Text>
                </View>
              </View>
              {stravaSummaryLine ? (
                <Text style={styles.heroStrava}>{stravaSummaryLine}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.heroEmpty}>
              Describe your day below and Cursor will estimate total calories burned, including
              your BMR.
            </Text>
          )}
        </View>

        <Pressable
          style={[styles.primaryAction, !profileReady && styles.disabledAction]}
          onPress={() => setModalVisible(true)}
          disabled={!profileReady}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Log activity</Text>
        </Pressable>

        {!profileReady ? (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle" size={18} color="#B45309" />
            <Text style={styles.warningText}>
              Set your height in Profile and log your weight to enable burn estimates.
            </Text>
          </View>
        ) : (
          <Text style={styles.bodyStatsLine}>
            Using {formatHeightCm(profile.heightCm)} ·{' '}
            {latestWeight ? formatWeightKg(latestWeight.weightKg) : ''} · Score scale:{' '}
            {ACTIVITY_SCORE_EXPLANATION}
          </Text>
        )}

        <InProgressActivityParseList
          jobs={displayJobs}
          onDismiss={dismissJob}
          onRetry={retryJob}
        />

        {connection.connected ? (
          <StravaActivitiesCard
            activities={stravaActivities}
            loading={stravaLoading}
            dateLabel={dateLabel}
          />
        ) : null}

        {entries.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Logged estimates</Text>
            <ActivityEntryList entries={entries} onDelete={removeActivityEntry} />
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Connections</Text>
        <StravaConnectCard compact />
        <SettingsLinkCard compact />
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
  content: { padding: 20, gap: 16, paddingBottom: TAB_BAR_CLEARANCE },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827' },
  heroCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitle: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTotal: {
    color: '#F9FAFB',
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 48,
  },
  heroUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#BFDBFE',
  },
  heroBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroStat: { gap: 2 },
  heroStatLabel: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatValue: {
    color: '#EFF6FF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroStrava: {
    color: '#FDBA74',
    fontSize: 13,
    lineHeight: 18,
  },
  heroEmpty: {
    color: '#DBEAFE',
    lineHeight: 21,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledAction: { opacity: 0.45, shadowOpacity: 0 },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
  },
  warningText: {
    flex: 1,
    color: '#92400E',
    lineHeight: 19,
    fontSize: 13,
  },
  bodyStatsLine: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
});
