import type { Store } from '@storedash/shared';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShoppingBag,
  Store as StoreIcon,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchStores } from '../../src/api/stores';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { OpenClosedBadge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { FadeInView } from '../../src/components/FadeInView';
import { Screen } from '../../src/components/Screen';
import { StoreCardSkeleton } from '../../src/components/Skeleton';
import { directionsUrl, StoreCard } from '../../src/components/StoreCard';
import { StoreMapView } from '../../src/components/StoreMapView';
import { useTheme } from '../../src/context/ThemeContext';
import { useDebouncedValue } from '../../src/lib/useDebouncedValue';
import { haversineDistanceKm, useGeolocation } from '../../src/lib/geo';
import { isStoreOpenNow } from '../../src/lib/hours';
import { PAGE_SIZE, usePaginatedList } from '../../src/lib/usePaginatedList';
import { readJSON, writeJSON } from '../../src/lib/storage';

const CATEGORIES = ['All', 'Grocery', 'Bookstore', 'Electronics', 'Cafe', 'Bakery', 'Apparel', 'General'];
const DISPLAY_MODE_KEY = 'storedash_mobile_store_display_mode';
type DisplayMode = 'list' | 'grid';

function StoreDetailSheet({ store, distanceKm, onClose }: { store: Store; distanceKm: number | null; onClose: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const openNow = isStoreOpenNow(store.openingHours);

  return (
    <FadeInView key={store.id} style={[sheetStyles.sheet, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}>
      <AnimatedPressable
        onPress={onClose}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        style={[sheetStyles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
      >
        <X size={15} color="#fff" />
      </AnimatedPressable>
      <View style={sheetStyles.row}>
        <View style={[sheetStyles.imageWrap, { backgroundColor: colors.gray100 }]}>
          {store.imageUrl ? (
            <Image source={{ uri: store.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <StoreIcon size={22} color={colors.gray400} />
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={[sheetStyles.name, { color: colors.gray900 }]}>
              {store.name}
            </Text>
            <OpenClosedBadge open={openNow} />
          </View>
          <Text style={[sheetStyles.meta, { color: colors.accent }]}>{store.category}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} color={colors.gray500} />
            <Text numberOfLines={1} style={[sheetStyles.meta, { color: colors.gray500 }]}>
              {distanceKm !== null ? `${distanceKm} km away` : store.address}
            </Text>
          </View>
        </View>
      </View>
      <View style={sheetStyles.actions}>
        <AnimatedPressable haptics onPress={() => router.push(`/stores/${store.id}`)} style={[sheetStyles.primaryBtn, { backgroundColor: colors.primary }]}>
          <Text style={sheetStyles.primaryBtnText}>View Store</Text>
        </AnimatedPressable>
        <AnimatedPressable
          haptics
          onPress={() => Linking.openURL(directionsUrl(store))}
          style={[sheetStyles.secondaryBtn, { backgroundColor: colors.gray100 }]}
        >
          <Navigation size={14} color={colors.gray800} />
          <Text style={[sheetStyles.secondaryBtnText, { color: colors.gray800 }]}>Directions</Text>
        </AnimatedPressable>
        {store.phone && (
          <AnimatedPressable haptics onPress={() => Linking.openURL(`tel:${store.phone}`)} style={[sheetStyles.iconBtn, { backgroundColor: colors.gray100 }]}>
            <Phone size={16} color={colors.gray800} />
          </AnimatedPressable>
        )}
      </View>
    </FadeInView>
  );
}

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const geo = useGeolocation();

  useEffect(() => {
    readJSON<DisplayMode>(DISPLAY_MODE_KEY).then((stored) => {
      if (stored === 'list' || stored === 'grid') setDisplayMode(stored);
    });
  }, []);

  const changeDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode);
    void writeJSON(DISPLAY_MODE_KEY, mode);
  };

  const debouncedSearch = useDebouncedValue(search, 300);

  const { items, loading, loadingMore, error, loadMore, reload } = usePaginatedList(
    (page) => fetchStores({ search: debouncedSearch || undefined, category: category === 'All' ? undefined : category, page, limit: PAGE_SIZE }),
    [debouncedSearch, category],
  );

  const stores = useMemo(() => {
    const list = items;
    if (!geo.coords) return list;
    return [...list].sort((a, b) => {
      if (a.lat === null || a.lng === null) return 1;
      if (b.lat === null || b.lng === null) return -1;
      const da = haversineDistanceKm(geo.coords!.lat, geo.coords!.lng, a.lat, a.lng);
      const db = haversineDistanceKm(geo.coords!.lat, geo.coords!.lng, b.lat, b.lng);
      return da - db;
    });
  }, [items, geo.coords]);

  const distanceFor = (store: Store) =>
    geo.coords && store.lat !== null && store.lng !== null ? haversineDistanceKm(geo.coords.lat, geo.coords.lng, store.lat, store.lng) : null;

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.gray900 }]}>Discover</Text>
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
            <Search size={16} color={colors.gray500} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, city…"
              placeholderTextColor={colors.gray500}
              style={[styles.searchInput, { color: colors.gray900 }]}
            />
            {search.length > 0 && (
              <AnimatedPressable onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={16} color={colors.gray500} />
              </AnimatedPressable>
            )}
          </View>
          <AnimatedPressable
            haptics
            onPress={geo.request}
            disabled={geo.status === 'loading'}
            style={[styles.locateBtn, { backgroundColor: geo.status === 'granted' ? 'rgba(5,150,105,0.15)' : colors.primary }]}
          >
            <Navigation size={17} color={geo.status === 'granted' ? colors.emerald400 : '#fff'} />
          </AnimatedPressable>
        </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <AnimatedPressable
              haptics
              onPress={() => setCategory(item)}
              style={[styles.chip, { backgroundColor: category === item ? colors.primary : colors.gray100 }]}
            >
              <Text style={[styles.chipText, { color: category === item ? '#fff' : colors.gray600 }]}>{item}</Text>
            </AnimatedPressable>
          )}
        />

        {geo.errorMessage && (
          <View style={styles.geoError}>
            <AlertCircle size={13} color={colors.amber400} />
            <Text style={[styles.geoErrorText, { color: colors.amber400 }]}>{geo.errorMessage}</Text>
          </View>
        )}
      </View>

      <View style={styles.resultsBar}>
        <Text style={[styles.resultsCount, { color: colors.gray500 }]}>
          {loading ? 'Searching…' : `${stores.length} store${stores.length === 1 ? '' : 's'}`}
        </Text>
        <View style={styles.resultsControls}>
          {view === 'list' && (
            <View style={[styles.segment, { backgroundColor: colors.gray100 }]}>
              <AnimatedPressable
                onPress={() => changeDisplayMode('list')}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                style={[styles.segmentIconBtn, displayMode === 'list' && { backgroundColor: colors.surface }]}
              >
                <ListIcon size={14} color={displayMode === 'list' ? colors.gray900 : colors.gray500} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => changeDisplayMode('grid')}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                style={[styles.segmentIconBtn, displayMode === 'grid' && { backgroundColor: colors.surface }]}
              >
                <LayoutGrid size={14} color={displayMode === 'grid' ? colors.gray900 : colors.gray500} />
              </AnimatedPressable>
            </View>
          )}
          <View style={[styles.segment, { backgroundColor: colors.gray100 }]}>
            <AnimatedPressable onPress={() => setView('list')} style={[styles.segmentBtn, view === 'list' && { backgroundColor: colors.surface }]}>
              <ListIcon size={14} color={view === 'list' ? colors.gray900 : colors.gray500} />
              <Text style={[styles.segmentText, { color: view === 'list' ? colors.gray900 : colors.gray500 }]}>List</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => setView('map')} style={[styles.segmentBtn, view === 'map' && { backgroundColor: colors.surface }]}>
              <MapIcon size={14} color={view === 'map' ? colors.gray900 : colors.gray500} />
              <Text style={[styles.segmentText, { color: view === 'map' ? colors.gray900 : colors.gray500 }]}>Map</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>

      {view === 'list' ? (
        <>
          {loading && (
            <View>
              {Array.from({ length: 5 }).map((_, i) => (
                <StoreCardSkeleton key={i} />
              ))}
            </View>
          )}
          {!loading && error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && stores.length === 0 && (
            <EmptyState icon={ShoppingBag} title="No stores match your search" description="Try a different search term or category." />
          )}
          {!loading && !error && stores.length > 0 && (
            <FlatList
              key={displayMode}
              data={stores}
              numColumns={displayMode === 'grid' ? 2 : 1}
              keyExtractor={(s) => String(s.id)}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={displayMode === 'grid' ? styles.gridRow : undefined}
              ItemSeparatorComponent={displayMode === 'list' ? () => <View style={{ height: 10 }} /> : undefined}
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null}
              renderItem={({ item, index }) => (
                <FadeInView index={index} style={displayMode === 'grid' ? styles.gridItem : undefined}>
                  <StoreCard
                    store={item}
                    distanceKm={distanceFor(item)}
                    onPress={() => router.push(`/stores/${item.id}`)}
                    layout={displayMode}
                  />
                </FadeInView>
              )}
            />
          )}
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <StoreMapView
            stores={stores}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            userLocation={geo.coords}
            onLocateMe={geo.request}
            locating={geo.status === 'loading'}
          />
          {selectedStore && (
            <View style={styles.sheetWrap}>
              <StoreDetailSheet store={selectedStore} distanceKm={distanceFor(selectedStore)} onClose={() => setSelectedStoreId(null)} />
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  locateBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  geoError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geoErrorText: {
    fontSize: 11,
    flex: 1,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  segmentIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 28,
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    marginBottom: 10,
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    zIndex: 10,
    elevation: 10,
  },
});

const sheetStyles = StyleSheet.create({
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: -10,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imageWrap: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
