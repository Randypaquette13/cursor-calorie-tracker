import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Pressable } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <Ionicons name="sunny" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Ionicons name="fitness" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-foods"
        options={{
          title: 'My Foods',
          tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null,
          headerShown: true,
          headerLeft: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.back()}
              style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#059669" />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
