import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DailySummaryCard } from '@/components/DailySummaryCard';
import { FoodEntryList } from '@/components/FoodEntryList';
import { Text } from '@/components/Themed';
import { useFood } from '@/context/FoodContext';

export default function HistoryScreen() {
  const {
    history,
    historySelectedDate,
    setHistorySelectedDate,
    historyEntries,
    historySummary,
    today,
    removeEntry,
  } = useFood();

  const selectedLabel = useMemo(() => {
    try {
      return format(parseISO(historySelectedDate), 'EEEE, MMM d, yyyy');
    } catch {
      return historySelectedDate;
    }
  }, [historySelectedDate]);

  return (
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
                <View>
                  <Text style={styles.historyDate}>
                    {day.date === today ? 'Today' : day.date}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {day.entryCount} entries · P {Math.round(day.protein)}g · C{' '}
                    {Math.round(day.carbs)}g · F {Math.round(day.fat)}g
                  </Text>
                </View>
                <Text style={styles.historyCalories}>{Math.round(day.calories)} kcal</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.detailTitle}>{selectedLabel}</Text>
      <DailySummaryCard summary={historySummary} title="Day summary" />
      <FoodEntryList entries={historyEntries} onDelete={removeEntry} />
    </ScrollView>
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
});
