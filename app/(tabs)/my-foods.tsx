import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SavedFoodModal } from '@/components/SavedFoodModal';
import { Text } from '@/components/Themed';
import { useSavedFoods } from '@/context/SavedFoodsContext';
import type { SavedFood } from '@/types/food';
import { formatFullNutrition } from '@/utils/nutrition';

function formatNutrition(food: SavedFood) {
  if (food.calories == null) return null;
  return formatFullNutrition({
    calories: food.calories,
    protein: food.protein ?? 0,
    carbs: food.carbs ?? 0,
    fat: food.fat ?? 0,
  });
}

export default function MyFoodsScreen() {
  const { foods, addFood, editFood, removeFood } = useSavedFoods();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<SavedFood | null>(null);

  const openCreate = () => {
    setEditingFood(null);
    setModalVisible(true);
  };

  const openEdit = (food: SavedFood) => {
    setEditingFood(food);
    setModalVisible(true);
  };

  const handleDelete = (food: SavedFood) => {
    Alert.alert('Delete saved food?', food.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeFood(food.id),
      },
    ]);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>My Foods</Text>
        <Text style={styles.intro}>
          Save foods you eat often. When you log by voice or text, say the name — Cursor will use
          your description instead of guessing every time.
        </Text>

        <Pressable style={styles.addButton} onPress={openCreate}>
          <Text style={styles.addButtonText}>+ Add food</Text>
        </Pressable>

        {foods.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved foods yet</Text>
            <Text style={styles.emptyBody}>
              Example: name &quot;usual shake&quot;, description &quot;1 scoop whey, banana, almond
              milk&quot;
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {foods.map((food) => {
              const nutrition = formatNutrition(food);
              return (
                <Pressable
                  key={food.id}
                  style={styles.card}
                  onPress={() => openEdit(food)}
                  onLongPress={() => handleDelete(food)}>
                  <Text style={styles.cardName}>{food.name}</Text>
                  <Text style={styles.cardDescription}>{food.description}</Text>
                  {nutrition ? <Text style={styles.cardNutrition}>{nutrition}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.hint}>Tap to edit · long-press to delete</Text>
      </ScrollView>

      <SavedFoodModal
        visible={modalVisible}
        food={editingFood}
        onClose={() => setModalVisible(false)}
        onSave={async (input) => {
          if (editingFood) {
            await editFood(editingFood.id, input);
          } else {
            await addFood(input);
          }
        }}
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
    gap: 14,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  intro: {
    color: '#6B7280',
    lineHeight: 21,
  },
  addButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    color: '#4B5563',
    lineHeight: 20,
  },
  cardNutrition: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyBody: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});
