import { useEffect, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);
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

interface WheelColumnProps {
  value: number;
  onChange: (value: number) => void;
}

function WheelColumn({ value, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (draggingRef.current) {
      return;
    }
    scrollRef.current?.scrollTo({ y: value * ITEM_HEIGHT, animated: false });
  }, [value]);

  const snapScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(DIGITS.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    if (DIGITS[index] !== value) {
      onChange(DIGITS[index]);
    }
  };

  return (
    <View style={styles.column}>
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: value * ITEM_HEIGHT }}
        onScrollBeginDrag={() => {
          draggingRef.current = true;
        }}
        onMomentumScrollEnd={(event) => {
          draggingRef.current = false;
          snapScroll(event);
        }}
        onScrollEndDrag={(event) => {
          const velocityY = event.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(velocityY) < 0.05) {
            draggingRef.current = false;
            snapScroll(event);
          }
        }}
        contentContainerStyle={styles.columnContent}>
        {DIGITS.map((digit) => (
          <View key={digit} style={styles.item}>
            <Text style={styles.itemText}>{digit}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
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

      <View style={styles.wheelFrame}>
        <View pointerEvents="none" style={styles.selectionBand} />
        <View style={styles.wheelRow}>
          <WheelColumn
            value={value.hundreds}
            onChange={(digit) => updateDigit('hundreds', digit)}
          />
          <WheelColumn value={value.tens} onChange={(digit) => updateDigit('tens', digit)} />
          <WheelColumn value={value.ones} onChange={(digit) => updateDigit('ones', digit)} />
          <View style={styles.separatorWrap}>
            <Text style={styles.separator}>.</Text>
          </View>
          <WheelColumn
            value={value.decimal}
            onChange={(digit) => updateDigit('decimal', digit)}
          />
        </View>
      </View>

      <Text style={styles.hint}>
        {lbs > 0 ? 'Scroll each column to set your weight' : 'Set a weight above 0 lb'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
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
  wheelFrame: {
    height: WHEEL_HEIGHT,
    justifyContent: 'center',
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
  },
  selectionBand: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: PAD_ROWS * ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  column: {
    width: 44,
    height: WHEEL_HEIGHT,
    overflow: 'hidden',
  },
  columnContent: {
    paddingVertical: PAD_ROWS * ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    width: 44,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
    lineHeight: ITEM_HEIGHT,
  },
  separatorWrap: {
    width: 16,
    height: WHEEL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    lineHeight: ITEM_HEIGHT,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
  },
});
