import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
import { Text } from '@/components/Themed';
import type { FoodEntry } from '@/types/food';
import { groupFoodEntries, sumGroupNutrition } from '@/utils/foodGroups';
import { formatCaloriesEstimate, formatMacroEstimate, formatMacroLine } from '@/utils/nutrition';

interface FoodEntryListProps {
  entries: FoodEntry[];
  onDelete?: (id: number) => void;
  onEdit?: (
    id: number,
    input: {
      mealType: FoodEntry['mealType'];
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      caloriesMin: number;
      caloriesMax: number;
      proteinMin: number;
      proteinMax: number;
      carbsMin: number;
      carbsMax: number;
      fatMin: number;
      fatMax: number;
    },
  ) => Promise<void>;
}

function formatLoggedTime(createdAt: string) {
  try {
    return format(parseISO(createdAt), 'h:mm a');
  } catch {
    return createdAt;
  }
}

function formatEntryMacroLine(entry: FoodEntry) {
  return `P ${formatMacroEstimate(entry.protein)} · C ${formatMacroEstimate(entry.carbs)} · F ${formatMacroEstimate(entry.fat)}`;
}

function showEntryMenu(
  entry: FoodEntry,
  onEdit: (() => void) | undefined,
  onDelete?: (id: number) => void,
) {
  const actions = [
    ...(onEdit ? [{ text: 'Edit', onPress: onEdit }] : []),
    {
      text: 'Delete',
      style: 'destructive' as const,
      onPress: () => {
        if (!onDelete) return;
        Alert.alert('Delete entry?', entry.name, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
        ]);
      },
    },
    { text: 'Cancel', style: 'cancel' as const },
  ];

  Alert.alert(entry.name, undefined, actions);
}

function EntryMenuButton({
  entry,
  canEdit,
  onEditSelect,
  onDelete,
}: {
  entry: FoodEntry;
  canEdit: boolean;
  onEditSelect: () => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <Pressable
      hitSlop={8}
      style={styles.menuButton}
      onPress={() => showEntryMenu(entry, canEdit ? onEditSelect : undefined, onDelete)}>
      <Ionicons name="ellipsis-vertical" size={18} color="#6B7280" />
    </Pressable>
  );
}

export function FoodEntryList({ entries, onDelete, onEdit }: FoodEntryListProps) {
  const groups = useMemo(() => groupFoodEntries(entries), [entries]);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No food logged yet</Text>
        <Text style={styles.emptyBody}>Describe what you ate or scan a barcode to get started.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.list}>
        {groups.map((group) => {
          const totals = sumGroupNutrition(group.entries);
          const loggedAt = formatLoggedTime(group.createdAt);

          if (group.isMulti) {
            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTime}>{loggedAt}</Text>
                  <Text style={styles.groupCalories}>{formatCaloriesEstimate(totals.calories)}</Text>
                </View>
                <View style={styles.groupItems}>
                  {group.entries.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.groupItem,
                        index < group.entries.length - 1 && styles.groupItemBorder,
                      ]}>
                      <View style={styles.groupItemContent}>
                        <Text style={styles.itemName}>{entry.name}</Text>
                        <Text style={styles.groupItemMeta}>
                          {formatCaloriesEstimate(entry.calories)} · {formatEntryMacroLine(entry)}
                        </Text>
                      </View>
                      <EntryMenuButton
                        entry={entry}
                        canEdit={!!onEdit}
                        onEditSelect={() => setEditingEntry(entry)}
                        onDelete={onDelete}
                      />
                    </View>
                  ))}
                </View>
                <Text style={styles.groupFooter}>Total · {formatMacroLine(totals)}</Text>
              </View>
            );
          }

          const entry = group.entries[0];

          return (
            <View key={group.id} style={styles.item}>
              <View style={styles.itemTopRow}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{entry.name}</Text>
                  <Text style={styles.itemCaloriesInline}>
                    {formatCaloriesEstimate(entry.calories)}
                  </Text>
                </View>
                <EntryMenuButton
                  entry={entry}
                  canEdit={!!onEdit}
                  onEditSelect={() => setEditingEntry(entry)}
                  onDelete={onDelete}
                />
              </View>
              <Text style={styles.itemMeta}>
                {loggedAt}
                {entry.mealType !== 'unknown' ? ` · ${entry.mealType}` : ''} · {formatEntryMacroLine(entry)}
              </Text>
              <Text style={styles.itemSource}>
                {entry.source === 'barcode' ? `Barcode ${entry.barcode}` : 'Natural language'}
              </Text>
            </View>
          );
        })}
      </View>

      {onEdit ? (
        <EditFoodEntryModal
          visible={editingEntry != null}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={async (input) => {
            if (!editingEntry) return;
            await onEdit(editingEntry.id, input);
            setEditingEntry(null);
          }}
        />
      ) : null}
    </>
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
    gap: 6,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemCaloriesInline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  itemMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  itemSource: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  groupTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  groupCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  groupItems: {
    paddingHorizontal: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  groupItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupItemContent: {
    flex: 1,
    gap: 4,
  },
  groupItemMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  groupFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    color: '#9CA3AF',
    fontSize: 12,
  },
  menuButton: {
    padding: 4,
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
