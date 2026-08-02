import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';

import { CopyableText } from '@/components/CopyableText';
import { Text } from '@/components/Themed';
import { StravaConnectCard } from '@/components/StravaSection';
import { clearApiKey, getStoredApiKey, saveApiKey } from '@/services/cursorParser';
import {
  clearStravaCredentials,
  getStravaCredentials,
  getStravaRedirectUri,
  saveStravaCredentials,
} from '@/services/strava';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [stravaClientId, setStravaClientId] = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [stravaSaved, setStravaSaved] = useState(false);
  const redirectUri = getStravaRedirectUri();
  const buildVersion =
    (Constants.expoConfig?.extra as { buildVersion?: string } | undefined)?.buildVersion ??
    'unknown';

  useEffect(() => {
    (async () => {
      const existing = await getStoredApiKey();
      if (existing) {
        setApiKey(existing);
        setSaved(true);
      }

      const stravaCredentials = await getStravaCredentials();
      if (stravaCredentials.clientId) {
        setStravaClientId(stravaCredentials.clientId);
      }
      if (stravaCredentials.clientSecret) {
        setStravaClientSecret(stravaCredentials.clientSecret);
        setStravaSaved(true);
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

  const handleSaveStrava = async () => {
    const clientId = stravaClientId.trim();
    const clientSecret = stravaClientSecret.trim();
    if (!clientId || !clientSecret) {
      Alert.alert(
        'Strava credentials required',
        'Create an app at strava.com/settings/api and paste your Client ID and Client Secret.',
      );
      return;
    }

    await saveStravaCredentials(clientId, clientSecret);
    setStravaSaved(true);
    Alert.alert(
      'Saved',
      `Add this callback URL to your Strava app settings:\n\n${redirectUri}`,
    );
  };

  const handleClearStrava = async () => {
    await clearStravaCredentials();
    setStravaClientId('');
    setStravaClientSecret('');
    setStravaSaved(false);
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
        <Text style={styles.cardTitle}>Strava API credentials</Text>
        <Text style={styles.cardBody}>
          Create an app at strava.com/settings/api, then paste your Client ID and Client Secret
          below. Set Authorization Callback Domain to{' '}
          <Text style={styles.inlineMono}>localhost</Text>, then paste this Authorization
          Redirect URL:
        </Text>
        <CopyableText value={redirectUri} />
        <TextInput
          style={styles.input}
          value={stravaClientId}
          onChangeText={(value) => {
            setStravaClientId(value);
            setStravaSaved(false);
          }}
          placeholder="Client ID"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          value={stravaClientSecret}
          onChangeText={(value) => {
            setStravaClientSecret(value);
            setStravaSaved(false);
          }}
          placeholder="Client Secret"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleSaveStrava}>
            <Text style={styles.primaryText}>
              {stravaSaved ? 'Update credentials' : 'Save credentials'}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleClearStrava}>
            <Text style={styles.secondaryText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <StravaConnectCard />

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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App build</Text>
        <Text style={styles.cardBody}>Build tag: {buildVersion}</Text>
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
  inlineMono: {
    color: '#374151',
    fontFamily: 'SpaceMono',
    fontSize: 12,
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
