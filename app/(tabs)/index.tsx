import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { AddFoodModal } from '@/components/AddFoodModal';
import { DailySummaryCard } from '@/components/DailySummaryCard';
import { FoodEntryList } from '@/components/FoodEntryList';
import { InProgressParseList } from '@/components/InProgressParseList';
import { Text } from '@/components/Themed';
import { ParseJobsProvider, useParseJobs } from '@/context/ParseJobsContext';
import { useFood } from '@/context/FoodContext';

function TodayScreenContent() {
  const { todaySummary, todayEntries, editEntry, removeEntry } = useFood();
  const { displayJobs, submitParse, dismissJob, retryJob } = useParseJobs();
  const [modalVisible, setModalVisible] = useState(false);

  const handleParse = async (text: string) => {
    await submitParse(text);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Today</Text>
        <DailySummaryCard summary={todaySummary} />
        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={() => setModalVisible(true)}>
            <Text style={styles.primaryActionText}>Log with natural language</Text>
          </Pressable>
          <Link href="/barcode" asChild>
            <Pressable style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Scan barcode</Text>
            </Pressable>
          </Link>
        </View>
        <InProgressParseList jobs={displayJobs} onDismiss={dismissJob} onRetry={retryJob} />
        <Text style={styles.sectionTitle}>Food</Text>
        <FoodEntryList entries={todayEntries} onDelete={removeEntry} onEdit={editEntry} />
      </ScrollView>
      <AddFoodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleParse}
      />
    </>
  );
}

export default function TodayScreen() {
  const { today, addEntries } = useFood();

  return (
    <ParseJobsProvider today={today} onParsed={addEntries}>
      <TodayScreenContent />
    </ParseJobsProvider>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
});
