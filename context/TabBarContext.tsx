import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface TabBarContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

/** Accumulated scroll distance (px) in one direction before toggling. */
const COLLAPSE_DISTANCE = 14;
const EXPAND_DISTANCE = 14;
const TOP_REGION = 32;
/** Ignore huge jumps (e.g. switching tabs with different scroll offsets). */
const MAX_TRACKED_DELTA = 120;

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const lastYRef = useRef(0);
  const accumulatedRef = useRef(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastYRef.current;
    lastYRef.current = y;

    if (Math.abs(delta) > MAX_TRACKED_DELTA) {
      accumulatedRef.current = 0;
      return;
    }

    if (y <= TOP_REGION) {
      accumulatedRef.current = 0;
      setCollapsed(false);
      return;
    }

    // Reset the accumulator when the scroll direction flips so slow,
    // steady scrolls in one direction always add up to the threshold.
    if ((delta > 0 && accumulatedRef.current < 0) || (delta < 0 && accumulatedRef.current > 0)) {
      accumulatedRef.current = 0;
    }

    accumulatedRef.current += delta;

    if (accumulatedRef.current > COLLAPSE_DISTANCE) {
      accumulatedRef.current = 0;
      setCollapsed(true);
    } else if (accumulatedRef.current < -EXPAND_DISTANCE) {
      accumulatedRef.current = 0;
      setCollapsed(false);
    }
  }, []);

  const value = useMemo(
    () => ({ collapsed, setCollapsed, onScroll }),
    [collapsed, onScroll],
  );

  return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>;
}

export function useTabBar() {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within TabBarProvider');
  }
  return context;
}
