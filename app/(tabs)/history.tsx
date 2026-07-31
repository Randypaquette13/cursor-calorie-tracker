import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DailySummaryCard } from '@/components/DailySummaryCard';
import { FoodEntryList } from '@/components/FoodEntryList';
import { NutritionText } from '@/components/NutritionText';
import { Text } from '@/components/Themed';
import { useFood } from '@/context/FoodContext';
import { formatMacro, hasNutritionRange } from '@/utils/nutrition';

export default function HistoryScreen() {
  const {
    history,
    historySelectedDate,
    setHistorySelectedDate,
    historyEntries,
    historySummary,
    today,
    removeEntry,
    editEntry,
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
            const dayHasRange = hasNutritionRange(day.caloriesMin, day.caloriesMax);
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
                    {day.entryCount} entries · P{' '}
                    {formatMacro(day.protein, day.proteinMin, day.proteinMax)} · C{' '}
                    {formatMacro(day.carbs, day.carbsMin, day.carbsMax)} · F{' '}
                    {formatMacro(day.fat, day.fatMin, day.fatMax)}
                  </Text>
                  {dayHasRange ? <Text style={styles.rangeHint}>Includes estimated ranges</Text> : null}
                </View>
                <NutritionText
                  kind="calories"
                  value={day.calories}
                  min={day.caloriesMin}
                  max={day.caloriesMax}
                  style={styles.historyCalories}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                />
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.detailTitle}>{selectedLabel}</Text>
      <DailySummaryCard summary={historySummary} title="Day summary" />
      <FoodEntryList entries={historyEntries} onDelete={removeEntry} onEdit={editEntry} />
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
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  rangeHint: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
  },
  historyCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    maxWidth: 120,
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
