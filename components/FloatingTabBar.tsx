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

interface TabRowProps extends Pick<MaterialTopTabBarProps, 'state' | 'navigation' | 'descriptors' | 'position'> {
  compact: boolean;
  onTabPressed?: () => void;
}

function TabRow({ state, navigation, descriptors, position, compact, onTabPressed }: TabRowProps) {
  const [innerWidth, setInnerWidth] = useState(0);
  const tabWidth = innerWidth > 0 ? innerWidth / state.routes.length : 0;

  return (
    <View
      style={styles.inner}
      onLayout={(event) => setInnerWidth(event.nativeEvent.layout.width)}>
      {tabWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            compact && styles.indicatorCompact,
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
          onTabPressed?.();
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
            style={[styles.tab, compact && styles.tabCompact]}>
            <Ionicons
              name={meta.icon}
              size={compact ? 19 : 22}
              color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
            />
            {!compact ? (
              <Text
                numberOfLines={1}
                style={[styles.label, { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR }]}>
                {meta.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function FloatingTabBar(props: MaterialTopTabBarProps) {
  const { state, navigation } = props;
  const insets = useSafeAreaInsets();
  const { collapsed, setCollapsed } = useTabBar();
  const collapseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(collapseAnim, {
      toValue: collapsed ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 70,
    }).start();
  }, [collapseAnim, collapsed]);

  // Swiping between tabs expands the bar. The tab-bar props type narrows
  // navigation to helpers without addListener, but the runtime object has it.
  useEffect(() => {
    const nav = navigation as unknown as {
      addListener?: (event: string, callback: () => void) => () => void;
    };
    const unsubscribe = nav.addListener?.('swipeStart', () => {
      setCollapsed(false);
    });
    return unsubscribe;
  }, [navigation, setCollapsed]);

  useEffect(() => {
    setCollapsed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  const barOpacity = collapseAnim.interpolate({
    inputRange: [0, 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const barScale = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });
  const barTranslate = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });

  const compactOpacity = collapseAnim.interpolate({
    inputRange: [0.45, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const compactScale = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      {/* Collapsed: compact pill with all tabs, icons only */}
      <Animated.View
        pointerEvents={collapsed ? 'auto' : 'none'}
        style={[
          styles.pillCompact,
          { opacity: compactOpacity, transform: [{ scale: compactScale }] },
        ]}>
        <FrostedBackground borderRadius={22} />
        <TabRow {...props} compact onTabPressed={() => setCollapsed(false)} />
      </Animated.View>

      {/* Expanded: full pill with labels */}
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
        <TabRow {...props} compact={false} />
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
  pillCompact: {
    position: 'absolute',
    bottom: 0,
    width: 260,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 5,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
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
  indicatorCompact: {
    borderRadius: 17,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 9,
    borderRadius: 22,
  },
  tabCompact: {
    paddingVertical: 8,
    borderRadius: 17,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
