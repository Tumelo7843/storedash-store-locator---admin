import { formatZAR } from '@storedash/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Plus, Store as StoreIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchProduct } from '../../src/api/products';
import { fetchStore } from '../../src/api/stores';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState, Spinner } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { Toast } from '../../src/components/Toast';
import { useCart } from '../../src/context/CartContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useAsync } from '../../src/lib/useAsync';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const { addItem, lines } = useCart();
  const [toast, setToast] = useState('');

  const productQuery = useAsync(() => fetchProduct(productId), [productId]);
  const product = productQuery.data;
  const storeQuery = useAsync(() => (product ? fetchStore(product.storeId) : Promise.resolve(null)), [product?.storeId]);

  if (productQuery.loading) {
    return (
      <Screen>
        <Spinner label="Loading product…" />
      </Screen>
    );
  }
  if (productQuery.error) {
    return (
      <Screen>
        <ErrorState message={productQuery.error} onRetry={productQuery.reload} />
      </Screen>
    );
  }
  if (!product) {
    return (
      <Screen>
        <EmptyState title="Product not found" description="This product may have been removed or is no longer available." />
      </Screen>
    );
  }

  const isOut = product.availability === 'out_of_stock';
  const inCart = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
  const availabilityMeta = isOut
    ? { label: 'Out of stock', color: colors.rose400 }
    : product.availability === 'low_stock'
      ? { label: 'Low stock', color: colors.amber400 }
      : { label: 'In stock', color: colors.emerald400 };

  const handleAdd = () => {
    const outcome = addItem(product);
    setToast(outcome === 'store_switched' ? 'Started a new cart for this store' : 'Added to cart');
    setTimeout(() => setToast(''), 1600);
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AnimatedPressable haptics onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.imageWrap, { backgroundColor: colors.gray100 }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <StoreIcon size={40} color={colors.gray400} />
          )}
        </View>

        <View style={{ gap: 6 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.category, { color: colors.gray400 }]}>{product.category}</Text>
            <View style={[styles.availabilityPill, { backgroundColor: availabilityMeta.color }]}>
              <Text style={styles.availabilityText}>{availabilityMeta.label}</Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.gray900 }]}>{product.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>{formatZAR(product.price)}</Text>
        </View>

        {product.description && <Text style={[styles.description, { color: colors.gray600 }]}>{product.description}</Text>}

        {storeQuery.data && (
          <AnimatedPressable
            onPress={() => router.push(`/stores/${storeQuery.data!.id}`)}
            style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}
          >
            <View style={[styles.storeImageWrap, { backgroundColor: colors.gray100 }]}>
              {storeQuery.data.imageUrl ? (
                <Image source={{ uri: storeQuery.data.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <StoreIcon size={18} color={colors.gray400} />
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text numberOfLines={1} style={[styles.storeName, { color: colors.gray900 }]}>
                {storeQuery.data.name}
              </Text>
              <Text numberOfLines={1} style={[styles.storeAddress, { color: colors.gray500 }]}>
                {storeQuery.data.address}, {storeQuery.data.city}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </AnimatedPressable>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.gray50, borderTopColor: colors.gray100 }]}>
        <AnimatedPressable
          haptics
          onPress={isOut ? undefined : handleAdd}
          disabled={isOut}
          style={[styles.addBtn, { backgroundColor: isOut ? colors.gray200 : colors.primary }]}
        >
          <Plus size={16} color={isOut ? colors.gray500 : '#fff'} />
          <Text style={[styles.addBtnText, { color: isOut ? colors.gray500 : '#fff' }]}>
            {isOut ? 'Out of stock' : inCart > 0 ? `Add another (${inCart} in cart)` : 'Add to cart'}
          </Text>
        </AnimatedPressable>
      </View>

      <Toast visible={Boolean(toast)} message={toast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 16,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  availabilityPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  storeImageWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '800',
  },
  storeAddress: {
    fontSize: 11,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
