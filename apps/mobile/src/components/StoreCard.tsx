import type { Store } from '@storedash/shared';
import { Image } from 'expo-image';
import { MapPin, Navigation, Phone, Store as StoreIcon } from 'lucide-react-native';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatDistance } from '../lib/geo';
import { isStoreOpenNow } from '../lib/hours';
import { AnimatedPressable } from './AnimatedPressable';
import { OpenClosedBadge } from './Badge';

export function directionsUrl(store: Store): string {
  const destination = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.postalCode}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function StoreCard({ store, distanceKm, onPress, selected }: { store: Store; distanceKm: number | null; onPress: () => void; selected?: boolean }) {
  const { colors } = useTheme();
  const openNow = isStoreOpenNow(store.openingHours);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? `${colors.primary}14` : colors.surface,
          borderColor: selected ? colors.primary : colors.gray100,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.imageWrap, { backgroundColor: colors.gray100 }]}>
          {store.imageUrl ? (
            <Image source={{ uri: store.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <StoreIcon size={22} color={colors.gray400} />
          )}
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.gray900 }]}>
              {store.name}
            </Text>
            <OpenClosedBadge open={openNow} />
          </View>
          <Text numberOfLines={1} style={[styles.meta, { color: colors.gray500 }]}>
            {store.category} · {store.city}, {store.state}
          </Text>
          <View style={styles.addressRow}>
            <MapPin size={12} color={colors.gray400} />
            <Text numberOfLines={1} style={[styles.address, { color: colors.gray500 }]}>
              {distanceKm !== null ? formatDistance(distanceKm) + ' away' : store.lat === null ? 'Location not available' : store.address}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.gray100 }]}>
        {store.phone && (
          <AnimatedPressable
            haptics
            onPress={() => Linking.openURL(`tel:${store.phone}`)}
            style={[styles.actionBtn, { backgroundColor: colors.gray100 }]}
          >
            <Phone size={13} color={colors.gray700} />
            <Text style={[styles.actionText, { color: colors.gray700 }]}>Call</Text>
          </AnimatedPressable>
        )}
        <AnimatedPressable
          haptics
          onPress={() => Linking.openURL(directionsUrl(store))}
          style={[styles.actionBtn, { backgroundColor: colors.gray100 }]}
        >
          <Navigation size={13} color={colors.gray700} />
          <Text style={[styles.actionText, { color: colors.gray700 }]}>Directions</Text>
        </AnimatedPressable>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  meta: {
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 12,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
