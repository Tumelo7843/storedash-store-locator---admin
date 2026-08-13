import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Animated, Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptics?: boolean;
  scaleTo?: number;
}

// Shared press-feedback primitive: a small scale-down on press-in, spring
// back on release, with an optional light haptic tick — used by every
// tappable surface (buttons, cards) so feedback is consistent app-wide
// without re-implementing it per component.
export function AnimatedPressable({ children, style, haptics = false, scaleTo = 0.97, onPressIn, onPressOut, ...props }: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    if (haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
