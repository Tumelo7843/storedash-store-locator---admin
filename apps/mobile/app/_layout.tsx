import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { resolvedTheme, colors } = useTheme();
  const [splashVisible, setSplashVisible] = useState(true);
  const nativeSplashHidden = useRef(false);

  useEffect(() => {
    // Fires once, as soon as this (already-mounted, already-themed) tree is
    // ready to paint — swaps the static native splash for the animated one
    // below. Not gated on auth/network in any way.
    if (!nativeSplashHidden.current) {
      nativeSplashHidden.current = true;
      void SplashScreen.hideAsync();
    }
  }, []);

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.gray50 },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="stores/[id]" />
        <Stack.Screen name="products/[id]" />
        <Stack.Screen name="services/[id]" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sign-up" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="forgot-password" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="account/manage" />
        <Stack.Screen name="become-store-owner" />
        <Stack.Screen name="legal/privacy-policy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/about" />
      </Stack>
      {splashVisible && <AnimatedSplash onFinish={() => setSplashVisible(false)} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <RootNavigator />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
