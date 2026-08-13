import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Self-dismissing confirmation toast (e.g. "Added to cart") — fades/rises in,
// holds briefly, fades out. Controlled entirely by `visible` so the parent
// owns timing/messages; this just owns the animation.
export function Toast({ visible, message }: { visible: boolean; message: string }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(progress, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [visible, message, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          backgroundColor: colors.gray900,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <CheckCircle2 size={15} color={colors.emerald400} />
      <Text style={[styles.text, { color: colors.gray50 }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
