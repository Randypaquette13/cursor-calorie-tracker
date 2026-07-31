import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { AddFoodModal } from '@/components/AddFoodModal';
import { DailySummaryCard } from '@/components/DailySummaryCard';
import { FoodEntryList } from '@/components/FoodEntryList';
import { Text } from '@/components/Themed';
import { useFood } from '@/context/FoodContext';
import { useSavedFoods } from '@/context/SavedFoodsContext';
import { parseNaturalLanguage } from '@/services/cursorParser';
import { inferMealType } from '@/utils/meal';
import type { MealType } from '@/types/food';

export default function TodayScreen() {
  const { todaySummary, todayEntries, addEntry, removeEntry } = useFood();
  const { foods: savedFoods } = useSavedFoods();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleParse = async (text: string) => {
    setLoading(true);
    try {
      const parsed = await parseNaturalLanguage(text, savedFoods);
      for (const item of parsed.items) {
        const mealType = (item.mealType ?? inferMealType(text)) as MealType;
        await addEntry({
          mealType,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          source: 'natural_language',
          rawInput: text,
        });
      }
    } catch (error) {
      Alert.alert(
        'Could not parse food',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.sectionTitle}>Meals</Text>
        <FoodEntryList entries={todayEntries} onDelete={removeEntry} />
        <Text style={styles.hint}>Long-press an entry to delete it.</Text>
      </ScrollView>
      <AddFoodModal
        visible={modalVisible}
        loading={loading}
        onClose={() => !loading && setModalVisible(false)}
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
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});
