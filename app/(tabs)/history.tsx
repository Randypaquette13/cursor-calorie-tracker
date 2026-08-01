import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { AddFoodModal } from '@/components/AddFoodModal';
import { DailySummaryCard } from '@/components/DailySummaryCard';
import { FoodEntryList } from '@/components/FoodEntryList';
import { InProgressParseList } from '@/components/InProgressParseList';
import { LogDateSelector } from '@/components/LogDateSelector';
import { Text } from '@/components/Themed';
import { useFood } from '@/context/FoodContext';
import { useParseJobs } from '@/context/ParseJobsContext';
import { formatCaloriesEstimate, formatMacroEstimate } from '@/utils/nutrition';

export default function HistoryScreen() {
  const {
    history,
    historySelectedDate,
    setHistorySelectedDate,
    historyEntries,
    historySummary,
    today,
    logDate,
    setLogDate,
    removeEntry,
    editEntry,
  } = useFood();
  const { displayJobs, submitParse, dismissJob, retryJob } = useParseJobs();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setLogDate(historySelectedDate);
  }, [historySelectedDate, setLogDate]);

  const selectedLabel = useMemo(() => {
    try {
      return format(parseISO(historySelectedDate), 'EEEE, MMM d, yyyy');
    } catch {
      return historySelectedDate;
    }
  }, [historySelectedDate]);

  const handleParse = async (text: string) => {
    await submitParse(text);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>History</Text>
        <Text style={styles.subheading}>Tap a day to review what you logged.</Text>

        <View style={styles.historyList}>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Your logged days will appear here.</Text>
            </View>
          ) : (
            history.map((day) => {
              const selected = day.date === historySelectedDate;
              return (
                <Pressable
                  key={day.date}
                  style={[styles.historyItem, selected && styles.historyItemSelected]}
                  onPress={() => setHistorySelectedDate(day.date)}>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyDate}>
                      {day.date === today ? 'Today' : day.date}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {day.entryCount} entries · P {formatMacroEstimate(day.protein)} · C{' '}
                      {formatMacroEstimate(day.carbs)} · F {formatMacroEstimate(day.fat)}
                    </Text>
                  </View>
                  <Text style={styles.historyCalories}>{formatCaloriesEstimate(day.calories)}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <Text style={styles.detailTitle}>{selectedLabel}</Text>
        <LogDateSelector logDate={logDate} today={today} onChange={setHistorySelectedDate} />
        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={() => setModalVisible(true)}>
            <Text style={styles.primaryActionText}>Log food to this day</Text>
          </Pressable>
          <Link href="/barcode" asChild>
            <Pressable style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Scan barcode</Text>
            </Pressable>
          </Link>
        </View>
        <InProgressParseList jobs={displayJobs} onDismiss={dismissJob} onRetry={retryJob} />
        <DailySummaryCard summary={historySummary} title="Day summary" />
        <FoodEntryList entries={historyEntries} onDelete={removeEntry} onEdit={editEntry} />
      </ScrollView>
      <AddFoodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleParse}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subheading: {
    color: '#6B7280',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  historyItemSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  historyCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  emptyHistory: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 20,
  },
  emptyHistoryText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  actions: {
    gap: 10,
  },
  primaryAction: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryActionText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
});
