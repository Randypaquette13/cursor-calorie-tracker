import { Ionicons } from '@expo/vector-icons';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBar } from '@/context/TabBarContext';

const TAB_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'sunny', label: 'Today' },
  activity: { icon: 'fitness', label: 'Activity' },
  'my-foods': { icon: 'restaurant', label: 'Foods' },
  history: { icon: 'calendar', label: 'History' },
  profile: { icon: 'person', label: 'Profile' },
};

const ACTIVE_COLOR = '#059669';
const INACTIVE_COLOR = '#6B7280';

function FrostedBackground({ borderRadius }: { borderRadius: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>
      <BlurView
        intensity={45}
        tint="light"
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      />
      <View style={[StyleSheet.absoluteFill, styles.frostTint]} />
    </View>
  );
}

export function FloatingTabBar({
  state,
  navigation,
  descriptors,
  position,
}: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const { collapsed, setCollapsed } = useTabBar();
  const [innerWidth, setInnerWidth] = useState(0);
  const collapseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(collapseAnim, {
      toValue: collapsed ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 70,
    }).start();
  }, [collapseAnim, collapsed]);

  const routeCount = state.routes.length;
  const tabWidth = innerWidth > 0 ? innerWidth / routeCount : 0;

  const activeRoute = state.routes[state.index];
  const activeMeta = TAB_META[activeRoute.name] ?? { icon: 'ellipse' as const, label: '' };

  const barOpacity = collapseAnim.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' });
  const barScale = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] });
  const barTranslate = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  const dotOpacity = collapseAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const dotScale = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      {/* Collapsed: compact frosted button with the active tab icon */}
      <Animated.View
        pointerEvents={collapsed ? 'auto' : 'none'}
        style={[
          styles.collapsedWrap,
          { opacity: dotOpacity, transform: [{ scale: dotScale }] },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Expand navigation"
          onPress={() => setCollapsed(false)}
          style={styles.collapsedButton}>
          <FrostedBackground borderRadius={26} />
          <Ionicons name={activeMeta.icon} size={22} color={ACTIVE_COLOR} />
          <Text style={styles.collapsedLabel}>{activeMeta.label}</Text>
        </Pressable>
      </Animated.View>

      {/* Expanded: full frosted pill */}
      <Animated.View
        pointerEvents={collapsed ? 'none' : 'auto'}
        style={[
          styles.pill,
          {
            opacity: barOpacity,
            transform: [{ scale: barScale }, { translateY: barTranslate }],
          },
        ]}>
        <FrostedBackground borderRadius={28} />
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
      </Animated.View>
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
  frostTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  pill: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(229, 231, 235, 0.9)',
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
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
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
  collapsedWrap: {
    position: 'absolute',
    bottom: 0,
  },
  collapsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
    overflow: 'visible',
  },
  collapsedLabel: {
    color: ACTIVE_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
});
