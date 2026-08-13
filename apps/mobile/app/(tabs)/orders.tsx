import { formatZAR } from '@storedash/shared';
import { useRouter } from 'expo-router';
import { LogIn, Receipt } from 'lucide-react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { fetchMyOrders } from '../../src/api/orders';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { OrderStatusBadge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState, Spinner } from '../../src/components/ErrorState';
import { FadeInView } from '../../src/components/FadeInView';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useAsync } from '../../src/lib/useAsync';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const query = useAsync(() => fetchMyOrders(), [profile?.id]);

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.gray900 }]}>Your Orders</Text>

      {!authLoading && !profile && (
        <EmptyState
          icon={LogIn}
          title="Sign in to view your orders"
          description="Your order history is tied to your account."
          action={
            <View style={{ width: 160, marginTop: 8 }}>
              <Button label="Sign in" onPress={() => router.push('/sign-in')} />
            </View>
          }
        />
      )}

      {(authLoading || (profile && query.loading)) && <Spinner label="Loading your orders…" />}
      {profile && !query.loading && query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {profile && !query.loading && !query.error && (query.data?.items.length ?? 0) === 0 && (
        <EmptyState icon={Receipt} title="No orders yet" description="Orders you place will show up here." />
      )}

      {profile && !query.loading && !query.error && (query.data?.items.length ?? 0) > 0 && (
        <FlatList
          data={query.data!.items}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item: order, index }) => (
            <FadeInView index={index}>
              <AnimatedPressable
                onPress={() => router.push(`/orders/${order.id}`)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}
              >
                <View style={{ gap: 3 }}>
                  <Text style={[styles.orderNumber, { color: colors.gray900 }]}>Order #{order.id}</Text>
                  <Text style={[styles.orderDate, { color: colors.gray500 }]}>{new Date(order.createdAt).toLocaleString()}</Text>
                  <Text style={[styles.orderItems, { color: colors.gray400 }]}>
                    {order.items.length} item{order.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={[styles.orderTotal, { color: colors.gray900 }]}>{formatZAR(order.totalAmount)}</Text>
                  <OrderStatusBadge status={order.status} />
                </View>
              </AnimatedPressable>
            </FadeInView>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 11,
  },
  orderItems: {
    fontSize: 11,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
});
