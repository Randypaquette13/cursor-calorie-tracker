import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
import {
  formatMacroRangeLine,
  NutritionEstimateWithRange,
} from '@/components/NutritionEstimateWithRange';
import { Text } from '@/components/Themed';
import type { FoodEntry } from '@/types/food';
import { groupFoodEntries, sumGroupNutrition } from '@/utils/foodGroups';
import {
  formatCaloriesEstimate,
  formatCaloriesRange,
  formatMacroEstimate,
  formatMacroLine,
} from '@/utils/nutrition';

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

function EntryNutritionDetails({ entry }: { entry: FoodEntry }) {
  const macroRanges = formatMacroRangeLine(entry);

  return (
    <View style={styles.entryNutrition}>
      <NutritionEstimateWithRange
        kind="calories"
        value={entry.calories}
        min={entry.caloriesMin}
        max={entry.caloriesMax}
        valueStyle={styles.itemCaloriesInline}
        rangeStyle={styles.itemRange}
        align="right"
      />
      <Text style={styles.itemMetaCompact}>
        {formatEntryMacroLine(entry)}
      </Text>
      {macroRanges ? <Text style={styles.itemRangeLine}>{macroRanges}</Text> : null}
    </View>
  );
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
          const totalMacroRanges = formatMacroRangeLine(totals);
          const totalCalorieRange = formatCaloriesRange(totals.caloriesMin, totals.caloriesMax);

          if (group.isMulti) {
            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTime}>{loggedAt}</Text>
                  <View style={styles.groupHeaderCalories}>
                    <Text style={styles.groupCalories}>{formatCaloriesEstimate(totals.calories)}</Text>
                    {totalCalorieRange ? (
                      <Text style={styles.itemRangeLine}>{totalCalorieRange}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.groupItems}>
                  {group.entries.map((entry, index) => {
                    const macroRanges = formatMacroRangeLine(entry);
                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.groupItem,
                          index < group.entries.length - 1 && styles.groupItemBorder,
                        ]}>
                        <View style={styles.groupItemContent}>
                          <Text style={styles.itemName}>{entry.name}</Text>
                          <View style={styles.groupItemNutrition}>
                            <NutritionEstimateWithRange
                              kind="calories"
                              value={entry.calories}
                              min={entry.caloriesMin}
                              max={entry.caloriesMax}
                              valueStyle={styles.groupItemCalories}
                              rangeStyle={styles.itemRangeLine}
                            />
                            <Text style={styles.groupItemMeta}>{formatEntryMacroLine(entry)}</Text>
                            {macroRanges ? (
                              <Text style={styles.itemRangeLine}>{macroRanges}</Text>
                            ) : null}
                          </View>
                        </View>
                        <EntryMenuButton
                          entry={entry}
                          canEdit={!!onEdit}
                          onEditSelect={() => setEditingEntry(entry)}
                          onDelete={onDelete}
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={styles.groupFooterBlock}>
                  <Text style={styles.groupFooter}>Total · {formatMacroLine(totals)}</Text>
                  {totalMacroRanges ? (
                    <Text style={styles.itemRangeLine}>{totalMacroRanges}</Text>
                  ) : null}
                </View>
              </View>
            );
          }

          const entry = group.entries[0];

          return (
            <View key={group.id} style={styles.item}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemName}>{entry.name}</Text>
                <EntryMenuButton
                  entry={entry}
                  canEdit={!!onEdit}
                  onEditSelect={() => setEditingEntry(entry)}
                  onDelete={onDelete}
                />
              </View>
              <EntryNutritionDetails entry={entry} />
              <Text style={styles.itemMeta}>
                {loggedAt}
                {entry.mealType !== 'unknown' ? ` · ${entry.mealType}` : ''}
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
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  entryNutrition: {
    gap: 2,
  },
  itemCaloriesInline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  itemMetaCompact: {
    color: '#6B7280',
    fontSize: 13,
  },
  itemRange: {
    color: '#9CA3AF',
  },
  itemRangeLine: {
    color: '#9CA3AF',
    fontSize: 12,
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  groupHeaderCalories: {
    alignItems: 'flex-end',
    gap: 2,
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
    alignItems: 'flex-start',
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
  groupItemNutrition: {
    gap: 2,
  },
  groupItemCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  groupItemMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  groupFooterBlock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 2,
  },
  groupFooter: {
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
