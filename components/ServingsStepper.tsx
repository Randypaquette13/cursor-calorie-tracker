import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { effectiveServings } from '@/utils/nutrition';

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

const MIN_SERVINGS = 0.5;
const STEP = 0.5;

function clampServings(value: number) {
  if (!Number.isFinite(value) || value < MIN_SERVINGS) {
    return MIN_SERVINGS;
  }
  return Math.round(value * 2) / 2;
}

function formatServingsValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ServingsStepper({
  value,
  onChange,
  disabled = false,
  label = 'Servings',
}: ServingsStepperProps) {
  const servings = effectiveServings(value);

  const adjust = (delta: number) => {
    onChange(clampServings(servings + delta));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={() => adjust(-STEP)}
          disabled={disabled || servings <= MIN_SERVINGS}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={formatServingsValue(servings)}
          onChangeText={(text) => {
            const parsed = Number(text.trim());
            if (Number.isFinite(parsed)) {
              onChange(clampServings(parsed));
            }
          }}
          editable={!disabled}
        />
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={() => adjust(STEP)}
          disabled={disabled}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
