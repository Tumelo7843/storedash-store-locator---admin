import { formatZAR } from '@storedash/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Clock, Store as StoreIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchService } from '../../src/api/services';
import { fetchStore } from '../../src/api/stores';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState, Spinner } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/context/ThemeContext';
import { useAsync } from '../../src/lib/useAsync';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();

  const serviceQuery = useAsync(() => fetchService(serviceId), [serviceId]);
  const service = serviceQuery.data;
  const storeQuery = useAsync(() => (service ? fetchStore(service.storeId) : Promise.resolve(null)), [service?.storeId]);

  if (serviceQuery.loading) {
    return (
      <Screen>
        <Spinner label="Loading service…" />
      </Screen>
    );
  }
  if (serviceQuery.error) {
    return (
      <Screen>
        <ErrorState message={serviceQuery.error} onRetry={serviceQuery.reload} />
      </Screen>
    );
  }
  if (!service) {
    return (
      <Screen>
        <EmptyState title="Service not found" description="This service may have been removed or is no longer available." />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AnimatedPressable haptics onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.imageWrap, { backgroundColor: colors.gray100 }]}>
          {service.imageUrl ? (
            <Image source={{ uri: service.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <StoreIcon size={40} color={colors.gray400} />
          )}
        </View>

        <View style={{ gap: 6 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.category, { color: colors.gray400 }]}>{service.category}</Text>
            <View style={[styles.availabilityPill, { backgroundColor: service.isActive ? colors.emerald400 : colors.gray400 }]}>
              <Text style={styles.availabilityText}>{service.isActive ? 'Available' : 'Currently unavailable'}</Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.gray900 }]}>{service.name}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{formatZAR(service.price)}</Text>
            {Boolean(service.durationMinutes) && (
              <View style={styles.durationRow}>
                <Clock size={13} color={colors.gray500} />
                <Text style={[styles.duration, { color: colors.gray500 }]}>{service.durationMinutes} min</Text>
              </View>
            )}
          </View>
        </View>

        {service.description && <Text style={[styles.description, { color: colors.gray600 }]}>{service.description}</Text>}

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
    paddingBottom: 40,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 13,
    fontWeight: '600',
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
});
