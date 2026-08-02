import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TabBarProvider } from '@/context/TabBarContext';

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <TabBarProvider>
      <MaterialTopTabs
        tabBarPosition="bottom"
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
          sceneStyle: {
            backgroundColor: '#F9FAFB',
            paddingTop: insets.top,
          },
        }}>
        <MaterialTopTabs.Screen name="index" options={{ title: 'Today' }} />
        <MaterialTopTabs.Screen name="activity" options={{ title: 'Activity' }} />
        <MaterialTopTabs.Screen name="my-foods" options={{ title: 'My Foods' }} />
        <MaterialTopTabs.Screen name="history" options={{ title: 'History' }} />
        <MaterialTopTabs.Screen name="profile" options={{ title: 'Profile' }} />
      </MaterialTopTabs>
    </TabBarProvider>
  );
}
