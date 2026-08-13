import { formatZAR } from '@storedash/shared';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckCircle2, LogIn, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { placeOrder } from '../../src/api/orders';
import { ApiError } from '../../src/api/client';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorBanner } from '../../src/components/Banner';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { useCart, type CartLine } from '../../src/context/CartContext';
import { useTheme } from '../../src/context/ThemeContext';

function CartRow({ line }: { line: CartLine }) {
  const { colors } = useTheme();
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = line;

  return (
    <View style={[styles.row, { borderColor: colors.gray100 }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.gray100 }]}>
        {product.imageUrl && <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.gray900 }]}>
          {product.name}
        </Text>
        <Text style={[styles.unitPrice, { color: colors.gray500 }]}>{formatZAR(product.price)} each</Text>
      </View>
      <View style={[styles.stepper, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
        <AnimatedPressable haptics onPress={() => updateQuantity(product.id, quantity - 1)} style={styles.stepBtn}>
          <Minus size={13} color={colors.gray700} />
        </AnimatedPressable>
        <Text style={[styles.stepValue, { color: colors.gray900 }]}>{quantity}</Text>
        <AnimatedPressable haptics onPress={() => updateQuantity(product.id, quantity + 1)} style={styles.stepBtn}>
          <Plus size={13} color={colors.gray700} />
        </AnimatedPressable>
      </View>
      <AnimatedPressable haptics onPress={() => removeItem(product.id)} style={styles.removeBtn}>
        <Trash2 size={16} color={colors.rose400} />
      </AnimatedPressable>
    </View>
  );
}

export default function CartScreen() {
  const { colors } = useTheme();
  const { lines, clear, totalCount, totalPrice, storeId } = useCart();
  const { profile } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!storeId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await placeOrder(
        storeId,
        lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      );
      clear();
      router.push(`/orders/${order.id}?justPlaced=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmClear = () => {
    Alert.alert('Clear cart?', 'This removes every item from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear cart', style: 'destructive', onPress: clear },
    ]);
  };

  if (lines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse stores and add products to get started."
          action={
            <View style={{ width: 180, marginTop: 8 }}>
              <Button label="Discover stores" onPress={() => router.push('/')} />
            </View>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.gray900 }]}>Your Cart</Text>
        <AnimatedPressable onPress={confirmClear}>
          <Text style={[styles.clearText, { color: colors.rose400 }]}>Clear</Text>
        </AnimatedPressable>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(l) => String(l.product.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <CartRow line={item} />}
      />

      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryCount, { color: colors.gray600 }]}>
            {totalCount} item{totalCount === 1 ? '' : 's'}
          </Text>
          <Text style={[styles.summaryTotal, { color: colors.gray900 }]}>{formatZAR(totalPrice)}</Text>
        </View>

        {error && <ErrorBanner message={error} />}

        {profile ? (
          <Button label={submitting ? 'Placing order…' : 'Place Order'} onPress={handleCheckout} loading={submitting} icon={<CheckCircle2 size={16} color="#fff" />} />
        ) : (
          <Button label="Sign in to check out" onPress={() => router.push('/sign-in')} variant="secondary" icon={<LogIn size={16} color={colors.gray900} />} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  imageWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
  },
  unitPrice: {
    fontSize: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
  },
  stepBtn: {
    padding: 5,
  },
  stepValue: {
    fontSize: 12,
    fontWeight: '800',
    width: 18,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 6,
  },
  summary: {
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '800',
  },
});
