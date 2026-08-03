import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { SettingsLinkCard } from '@/components/SettingsLinkCard';
import {
  lbsToWeightDigits,
  WeightWheelPicker,
  weightDigitsToLbs,
} from '@/components/WeightWheelPicker';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { WeightTrendChart } from '@/components/WeightTrendChart';
import { useProfile } from '@/context/ProfileContext';
import { useTabBar } from '@/context/TabBarContext';
import type { WeightEntry } from '@/types/profile';
import {
  cmToFeetInches,
  feetInchesToCm,
  formatHeightCm,
  formatWeightKg,
  kgToLbs,
  lbsToKg,
} from '@/utils/bodyMetrics';

function formatWeightDelta(currentKg: number, previousKg: number | null) {
  if (previousKg == null) return null;
  const deltaLbs = Math.round(kgToLbs(currentKg) - kgToLbs(previousKg));
  if (deltaLbs === 0) return 'No change since last weigh-in';
  const sign = deltaLbs > 0 ? '+' : '';
  return `${sign}${deltaLbs} lb since last weigh-in`;
}

function buildHistoryWithDeltas(entries: WeightEntry[]) {
  const newestFirst = [...entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return newestFirst.map((entry, index) => ({
    entry,
    deltaLabel: formatWeightDelta(entry.weightKg, newestFirst[index + 1]?.weightKg ?? null),
  }));
}

export default function ProfileScreen() {
  const { profile, latestWeight, weightHistory, setHeightCm, logWeightKg, removeWeightEntry } =
    useProfile();
  const { onScroll } = useTabBar();

  const initialHeight = useMemo(() => {
    if (profile.heightCm == null) return { feet: '5', inches: '10' };
    const { adjustedFeet, inches } = cmToFeetInches(profile.heightCm);
    return { feet: String(adjustedFeet), inches: String(inches) };
  }, [profile.heightCm]);

  const [feet, setFeet] = useState(initialHeight.feet);
  const [inches, setInches] = useState(initialHeight.inches);
  const [weightDigits, setWeightDigits] = useState(() =>
    lbsToWeightDigits(latestWeight ? kgToLbs(latestWeight.weightKg) : 180),
  );

  const historyWithDeltas = useMemo(() => buildHistoryWithDeltas(weightHistory), [weightHistory]);

  useEffect(() => {
    if (profile.heightCm != null) {
      const { adjustedFeet, inches: inchValue } = cmToFeetInches(profile.heightCm);
      setFeet(String(adjustedFeet));
      setInches(String(inchValue));
    }
  }, [profile.heightCm]);

  useEffect(() => {
    if (latestWeight) {
      setWeightDigits(lbsToWeightDigits(kgToLbs(latestWeight.weightKg)));
    }
  }, [latestWeight?.id]);

  const handleSaveHeight = async () => {
    const feetNum = Number(feet);
    const inchesNum = Number(inches);
    if (!Number.isFinite(feetNum) || !Number.isFinite(inchesNum) || feetNum < 0 || inchesNum < 0) {
      Alert.alert('Invalid height', 'Enter a valid height in feet and inches.');
      return;
    }

    await setHeightCm(feetInchesToCm(feetNum, inchesNum));
    Alert.alert('Saved', 'Your height is saved in your profile.');
  };

  const handleLogWeight = async () => {
    const lbs = weightDigitsToLbs(weightDigits);
    if (!Number.isFinite(lbs) || lbs <= 0) {
      Alert.alert('Invalid weight', 'Set a weight above 0 lb.');
      return;
    }

    await logWeightKg(lbsToKg(lbs));
    Alert.alert('Logged', 'Weight saved.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      onScroll={onScroll}
      scrollEventThrottle={16}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Profile</Text>
        <Link href="/settings" asChild>
          <Pressable hitSlop={12} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#374151" />
          </Pressable>
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Height</Text>
        <Text style={styles.cardBody}>
          Set once here. Activity calorie estimates use this with your latest weight.
        </Text>
        {profile.heightCm != null ? (
          <Text style={styles.currentValue}>Current: {formatHeightCm(profile.heightCm)}</Text>
        ) : null}
        <View style={styles.heightRow}>
          <View style={styles.heightField}>
            <Text style={styles.fieldLabel}>Feet</Text>
            <TextInput
              style={styles.input}
              value={feet}
              onChangeText={setFeet}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.heightField}>
            <Text style={styles.fieldLabel}>Inches</Text>
            <TextInput
              style={styles.input}
              value={inches}
              onChangeText={setInches}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        <Pressable style={styles.primaryButton} onPress={handleSaveHeight}>
          <Text style={styles.primaryText}>Save height</Text>
        </Pressable>
      </View>

      <View style={styles.weightSection}>
        <View style={styles.weightSectionHeader}>
          <View style={styles.weightSectionTitleWrap}>
            <Text style={styles.cardTitle}>Weight</Text>
            <Text style={styles.weightSectionSubtitle}>
              Saved to history and used for activity estimates
            </Text>
          </View>
          {latestWeight ? (
            <View style={styles.latestBadge}>
              <Text style={styles.latestBadgeLabel}>Latest</Text>
              <Text style={styles.latestBadgeValue}>{formatWeightKg(latestWeight.weightKg)}</Text>
              <Text style={styles.latestBadgeDate}>
                {format(parseISO(latestWeight.recordedAt), 'MMM d')}
              </Text>
            </View>
          ) : (
            <View style={styles.latestBadgeEmpty}>
              <Text style={styles.latestBadgeEmptyText}>Not logged</Text>
            </View>
          )}
        </View>

        <WeightWheelPicker value={weightDigits} onChange={setWeightDigits} />

        <Pressable style={styles.logWeightButton} onPress={handleLogWeight}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.primaryText}>Log weight</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.historyHeader}>
          <Text style={styles.cardTitle}>Weight history</Text>
          {weightHistory.length > 0 ? (
            <Text style={styles.historyCount}>{weightHistory.length} entries</Text>
          ) : null}
        </View>
        <WeightTrendChart entries={weightHistory} />

        {historyWithDeltas.length > 0 ? (
          <View style={styles.historyList}>
            {historyWithDeltas.map(({ entry, deltaLabel }) => (
              <Pressable
                key={entry.id}
                style={styles.historyItem}
                onLongPress={() =>
                  Alert.alert('Delete weigh-in?', formatWeightKg(entry.weightKg), [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => removeWeightEntry(entry.id),
                    },
                  ])
                }>
                <View style={styles.historyRow}>
                  <Text style={styles.historyWeight}>{formatWeightKg(entry.weightKg)}</Text>
                  {deltaLabel ? (
                    <Text
                      style={[
                        styles.historyDelta,
                        deltaLabel.startsWith('+')
                          ? styles.historyDeltaUp
                          : deltaLabel.startsWith('-')
                            ? styles.historyDeltaDown
                            : null,
                      ]}>
                      {deltaLabel}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.historyDate}>
                  {format(parseISO(entry.recordedAt), 'MMM d, yyyy · h:mm a')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <SettingsLinkCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, gap: 16, paddingBottom: TAB_BAR_CLEARANCE },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cardBody: { color: '#6B7280', lineHeight: 21 },
  currentValue: { color: '#047857', fontWeight: '600' },
  missingValue: { color: '#9CA3AF' },
  heightRow: { flexDirection: 'row', gap: 12 },
  heightField: { flex: 1, gap: 6 },
  fieldLabel: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  weightSection: {
    gap: 14,
  },
  weightSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  weightSectionTitleWrap: {
    flex: 1,
    gap: 4,
  },
  weightSectionSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  latestBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 1,
    minWidth: 88,
  },
  latestBadgeLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  latestBadgeValue: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '800',
  },
  latestBadgeDate: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  latestBadgeEmpty: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  latestBadgeEmptyText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  logWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  historyCount: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  historyList: { gap: 4, marginTop: 4 },
  historyItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  historyWeight: { fontSize: 16, fontWeight: '600', color: '#111827' },
  historyDelta: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  historyDeltaUp: { color: '#B45309' },
  historyDeltaDown: { color: '#047857' },
  historyDate: { color: '#6B7280', fontSize: 13 },
});
