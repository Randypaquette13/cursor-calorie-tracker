import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { ActivityParseJob } from '@/types/profile';

interface InProgressActivityParseListProps {
  jobs: ActivityParseJob[];
  onDismiss?: (id: number) => void;
  onRetry?: (id: number) => void;
}

function formatJobTime(createdAt: string) {
  try {
    return format(parseISO(createdAt), 'h:mm a');
  } catch {
    return createdAt;
  }
}

export function InProgressActivityParseList({
  jobs,
  onDismiss,
  onRetry,
}: InProgressActivityParseListProps) {
  const activeJobs = jobs.filter((job) => job.status === 'queued' || job.status === 'running');
  const failedJobs = jobs.filter((job) => job.status === 'failed');

  if (activeJobs.length === 0 && failedJobs.length === 0) {
    return null;
  }

  const showFailedMenu = (job: ActivityParseJob) => {
    Alert.alert('Estimate failed', job.errorMessage ?? 'Something went wrong.', [
      ...(onRetry ? [{ text: 'Retry', onPress: () => onRetry(job.id) }] : []),
      ...(onDismiss ? [{ text: 'Dismiss', style: 'destructive' as const, onPress: () => onDismiss(job.id) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={styles.container}>
      {activeJobs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In progress</Text>
          {activeJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <ActivityIndicator size="small" color="#2563EB" />
              <View style={styles.jobContent}>
                <Text style={styles.jobInput} numberOfLines={3}>
                  {job.rawInput}
                </Text>
                <Text style={styles.jobMeta}>
                  {job.status === 'queued' ? 'Queued' : 'Estimating with Cursor'} ·{' '}
                  {formatJobTime(job.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {failedJobs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Needs attention</Text>
          {failedJobs.map((job) => (
            <Pressable
              key={job.id}
              style={styles.failedCard}
              onPress={() => showFailedMenu(job)}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <View style={styles.jobContent}>
                <Text style={styles.jobInput} numberOfLines={2}>
                  {job.rawInput}
                </Text>
                <Text style={styles.failedMeta} numberOfLines={2}>
                  {job.errorMessage ?? 'Estimate failed'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  failedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  jobContent: { flex: 1, gap: 4 },
  jobInput: { fontSize: 15, fontWeight: '600', color: '#111827' },
  jobMeta: { fontSize: 12, color: '#1D4ED8' },
  failedMeta: { fontSize: 12, color: '#B91C1C' },
});
