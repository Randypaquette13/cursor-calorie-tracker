import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface TabBarContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

const COLLAPSE_DELTA = 8;
const EXPAND_DELTA = 8;
const TOP_REGION = 32;
/** Ignore huge jumps (e.g. switching tabs with different scroll offsets). */
const MAX_TRACKED_DELTA = 120;

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const lastYRef = useRef(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastYRef.current;
    lastYRef.current = y;

    if (Math.abs(delta) > MAX_TRACKED_DELTA) {
      return;
    }

    if (y <= TOP_REGION) {
      setCollapsed(false);
      return;
    }

    if (delta > COLLAPSE_DELTA) {
      setCollapsed(true);
    } else if (delta < -EXPAND_DELTA) {
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
