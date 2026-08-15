import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, { backgroundColor: colors.gray200, opacity }, style]} />;
}

export function StoreCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonRowStyles.row, { borderColor: colors.gray100 }]}>
      <Skeleton style={{ width: 56, height: 56, borderRadius: 14 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton style={{ width: '70%', height: 13, borderRadius: 6 }} />
        <Skeleton style={{ width: '50%', height: 11, borderRadius: 6 }} />
        <Skeleton style={{ width: '35%', height: 11, borderRadius: 6 }} />
      </View>
    </View>
  );
}

// Matches the real ProductCard's shape in app/stores/[id].tsx (image with
// 4:3 aspect ratio, then category/name/price rows) — used both for the
// initial products grid load and as the infinite-scroll loading-more footer.
export function ProductCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonCardStyles.card, { borderColor: colors.gray100 }]}>
      <Skeleton style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 0 }} />
      <View style={{ padding: 10, gap: 6 }}>
        <Skeleton style={{ width: '40%', height: 9, borderRadius: 5 }} />
        <Skeleton style={{ width: '75%', height: 13, borderRadius: 6 }} />
        <Skeleton style={{ width: '35%', height: 14, borderRadius: 6, marginTop: 4 }} />
      </View>
    </View>
  );
}

// Matches the real service row's shape (60x60 image + text column).
export function ServiceCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonRowStyles.row, { borderColor: colors.gray100, borderBottomWidth: 0, borderWidth: 1, borderRadius: 16, marginBottom: 12 }]}>
      <Skeleton style={{ width: 60, height: 60, borderRadius: 12 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton style={{ width: '30%', height: 9, borderRadius: 5 }} />
        <Skeleton style={{ width: '60%', height: 13, borderRadius: 6 }} />
        <Skeleton style={{ width: '25%', height: 12, borderRadius: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
  },
});

const skeletonRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

const skeletonCardStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
