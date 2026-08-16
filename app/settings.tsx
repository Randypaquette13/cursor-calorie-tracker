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
import {
  clearAnthropicApiKey,
  clearCursorApiKey,
  getAiProvider,
  getAnthropicApiKey,
  getCursorApiKey,
  saveAiProvider,
  saveAnthropicApiKey,
  saveCursorApiKey,
} from '@/services/aiProviderSettings';
import {
  clearStravaCredentials,
  getStravaCallbackDomain,
  getStravaCredentials,
  getStravaRedirectUri,
  saveStravaCredentials,
} from '@/services/strava';
import { AI_PROVIDERS, AI_PROVIDER_LABELS, type AiProvider } from '@/types/aiProvider';
import { getStravaSetupCopy } from '@/utils/stravaSetup';

export default function SettingsScreen() {
  const [provider, setProvider] = useState<AiProvider>('cursor');
  const [cursorApiKey, setCursorApiKey] = useState('');
  const [cursorSaved, setCursorSaved] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [anthropicSaved, setAnthropicSaved] = useState(false);
  const [stravaClientId, setStravaClientId] = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [stravaSaved, setStravaSaved] = useState(false);
  const redirectUri = getStravaRedirectUri();
  const stravaCallbackDomain = getStravaCallbackDomain();
  const stravaSetup = getStravaSetupCopy(stravaCallbackDomain, redirectUri);
  const buildVersion =
    (Constants.expoConfig?.extra as { buildVersion?: string } | undefined)?.buildVersion ??
    'unknown';

  useEffect(() => {
    (async () => {
      const storedProvider = await getAiProvider();
      setProvider(storedProvider);

      const existingCursorKey = await getCursorApiKey();
      if (existingCursorKey) {
        setCursorApiKey(existingCursorKey);
        setCursorSaved(true);
      }

      const existingAnthropicKey = await getAnthropicApiKey();
      if (existingAnthropicKey) {
        setAnthropicApiKey(existingAnthropicKey);
        setAnthropicSaved(true);
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

  const handleProviderChange = async (next: AiProvider) => {
    setProvider(next);
    await saveAiProvider(next);
  };

  const handleSaveCursorKey = async () => {
    const trimmed = cursorApiKey.trim();
    if (!trimmed) {
      Alert.alert('API key required', 'Paste your Cursor API key from cursor.com/dashboard/api');
      return;
    }
    await saveCursorApiKey(trimmed);
    setCursorSaved(true);
    Alert.alert('Saved', 'Your Cursor API key is stored securely on this device.');
  };

  const handleClearCursorKey = async () => {
    await clearCursorApiKey();
    setCursorApiKey('');
    setCursorSaved(false);
  };

  const handleSaveAnthropicKey = async () => {
    const trimmed = anthropicApiKey.trim();
    if (!trimmed) {
      Alert.alert('API key required', 'Paste your Anthropic API key from console.anthropic.com');
      return;
    }
    await saveAnthropicApiKey(trimmed);
    setAnthropicSaved(true);
    Alert.alert('Saved', 'Your Anthropic API key is stored securely on this device.');
  };

  const handleClearAnthropicKey = async () => {
    await clearAnthropicApiKey();
    setAnthropicApiKey('');
    setAnthropicSaved(false);
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
      stravaSetup.mode === 'railway'
        ? `In Strava, set Authorization Callback Domain to:\n\n${stravaSetup.callbackDomain}\n\n(no https:// or path)`
        : `In Strava, set Authorization Callback Domain to:\n\nlocalhost\n\n(not http://localhost)`,
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI service provider</Text>
        <Text style={styles.cardBody}>
          Choose which service parses natural-language food logs and activity estimates. You can
          store API keys for both and switch anytime.
        </Text>
        <View style={styles.providerRow}>
          {AI_PROVIDERS.map((option) => {
            const selected = provider === option;
            return (
              <Pressable
                key={option}
                style={[styles.providerOption, selected && styles.providerOptionSelected]}
                onPress={() => handleProviderChange(option)}>
                <Text
                  style={[styles.providerOptionText, selected && styles.providerOptionTextSelected]}>
                  {AI_PROVIDER_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cursor API key</Text>
        <Text style={styles.cardBody}>
          Natural-language parsing with Cursor uses the Cloud Agents API. Get a key from{' '}
          cursor.com/dashboard/api and paste it below. It stays on your phone in secure storage.
        </Text>
        <TextInput
          style={styles.input}
          value={cursorApiKey}
          onChangeText={(value) => {
            setCursorApiKey(value);
            setCursorSaved(false);
          }}
          placeholder="crsr_..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleSaveCursorKey}>
            <Text style={styles.primaryText}>{cursorSaved ? 'Update key' : 'Save key'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleClearCursorKey}>
            <Text style={styles.secondaryText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Anthropic API key</Text>
        <Text style={styles.cardBody}>
          Natural-language parsing with Claude uses the Anthropic Messages API. Get a key from{' '}
          console.anthropic.com and paste it below. It stays on your phone in secure storage.
        </Text>
        <TextInput
          style={styles.input}
          value={anthropicApiKey}
          onChangeText={(value) => {
            setAnthropicApiKey(value);
            setAnthropicSaved(false);
          }}
          placeholder="sk-ant-..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleSaveAnthropicKey}>
            <Text style={styles.primaryText}>{anthropicSaved ? 'Update key' : 'Save key'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleClearAnthropicKey}>
            <Text style={styles.secondaryText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Strava API credentials</Text>
        <Text style={styles.cardBody}>
          Create an app at strava.com/settings/api, then paste your Client ID and Client Secret
          below.
        </Text>
        <Text style={styles.cardBody}>{stravaSetup.callbackDomainHint}</Text>
        <Text style={styles.label}>Authorization Callback Domain</Text>
        <CopyableText value={stravaSetup.callbackDomain} />
        <Text style={styles.cardBody}>{stravaSetup.redirectHint}</Text>
        <Text style={styles.label}>OAuth redirect URL (used by this app)</Text>
        <CopyableText value={stravaSetup.redirectUri} />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerOption: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  providerOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  providerOptionText: {
    color: '#374151',
    fontWeight: '600',
  },
  providerOptionTextSelected: {
    color: '#047857',
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
