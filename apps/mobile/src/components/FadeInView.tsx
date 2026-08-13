import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Staggered entrance for list rows/cards: fade + slight rise, offset by
// `index` so a list animates in as a cascade rather than all at once.
export function FadeInView({ children, index = 0, style }: { children: React.ReactNode; index?: number; style?: any }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      delay: Math.min(index, 8) * 35,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
