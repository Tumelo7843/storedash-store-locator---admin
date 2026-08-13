import type { OrderStatus } from '@storedash/shared';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function OpenClosedBadge({ open }: { open: boolean | null }) {
  const { colors } = useTheme();
  if (open === null) return null;
  return (
    <View style={[styles.pill, { backgroundColor: open ? 'rgba(5,150,105,0.15)' : colors.gray200 }]}>
      <Text style={[styles.pillText, { color: open ? colors.emerald400 : colors.gray500 }]}>{open ? 'Open' : 'Closed'}</Text>
    </View>
  );
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const palette: Record<OrderStatus, { bg: string; fg: string }> = {
    pending: { bg: 'rgba(180,83,9,0.14)', fg: colors.amber300 },
    processing: { bg: 'rgba(59,130,246,0.14)', fg: colors.accent },
    completed: { bg: 'rgba(5,150,105,0.14)', fg: colors.emerald400 },
    cancelled: { bg: colors.gray200, fg: colors.gray500 },
  };
  const p = palette[status];
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      <Text style={[styles.pillText, { color: p.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
