import { Ionicons } from '@expo/vector-icons';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'sunny', label: 'Today' },
  activity: { icon: 'fitness', label: 'Activity' },
  'my-foods': { icon: 'restaurant', label: 'Foods' },
  history: { icon: 'calendar', label: 'History' },
  profile: { icon: 'person', label: 'Profile' },
};

const ACTIVE_COLOR = '#059669';
const INACTIVE_COLOR = '#9CA3AF';

export function FloatingTabBar({
  state,
  navigation,
  descriptors,
  position,
}: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const [innerWidth, setInnerWidth] = useState(0);

  const routeCount = state.routes.length;
  const tabWidth = innerWidth > 0 ? innerWidth / routeCount : 0;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        <View
          style={styles.inner}
          onLayout={(event) => setInnerWidth(event.nativeEvent.layout.width)}>
          {tabWidth > 0 ? (
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: tabWidth,
                  transform: [{ translateX: Animated.multiply(position, tabWidth) }],
                },
              ]}
            />
          ) : null}

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const meta = TAB_META[route.name] ?? { icon: 'ellipse' as const, label: route.name };

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}>
                <Ionicons
                  name={meta.icon}
                  size={22}
                  color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.label, { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR }]}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pill: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
  inner: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 9,
    borderRadius: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
