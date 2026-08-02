import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { FoodProvider } from '@/context/FoodContext';
import { ParseJobsBridge } from '@/context/ParseJobsBridge';
import { ProfileProvider } from '@/context/ProfileContext';
import { ActivityJobsBridge } from '@/context/ActivityJobsBridge';
import { SavedFoodsProvider } from '@/context/SavedFoodsContext';
import { StravaProvider } from '@/context/StravaContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <FoodProvider>
      <ProfileProvider>
        <StravaProvider>
          <ParseJobsBridge>
            <ActivityJobsBridge>
              <SavedFoodsProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="settings"
                      options={{
                        title: 'Settings',
                        headerShown: true,
                        headerTintColor: '#059669',
                        headerBackTitle: 'Back',
                      }}
                    />
                    <Stack.Screen
                      name="barcode"
                      options={{
                        title: 'Scan barcode',
                        presentation: 'modal',
                      }}
                    />
                  </Stack>
                </ThemeProvider>
              </SavedFoodsProvider>
            </ActivityJobsBridge>
          </ParseJobsBridge>
        </StravaProvider>
      </ProfileProvider>
    </FoodProvider>
  );
}
