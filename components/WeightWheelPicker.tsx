import { Picker } from '@react-native-picker/picker';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export interface WeightWheelValue {
  hundreds: number;
  tens: number;
  ones: number;
  decimal: number;
}

export function weightDigitsToLbs({ hundreds, tens, ones, decimal }: WeightWheelValue) {
  return hundreds * 100 + tens * 10 + ones + decimal / 10;
}

export function lbsToWeightDigits(lbs: number): WeightWheelValue {
  const clamped = Math.min(999.9, Math.max(0, lbs));
  const rounded = Math.round(clamped * 10) / 10;
  return {
    hundreds: Math.floor(rounded / 100) % 10,
    tens: Math.floor(rounded / 10) % 10,
    ones: Math.floor(rounded) % 10,
    decimal: Math.round(rounded * 10) % 10,
  };
}

export function formatWeightDigits({ hundreds, tens, ones, decimal }: WeightWheelValue) {
  return `${hundreds}${tens}${ones}.${decimal}`;
}

interface WeightWheelPickerProps {
  value: WeightWheelValue;
  onChange: (value: WeightWheelValue) => void;
}

interface DigitPickerProps {
  selectedValue: number;
  onValueChange: (value: number) => void;
}

function DigitPicker({ selectedValue, onValueChange }: DigitPickerProps) {
  return (
    <Picker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      style={styles.picker}
      itemStyle={styles.pickerItem}>
      {DIGITS.map((digit) => (
        <Picker.Item key={digit} label={String(digit)} value={digit} />
      ))}
    </Picker>
  );
}

export function WeightWheelPicker({ value, onChange }: WeightWheelPickerProps) {
  const lbs = useMemo(() => weightDigitsToLbs(value), [value]);

  const updateDigit = (key: keyof WeightWheelValue, digit: number) => {
    onChange({ ...value, [key]: digit });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.preview}>
        {formatWeightDigits(value)} <Text style={styles.previewUnit}>lb</Text>
      </Text>

      <View style={styles.wheelRow}>
        <DigitPicker
          selectedValue={value.hundreds}
          onValueChange={(digit) => updateDigit('hundreds', digit)}
        />
        <DigitPicker
          selectedValue={value.tens}
          onValueChange={(digit) => updateDigit('tens', digit)}
        />
        <DigitPicker
          selectedValue={value.ones}
          onValueChange={(digit) => updateDigit('ones', digit)}
        />
        <Text style={styles.separator}>.</Text>
        <DigitPicker
          selectedValue={value.decimal}
          onValueChange={(digit) => updateDigit('decimal', digit)}
        />
      </View>

      <Text style={styles.hint}>
        {lbs > 0 ? 'Spin each wheel to set your weight' : 'Set a weight above 0 lb'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  preview: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  previewUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    width: Platform.OS === 'ios' ? 64 : 72,
    height: Platform.OS === 'ios' ? 180 : 48,
  },
  pickerItem: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#374151',
    marginHorizontal: -4,
    marginBottom: Platform.OS === 'ios' ? 0 : 0,
  },
  hint: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
});
