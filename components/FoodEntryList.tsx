import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { FoodEntry } from '@/types/food';

interface FoodEntryListProps {
  entries: FoodEntry[];
  onDelete?: (id: number) => void;
}

export function FoodEntryList({ entries, onDelete }: FoodEntryListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No food logged yet</Text>
        <Text style={styles.emptyBody}>Describe a meal or scan a barcode to get started.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <Pressable
          key={entry.id}
          style={styles.item}
          onLongPress={() => {
            if (!onDelete) return;
            Alert.alert('Delete entry?', entry.name, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
            ]);
          }}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{entry.name}</Text>
            <Text style={styles.itemCalories}>{Math.round(entry.calories)} kcal</Text>
          </View>
          <Text style={styles.itemMeta}>
            {entry.mealType !== 'unknown' ? `${entry.mealType} · ` : ''}
            P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
          </Text>
          <Text style={styles.itemSource}>
            {entry.source === 'barcode' ? `Barcode ${entry.barcode}` : 'Natural language'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  itemMeta: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4,
  },
  itemSource: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  empty: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111827',
  },
  emptyBody: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
});
