import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

// Plain "G" mark instead of pulling in a Google-brand icon asset/package —
// keeps dependencies minimal while staying visually recognizable.
export function GoogleButton({ onPress, disabled, label }: { onPress: () => void; disabled?: boolean; label: string }) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      haptics
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.gray300, opacity: disabled ? 0.6 : 1 }]}
    >
      <Text style={[styles.g, { color: colors.gray900 }]}>G</Text>
      <Text style={[styles.label, { color: colors.gray900 }]}>{label}</Text>
    </AnimatedPressable>
  );
}

export function Divider({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
      <Text style={[styles.dividerLabel, { color: colors.gray500 }]}>{label}</Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.gray200 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
  },
  g: {
    fontSize: 16,
    fontWeight: '900',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
