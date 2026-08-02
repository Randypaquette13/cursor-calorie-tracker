import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        sceneStyle: { backgroundColor: '#F9FAFB' },
      }}>
      <MaterialTopTabs.Screen name="index" options={{ title: 'Today' }} />
      <MaterialTopTabs.Screen name="activity" options={{ title: 'Activity' }} />
      <MaterialTopTabs.Screen name="my-foods" options={{ title: 'My Foods' }} />
      <MaterialTopTabs.Screen name="history" options={{ title: 'History' }} />
      <MaterialTopTabs.Screen name="profile" options={{ title: 'Profile' }} />
    </MaterialTopTabs>
  );
}
