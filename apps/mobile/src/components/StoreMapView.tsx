import type { Store } from '@storedash/shared';
import { LocateFixed } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

interface StoreMapViewProps {
  stores: Store[];
  selectedStoreId: number | null;
  onSelectStore: (id: number) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe: () => void;
  locating: boolean;
}

const FALLBACK_REGION = {
  // South Africa-centered fallback so the map isn't stranded at (0,0) before
  // any store or user location is known.
  latitude: -28.4793,
  longitude: 24.6727,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export function StoreMapView({ stores, selectedStoreId, onSelectStore, userLocation, onLocateMe, locating }: StoreMapViewProps) {
  const { colors, resolvedTheme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const located = stores.filter((s) => s.lat !== null && s.lng !== null);

  useEffect(() => {
    if (!selectedStoreId) return;
    const store = located.find((s) => s.id === selectedStoreId);
    if (store) {
      mapRef.current?.animateToRegion(
        { latitude: store.lat!, longitude: store.lng!, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        350,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  useEffect(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 },
        400,
      );
    }
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={FALLBACK_REGION}
        userInterfaceStyle={resolvedTheme}
        showsUserLocation={Boolean(userLocation)}
        showsMyLocationButton={false}
      >
        {located.map((store) => (
          <Marker
            key={store.id}
            coordinate={{ latitude: store.lat!, longitude: store.lng! }}
            pinColor={store.id === selectedStoreId ? colors.primary : undefined}
            tracksViewChanges={false}
            onPress={() => onSelectStore(store.id)}
          />
        ))}
      </MapView>

      <AnimatedPressable
        haptics
        onPress={onLocateMe}
        style={[styles.locateBtn, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}
      >
        {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <LocateFixed size={20} color={colors.primary} />}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  locateBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
