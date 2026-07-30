import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { clearApiKey, getStoredApiKey, saveApiKey } from '@/services/cursorParser';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await getStoredApiKey();
      if (existing) {
        setApiKey(existing);
        setSaved(true);
      }
    })();
  }, []);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert('API key required', 'Paste your Cursor API key from cursor.com/dashboard/api');
      return;
    }
    await saveApiKey(trimmed);
    setSaved(true);
    Alert.alert('Saved', 'Your Cursor API key is stored securely on this device.');
  };

  const handleClear = async () => {
    await clearApiKey();
    setApiKey('');
    setSaved(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cursor API key</Text>
        <Text style={styles.cardBody}>
          Natural-language food parsing uses the Cursor Cloud Agents API. Get a key from{' '}
          cursor.com/dashboard/api and paste it below. It stays on your phone in secure storage.
        </Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={(value) => {
            setApiKey(value);
            setSaved(false);
          }}
          placeholder="crsr_..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryText}>{saved ? 'Update key' : 'Save key'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleClear}>
            <Text style={styles.secondaryText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Barcode scanning</Text>
        <Text style={styles.cardBody}>
          Barcodes use the free Open Food Facts database. No API key is required.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local storage</Text>
        <Text style={styles.cardBody}>
          All food logs are stored locally on your device with SQLite. Nothing is synced to the
          cloud unless you back up your phone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardBody: {
    color: '#6B7280',
    lineHeight: 21,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
});
