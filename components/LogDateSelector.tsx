import { format, parseISO, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Text } from '@/components/Themed';

interface LogDateSelectorProps {
  logDate: string;
  today: string;
  onChange: (date: string) => void;
}

function toDateString(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function formatLogDateLabel(logDate: string, today: string) {
  if (logDate === today) return 'Today';
  if (logDate === toDateString(subDays(parseISO(today), 1))) return 'Yesterday';

  try {
    return format(parseISO(logDate), 'EEEE, MMM d');
  } catch {
    return logDate;
  }
}

export function LogDateSelector({ logDate, today, onChange }: LogDateSelectorProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => parseISO(logDate));

  const label = useMemo(() => formatLogDateLabel(logDate, today), [logDate, today]);
  const loggingToday = logDate === today;

  const openPicker = () => {
    setPickerDate(parseISO(logDate));
    setPickerVisible(true);
  };

  const applyDate = (date: Date) => {
    onChange(toDateString(date));
    setPickerVisible(false);
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
      if (event.type === 'set' && date) {
        applyDate(date);
      }
      return;
    }

    if (date) {
      setPickerDate(date);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.copy}>
          <Text style={styles.label}>Logging for</Text>
          <Text style={styles.value}>{label}</Text>
          {!loggingToday ? (
            <Text style={styles.hint}>New entries will be saved to this day.</Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.quickButton} onPress={() => onChange(today)}>
            <Text style={styles.quickButtonText}>Today</Text>
          </Pressable>
          <Pressable
            style={styles.quickButton}
            onPress={() => onChange(toDateString(subDays(parseISO(today), 1)))}>
            <Text style={styles.quickButtonText}>Yesterday</Text>
          </Pressable>
          <Pressable style={styles.changeButton} onPress={openPicker}>
            <Text style={styles.changeButtonText}>Change</Text>
          </Pressable>
        </View>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
          <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>Pick a date</Text>
              <Pressable onPress={() => applyDate(pickerDate)}>
                <Text style={styles.sheetDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              maximumDate={parseISO(today)}
              onChange={handlePickerChange}
            />
          </View>
        </Modal>
      ) : pickerVisible ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          maximumDate={parseISO(today)}
          onChange={handlePickerChange}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  copy: {
    gap: 4,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: '#047857',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  quickButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  changeButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeButtonText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sheetCancel: {
    color: '#6B7280',
    fontWeight: '600',
  },
  sheetDone: {
    color: '#059669',
    fontWeight: '700',
  },
});
