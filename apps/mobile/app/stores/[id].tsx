import { formatZAR, type Product } from '@storedash/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  Sparkles,
  Store as StoreIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchProducts } from '../../src/api/products';
import { fetchServices } from '../../src/api/services';
import { fetchStore } from '../../src/api/stores';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { OpenClosedBadge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState, Spinner } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { Skeleton } from '../../src/components/Skeleton';
import { directionsUrl } from '../../src/components/StoreCard';
import { Toast } from '../../src/components/Toast';
import { useCart } from '../../src/context/CartContext';
import { useTheme } from '../../src/context/ThemeContext';
import { DAY_LABELS, formatDayHours, isStoreOpenNow, ORDERED_DAY_KEYS } from '../../src/lib/hours';
import { useAsync } from '../../src/lib/useAsync';
import { FadeInView } from '../../src/components/FadeInView';

type Tab = 'products' | 'services';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const { addItem, lines } = useCart();
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const storeQuery = useAsync(() => fetchStore(storeId), [storeId]);
  const productsQuery = useAsync(() => fetchProducts({ storeId, search: search || undefined, limit: 100 }), [storeId, search]);
  const servicesQuery = useAsync(() => fetchServices({ storeId, search: search || undefined, limit: 100 }), [storeId, search]);

  if (storeQuery.loading) {
    return (
      <Screen>
        <Spinner label="Loading store…" />
      </Screen>
    );
  }
  if (storeQuery.error) {
    return (
      <Screen>
        <ErrorState message={storeQuery.error} onRetry={storeQuery.reload} />
      </Screen>
    );
  }
  const store = storeQuery.data;
  if (!store) {
    return (
      <Screen>
        <EmptyState title="Store not found" description="This store may have been removed or is no longer active." />
      </Screen>
    );
  }

  const openNow = isStoreOpenNow(store.openingHours);

  const handleAdd = (product: Product) => {
    const outcome = addItem(product);
    setToast(outcome === 'store_switched' ? `Started a new cart for ${store.name}` : 'Added to cart');
    setTimeout(() => setToast(''), 1600);
  };

  return (
    <Screen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.banner}>
          {store.bannerUrl ? (
            <Image source={{ uri: store.bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.gray800 }]} />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill} />

          <AnimatedPressable haptics onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={18} color="#fff" />
          </AnimatedPressable>

          <View style={styles.bannerContent}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{store.category}</Text>
              </View>
              <OpenClosedBadge open={openNow} />
            </View>
            <Text style={styles.bannerTitle}>{store.name}</Text>
            <View style={styles.addressRow}>
              <MapPin size={12} color="#e5e7eb" />
              <Text style={styles.addressText} numberOfLines={1}>
                {store.address}, {store.city}, {store.state}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.quickActions}>
            <AnimatedPressable haptics onPress={() => Linking.openURL(directionsUrl(store))} style={[styles.quickBtn, { backgroundColor: colors.primary }]}>
              <Navigation size={14} color="#fff" />
              <Text style={styles.quickBtnPrimaryText}>Directions</Text>
            </AnimatedPressable>
            {store.phone && (
              <AnimatedPressable haptics onPress={() => Linking.openURL(`tel:${store.phone}`)} style={[styles.quickBtn, { backgroundColor: colors.gray100 }]}>
                <Phone size={14} color={colors.gray800} />
                <Text style={[styles.quickBtnText, { color: colors.gray800 }]}>Call</Text>
              </AnimatedPressable>
            )}
            {store.email && (
              <AnimatedPressable
                haptics
                onPress={() => Linking.openURL(`mailto:${store.email}`)}
                style={[styles.quickBtn, { backgroundColor: colors.gray100 }]}
              >
                <Mail size={14} color={colors.gray800} />
                <Text style={[styles.quickBtnText, { color: colors.gray800 }]}>Email</Text>
              </AnimatedPressable>
            )}
          </View>

          {store.description && <Text style={[styles.description, { color: colors.gray600 }]}>{store.description}</Text>}

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
            <View style={styles.cardHeader}>
              <Clock size={15} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.gray900 }]}>Opening Hours</Text>
            </View>
            {store.openingHours ? (
              ORDERED_DAY_KEYS.map((key) => (
                <View key={key} style={[styles.hoursRow, { borderColor: colors.gray100 }]}>
                  <Text style={[styles.hoursDay, { color: colors.gray800 }]}>{DAY_LABELS[key]}</Text>
                  <Text style={[styles.hoursValue, { color: colors.gray600 }]}>{formatDayHours(store.openingHours![key])}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.mutedItalic, { color: colors.gray500 }]}>This store hasn't published its hours yet.</Text>
            )}
          </View>

          <View style={[styles.tabBar, { backgroundColor: colors.gray100 }]}>
            <AnimatedPressable onPress={() => setTab('products')} style={[styles.tabBtn, tab === 'products' && { backgroundColor: colors.surface }]}>
              <Package size={14} color={tab === 'products' ? colors.gray900 : colors.gray500} />
              <Text style={[styles.tabText, { color: tab === 'products' ? colors.gray900 : colors.gray500 }]}>Products</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => setTab('services')} style={[styles.tabBtn, tab === 'services' && { backgroundColor: colors.surface }]}>
              <Sparkles size={14} color={tab === 'services' ? colors.gray900 : colors.gray500} />
              <Text style={[styles.tabText, { color: tab === 'services' ? colors.gray900 : colors.gray500 }]}>Services</Text>
            </AnimatedPressable>
          </View>

          <View style={[styles.searchBox, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
            <Search size={15} color={colors.gray500} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${tab}…`}
              placeholderTextColor={colors.gray500}
              style={[styles.searchInput, { color: colors.gray900 }]}
            />
          </View>

          {tab === 'products' && (
            <>
              {productsQuery.loading && (
                <View style={styles.grid}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} style={{ width: '48%', height: 150, borderRadius: 16 }} />
                  ))}
                </View>
              )}
              {!productsQuery.loading && productsQuery.error && <ErrorState message={productsQuery.error} onRetry={productsQuery.reload} />}
              {!productsQuery.loading && !productsQuery.error && (productsQuery.data?.items.length ?? 0) === 0 && (
                <EmptyState icon={Package} title="No products found" description="This store hasn't listed any products matching your search." />
              )}
              {!productsQuery.loading && !productsQuery.error && (
                <View style={styles.grid}>
                  {productsQuery.data?.items.map((p, i) => {
                    const isOut = p.availability === 'out_of_stock';
                    const inCart = lines.find((l) => l.product.id === p.id)?.quantity ?? 0;
                    return (
                      <FadeInView key={p.id} index={i} style={{ width: '48%' }}>
                        <AnimatedPressable
                          onPress={() => router.push(`/products/${p.id}`)}
                          style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}
                        >
                          <View style={[styles.productImageWrap, { backgroundColor: colors.gray100 }]}>
                            {p.imageUrl && <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                            <View
                              style={[
                                styles.stockPill,
                                { backgroundColor: isOut ? colors.rose400 : p.availability === 'low_stock' ? colors.amber400 : colors.emerald400 },
                              ]}
                            >
                              <Text style={styles.stockPillText}>{isOut ? 'Out of stock' : p.availability === 'low_stock' ? 'Low stock' : 'In stock'}</Text>
                            </View>
                          </View>
                          <View style={styles.productBody}>
                            <Text style={[styles.productCategory, { color: colors.gray400 }]}>{p.category}</Text>
                            <Text numberOfLines={1} style={[styles.productName, { color: colors.gray900 }]}>
                              {p.name}
                            </Text>
                            <View style={styles.productFooter}>
                              <Text style={[styles.productPrice, { color: colors.gray900 }]}>{formatZAR(p.price)}</Text>
                              <AnimatedPressable
                                haptics
                                onPress={() => handleAdd(p)}
                                disabled={isOut}
                                style={[styles.addBtn, { backgroundColor: isOut ? colors.gray200 : colors.primary }]}
                              >
                                <Plus size={14} color={isOut ? colors.gray500 : '#fff'} />
                                {inCart > 0 && <Text style={styles.addBtnCount}>{inCart}</Text>}
                              </AnimatedPressable>
                            </View>
                          </View>
                        </AnimatedPressable>
                      </FadeInView>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {tab === 'services' && (
            <>
              {servicesQuery.loading && <Spinner />}
              {!servicesQuery.loading && servicesQuery.error && <ErrorState message={servicesQuery.error} onRetry={servicesQuery.reload} />}
              {!servicesQuery.loading && !servicesQuery.error && (servicesQuery.data?.items.length ?? 0) === 0 && (
                <EmptyState icon={Sparkles} title="No services found" description="This store hasn't listed any services matching your search." />
              )}
              {!servicesQuery.loading &&
                !servicesQuery.error &&
                servicesQuery.data?.items.map((s, i) => (
                  <FadeInView key={s.id} index={i}>
                    <AnimatedPressable
                      onPress={() => router.push(`/services/${s.id}`)}
                      style={[styles.serviceCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}
                    >
                      <View style={[styles.serviceImageWrap, { backgroundColor: colors.gray100 }]}>
                        {s.imageUrl ? <Image source={{ uri: s.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <StoreIcon size={20} color={colors.gray400} />}
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={[styles.productCategory, { color: colors.gray400 }]}>{s.category}</Text>
                        <Text style={[styles.productName, { color: colors.gray900 }]}>{s.name}</Text>
                        {s.description && (
                          <Text numberOfLines={2} style={[styles.serviceDescription, { color: colors.gray500 }]}>
                            {s.description}
                          </Text>
                        )}
                        <View style={styles.serviceMetaRow}>
                          <Text style={[styles.productPrice, { color: colors.gray900 }]}>{formatZAR(s.price)}</Text>
                          {s.durationMinutes && <Text style={[styles.serviceDuration, { color: colors.gray500 }]}>{s.durationMinutes} min</Text>}
                        </View>
                      </View>
                      <ChevronRight size={16} color={colors.gray400} />
                    </AnimatedPressable>
                  </FadeInView>
                ))}
            </>
          )}
        </View>
      </ScrollView>

      <Toast visible={Boolean(toast)} message={toast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 220,
    justifyContent: 'space-between',
  },
  backBtn: {
    marginTop: 8,
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    padding: 16,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  categoryPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressText: {
    color: '#e5e7eb',
    fontSize: 12,
    flexShrink: 1,
  },
  section: {
    padding: 16,
    gap: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  quickBtnPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hoursDay: {
    fontSize: 12,
    fontWeight: '700',
  },
  hoursValue: {
    fontSize: 12,
  },
  mutedItalic: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
    alignSelf: 'flex-start',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  productImageWrap: {
    aspectRatio: 4 / 3,
    justifyContent: 'flex-end',
  },
  stockPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  stockPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  productBody: {
    padding: 10,
    gap: 4,
  },
  productCategory: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  addBtnCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  serviceCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  serviceImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  serviceDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  serviceDuration: {
    fontSize: 11,
  },
});
