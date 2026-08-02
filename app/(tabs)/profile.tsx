import { format, parseISO } from 'date-fns';
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
import { useProfile } from '@/context/ProfileContext';
import {
  cmToFeetInches,
  feetInchesToCm,
  formatHeightCm,
  formatWeightKg,
  kgToLbs,
  lbsToKg,
} from '@/utils/bodyMetrics';

export default function ProfileScreen() {
  const { profile, latestWeight, weightHistory, setHeightCm, logWeightKg, removeWeightEntry } =
    useProfile();

  const initialHeight = useMemo(() => {
    if (profile.heightCm == null) return { feet: '5', inches: '10' };
    const { adjustedFeet, inches } = cmToFeetInches(profile.heightCm);
    return { feet: String(adjustedFeet), inches: String(inches) };
  }, [profile.heightCm]);

  const [feet, setFeet] = useState(initialHeight.feet);
  const [inches, setInches] = useState(initialHeight.inches);
  const [weightLbs, setWeightLbs] = useState('');

  useEffect(() => {
    if (profile.heightCm != null) {
      const { adjustedFeet, inches: inchValue } = cmToFeetInches(profile.heightCm);
      setFeet(String(adjustedFeet));
      setInches(String(inchValue));
    }
  }, [profile.heightCm]);

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
    const lbs = Number(weightLbs);
    if (!Number.isFinite(lbs) || lbs <= 0) {
      Alert.alert('Invalid weight', 'Enter your weight in pounds.');
      return;
    }

    await logWeightKg(lbsToKg(lbs));
    setWeightLbs('');
    Alert.alert('Logged', 'Weight saved.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>

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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight</Text>
        <Text style={styles.cardBody}>
          Log whenever you weigh yourself. The most recent entry is used for activity estimates.
        </Text>
        {latestWeight ? (
          <Text style={styles.currentValue}>
            Latest: {formatWeightKg(latestWeight.weightKg)} ·{' '}
            {format(parseISO(latestWeight.recordedAt), 'MMM d, h:mm a')}
          </Text>
        ) : (
          <Text style={styles.missingValue}>No weight logged yet</Text>
        )}
        <TextInput
          style={styles.input}
          value={weightLbs}
          onChangeText={setWeightLbs}
          keyboardType="decimal-pad"
          placeholder="Weight in lb"
          placeholderTextColor="#9CA3AF"
        />
        <Pressable style={styles.primaryButton} onPress={handleLogWeight}>
          <Text style={styles.primaryText}>Log weight</Text>
        </Pressable>

        {weightHistory.length > 0 ? (
          <View style={styles.historyList}>
            <Text style={styles.historyTitle}>Recent weigh-ins</Text>
            {weightHistory.map((entry) => (
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
                <Text style={styles.historyWeight}>{formatWeightKg(entry.weightKg)}</Text>
                <Text style={styles.historyDate}>
                  {format(parseISO(entry.recordedAt), 'MMM d, yyyy · h:mm a')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
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
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  historyList: { gap: 8, marginTop: 4 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  historyItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 2,
  },
  historyWeight: { fontSize: 16, fontWeight: '600', color: '#111827' },
  historyDate: { color: '#6B7280', fontSize: 13 },
});
