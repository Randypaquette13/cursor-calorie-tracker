import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

interface CopyableTextProps {
  value: string;
}

export function CopyableText({ value }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable style={styles.row} onPress={handleCopy} accessibilityRole="button">
      <Text style={styles.mono} selectable>
        {value}
      </Text>
      <View style={styles.copyAction}>
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={16}
          color={copied ? '#059669' : '#6B7280'}
        />
        <Text style={[styles.copyLabel, copied && styles.copiedLabel]}>
          {copied ? 'Copied' : 'Copy'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  mono: {
    flex: 1,
    color: '#374151',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    lineHeight: 18,
  },
  copyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 1,
  },
  copyLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  copiedLabel: {
    color: '#059669',
  },
});
