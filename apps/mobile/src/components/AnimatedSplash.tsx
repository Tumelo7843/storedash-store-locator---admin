import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Matches app.config.ts's expo-splash-screen plugin colors exactly, so the
// handoff from the static native splash to this animated one is seamless.
const BACKGROUND = { light: '#7c3aed', dark: '#0d0b12' };

// Purely time-driven — never awaits network/auth, so a slow API can't delay
// or extend this. Short and subtle: fade+scale in, brief hold, fade out.
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { resolvedTheme } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 350,
        delay: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(onFinish);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: BACKGROUND[resolvedTheme], opacity: exitOpacity }]}
    >
      <Animated.View
        style={{
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
        }}
      >
        <Image source={require('../../assets/splash-icon.png')} style={styles.image} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  // Matches splash-icon.png's native 1024x1536 (2:3) aspect ratio at the
  // same 180-wide size the native expo-splash-screen config uses.
  image: {
    width: 180,
    height: 270,
  },
});
