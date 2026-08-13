import { formatZAR } from '@storedash/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchMyOrder } from '../../src/api/orders';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { OrderStatusBadge } from '../../src/components/Badge';
import { ErrorState, Spinner } from '../../src/components/ErrorState';
import { FadeInView } from '../../src/components/FadeInView';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/context/ThemeContext';
import { useAsync } from '../../src/lib/useAsync';

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: 'The store has received your order and will confirm it shortly.',
  processing: 'The store is preparing your order.',
  completed: 'Your order is complete.',
  cancelled: 'This order was cancelled.',
};

export default function OrderDetailScreen() {
  const { id, justPlaced } = useLocalSearchParams<{ id: string; justPlaced?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const query = useAsync(() => fetchMyOrder(Number(id)), [id]);

  return (
    <Screen>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Order Details</Text>
        <View style={{ width: 34 }} />
      </View>

      {query.loading && <Spinner label="Loading order…" />}
      {!query.loading && query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {!query.loading && !query.error && query.data && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {justPlaced === '1' && (
            <FadeInView>
              <View style={[styles.successBanner, { backgroundColor: 'rgba(5,150,105,0.1)', borderColor: 'rgba(5,150,105,0.25)' }]}>
                <CheckCircle2 size={22} color={colors.emerald400} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.successTitle, { color: colors.gray900 }]}>Order placed!</Text>
                  <Text style={[styles.successSubtitle, { color: colors.gray600 }]}>We've sent your order to the store.</Text>
                </View>
              </View>
            </FadeInView>
          )}

          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.orderNumber, { color: colors.gray900 }]}>Order #{query.data.id}</Text>
              <Text style={[styles.orderDate, { color: colors.gray500 }]}>{new Date(query.data.createdAt).toLocaleString()}</Text>
            </View>
            <OrderStatusBadge status={query.data.status} />
          </View>

          <Text style={[styles.statusDescription, { color: colors.gray600 }]}>{STATUS_DESCRIPTIONS[query.data.status]}</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
            {query.data.items.map((item, i) => (
              <View key={item.id} style={[styles.itemRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.gray100 }]}>
                <View>
                  <Text style={[styles.itemName, { color: colors.gray900 }]}>{item.productName}</Text>
                  <Text style={[styles.itemMeta, { color: colors.gray500 }]}>
                    {item.quantity} × {formatZAR(item.unitPrice)}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: colors.gray900 }]}>{formatZAR(item.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
            <Text style={[styles.totalLabel, { color: colors.gray600 }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.gray900 }]}>{formatZAR(query.data.totalAmount)}</Text>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  successSubtitle: {
    fontSize: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
  },
  statusDescription: {
    fontSize: 13,
    marginTop: -6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 12,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
});
