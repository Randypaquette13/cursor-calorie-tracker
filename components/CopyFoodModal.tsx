import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectableFoodEntryList } from '@/components/SelectableFoodEntryList';
import { Text } from '@/components/Themed';
import { getEntriesForDate } from '@/services/database';
import type { DailySummary, FoodEntry } from '@/types/food';
import { formatLogDateLabel } from '@/utils/logDate';
import { formatCaloriesEstimate } from '@/utils/nutrition';

interface CopyFoodModalProps {
  visible: boolean;
  onClose: () => void;
  targetDate: string;
  today: string;
  history: DailySummary[];
  initialSourceDate?: string | null;
  onCopy: (entryIds: number[], targetDate: string) => Promise<void>;
}

export function CopyFoodModal({
  visible,
  onClose,
  targetDate,
  today,
  history,
  initialSourceDate = null,
  onCopy,
}: CopyFoodModalProps) {
  const insets = useSafeAreaInsets();
  const [sourceDate, setSourceDate] = useState<string | null>(initialSourceDate);
  const [sourceEntries, setSourceEntries] = useState<FoodEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [copying, setCopying] = useState(false);

  const targetLabel = formatLogDateLabel(targetDate, today);

  const sourceDays = useMemo(
    () =>
      history.filter((day) => day.entryCount > 0 && day.date !== targetDate).sort((a, b) => b.date.localeCompare(a.date)),
    [history, targetDate],
  );

  const reset = useCallback(() => {
    setSourceDate(initialSourceDate);
    setSourceEntries([]);
    setSelectedIds(new Set());
    setLoadingEntries(false);
    setCopying(false);
  }, [initialSourceDate]);

  useEffect(() => {
    if (!visible) {
      reset();
      return;
    }
    setSourceDate(initialSourceDate);
  }, [visible, initialSourceDate, reset]);

  useEffect(() => {
    if (!visible || !sourceDate) {
      setSourceEntries([]);
      setSelectedIds(new Set());
      return;
    }

    let cancelled = false;
    setLoadingEntries(true);

    void getEntriesForDate(sourceDate).then((entries) => {
      if (cancelled) return;
      setSourceEntries(entries);
      setSelectedIds(new Set(entries.map((entry) => entry.id)));
      setLoadingEntries(false);
    });

    return () => {
      cancelled = true;
    };
  }, [sourceDate, visible]);

  const handleClose = () => {
    if (copying) return;
    onClose();
  };

  const toggleEntry = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(sourceEntries.map((entry) => entry.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleCopy = async () => {
    if (selectedIds.size === 0 || copying) return;

    setCopying(true);
    try {
      await onCopy(Array.from(selectedIds), targetDate);
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not copy food',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setCopying(false);
    }
  };

  const sourceLabel = sourceDate ? formatLogDateLabel(sourceDate, today) : null;
  const selectedCount = selectedIds.size;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} disabled={copying} hitSlop={8}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Copy food</Text>
            <Text style={styles.headerSubtitle}>To {targetLabel}</Text>
          </View>
          {sourceDate ? (
            <Pressable
              onPress={selectedCount === sourceEntries.length ? clearSelection : selectAll}
              disabled={copying || sourceEntries.length === 0}
              hitSlop={8}>
              <Text style={styles.headerAction}>
                {selectedCount === sourceEntries.length ? 'Clear' : 'All'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!sourceDate ? (
            <>
              <Text style={styles.sectionTitle}>Pick a day to copy from</Text>
              {sourceDays.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No other days with food logged yet. Log meals on previous days first.
                  </Text>
                </View>
              ) : (
                sourceDays.map((day) => (
                  <Pressable
                    key={day.date}
                    style={styles.dayRow}
                    onPress={() => setSourceDate(day.date)}>
                    <View style={styles.dayCopy}>
                      <Text style={styles.dayLabel}>{formatLogDateLabel(day.date, today)}</Text>
                      <Text style={styles.dayMeta}>
                        {day.entryCount} item{day.entryCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Text style={styles.dayCalories}>{formatCaloriesEstimate(day.calories)}</Text>
                  </Pressable>
                ))
              )}
            </>
          ) : (
            <>
              <Pressable style={styles.backRow} onPress={() => setSourceDate(null)} disabled={copying}>
                <Text style={styles.backText}>← Choose another day</Text>
              </Pressable>
              <Text style={styles.sectionTitle}>{sourceLabel}</Text>
              {loadingEntries ? (
                <ActivityIndicator color="#059669" style={styles.loader} />
              ) : (
                <SelectableFoodEntryList
                  entries={sourceEntries}
                  selectedIds={selectedIds}
                  onToggle={toggleEntry}
                />
              )}
            </>
          )}
        </ScrollView>

        {sourceDate ? (
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.copyButton,
                (selectedCount === 0 || copying) && styles.copyButtonDisabled,
              ]}
              onPress={handleCopy}
              disabled={selectedCount === 0 || copying}>
              {copying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.copyButtonText}>
                  Copy {selectedCount} item{selectedCount === 1 ? '' : 's'} to {targetLabel}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 13,
  },
  headerAction: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 15,
    minWidth: 48,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayCopy: {
    flex: 1,
    gap: 2,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dayMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  dayCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  backRow: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    color: '#059669',
    fontWeight: '600',
  },
  loader: {
    marginTop: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    color: '#6B7280',
    lineHeight: 21,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  copyButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  copyButtonDisabled: {
    opacity: 0.5,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});
