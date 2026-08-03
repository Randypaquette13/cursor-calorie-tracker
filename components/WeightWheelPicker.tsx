import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ITEM_HEIGHT = 44;
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
            <Text style={[styles.itemText, digit === value && styles.itemTextSelected]}>{digit}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function WheelFadeMasks() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.88)', 'rgba(255, 255, 255, 0)']}
        style={styles.fadeTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.88)', '#FFFFFF']}
        style={styles.fadeBottom}
      />
    </>
  );
}

export function WeightWheelPicker({ value, onChange }: WeightWheelPickerProps) {
  const lbs = useMemo(() => weightDigitsToLbs(value), [value]);
  const formatted = formatWeightDigits(value);
  const [whole, fraction = '0'] = formatted.split('.');

  const updateDigit = (key: keyof WeightWheelValue, digit: number) => {
    onChange({ ...value, [key]: digit });
  };

  return (
    <View style={styles.container}>
      <View style={styles.displayRow}>
        <View style={styles.displayIcon}>
          <Ionicons name="scale-outline" size={18} color="#059669" />
        </View>
        <View style={styles.displayCopy}>
          <Text style={styles.displayLabel}>Selected weight</Text>
          <View style={styles.displayValueRow}>
            <Text style={styles.displayWhole}>{whole}</Text>
            <Text style={styles.displayFraction}>.{fraction}</Text>
            <Text style={styles.displayUnit}>lb</Text>
          </View>
        </View>
      </View>

      <View style={styles.wheelPanel}>
        <WheelFadeMasks />
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
        {lbs > 0 ? 'Spin each column to adjust' : 'Set a weight above 0 lb to log'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  displayIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayCopy: {
    flex: 1,
    gap: 2,
  },
  displayLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  displayValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  displayWhole: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    fontVariant: ['tabular-nums'],
    lineHeight: 38,
  },
  displayFraction: {
    fontSize: 22,
    fontWeight: '700',
    color: '#374151',
    fontVariant: ['tabular-nums'],
    lineHeight: 32,
    marginBottom: 2,
  },
  displayUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 6,
    marginBottom: 4,
  },
  wheelPanel: {
    height: WHEEL_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
    paddingHorizontal: 8,
  },
  selectionBand: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: PAD_ROWS * ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.22)',
  },
  fadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: PAD_ROWS * ITEM_HEIGHT + 8,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PAD_ROWS * ITEM_HEIGHT + 8,
    zIndex: 2,
  },
  column: {
    width: 46,
    height: WHEEL_HEIGHT,
    overflow: 'hidden',
    zIndex: 1,
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
    width: 46,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
    lineHeight: ITEM_HEIGHT,
  },
  itemTextSelected: {
    fontSize: 24,
    fontWeight: '800',
    color: '#047857',
  },
  separatorWrap: {
    width: 14,
    height: WHEEL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  separator: {
    fontSize: 26,
    fontWeight: '800',
    color: '#059669',
    lineHeight: ITEM_HEIGHT,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
});
