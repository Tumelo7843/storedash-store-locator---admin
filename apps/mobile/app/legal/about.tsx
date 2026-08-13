import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, ShieldCheck, Trash2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/context/ThemeContext';

function InfoCard({ icon: Icon, title, body }: { icon: typeof MapPin; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
      <View style={styles.cardHeader}>
        <Icon size={16} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.gray900 }]}>{title}</Text>
      </View>
      <Text style={[styles.cardBody, { color: colors.gray600 }]}>{body}</Text>
    </View>
  );
}

export default function AboutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>About & Permissions</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.gray900 }]}>StoreDash</Text>
          <Text style={[styles.appVersion, { color: colors.gray500 }]}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>

        <InfoCard
          icon={MapPin}
          title="Location"
          body="StoreDash asks for your location, when you choose to share it, to sort nearby stores by distance and show your position on the map. Your location is only used on your device to sort and display results — it is never stored on our servers or shared with stores. You can deny or revoke this permission at any time in your device's system settings, and the app remains fully usable without it (you'll just see stores unsorted by distance)."
        />

        <InfoCard
          icon={ShieldCheck}
          title="Your account data"
          body="Your name, email, phone number, and order history are stored so you can track past orders and so stores can fulfill orders you place. See the Privacy Policy for full details on what's collected and why."
        />

        <InfoCard
          icon={Trash2}
          title="Deleting your data"
          body="You can permanently delete your account from Account > Manage profile > Delete account. This removes your personal identifying information immediately. Past order records may be kept in an anonymized form for the store's own bookkeeping — your name, email, and phone are stripped from them."
        />
      </ScrollView>
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
    paddingBottom: 40,
  },
  appInfo: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
  },
  appVersion: {
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 18,
  },
});
