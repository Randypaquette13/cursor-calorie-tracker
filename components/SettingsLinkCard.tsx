import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

interface SettingsLinkCardProps {
  compact?: boolean;
}

export function SettingsLinkCard({ compact = false }: SettingsLinkCardProps) {
  return (
    <Link href="/(tabs)/settings" asChild>
      <Pressable style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.iconWrap}>
          <Ionicons name="settings-outline" size={22} color="#374151" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>App settings</Text>
          <Text style={styles.body}>
            {compact
              ? 'API keys, Strava, app info'
              : 'Cursor API key, Strava credentials, and app build info'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardCompact: {
    paddingVertical: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
});
