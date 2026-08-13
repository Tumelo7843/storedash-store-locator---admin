import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

export function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {title && <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>{title}</Text>}
      <View style={[styles.sectionBody, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  onPress,
  destructive,
  last,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.gray100 }]}>
      {Icon && <Icon size={17} color={destructive ? colors.rose400 : colors.gray600} />}
      <Text style={[styles.label, { color: destructive ? colors.rose400 : colors.gray900, flex: 1 }]}>{label}</Text>
      {value && <Text style={[styles.value, { color: colors.gray500 }]}>{value}</Text>}
      {onPress && <ChevronRight size={16} color={colors.gray400} />}
    </View>
  );

  if (!onPress) return content;
  return <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable>;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 4,
  },
  sectionBody: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
  },
});
