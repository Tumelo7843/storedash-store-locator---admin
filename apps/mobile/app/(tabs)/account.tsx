import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  FileText,
  Info,
  LogIn,
  LogOut,
  Moon,
  Monitor,
  ShieldCheck,
  Store,
  Sun,
  UserCog,
} from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { SettingsRow, SettingsSection } from '../../src/components/SettingsRow';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme, type ThemePreference } from '../../src/context/ThemeContext';

const ROLE_LABEL: Record<string, string> = {
  store_admin: 'Store Owner',
  super_admin: 'Platform Admin',
};

const THEME_OPTIONS: Array<{ key: ThemePreference; label: string; icon: typeof Sun }> = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
];

export default function AccountScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.gray900 }]}>Account</Text>

        {profile ? (
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}22` }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{(profile.name || profile.email).charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.gray900 }]}>{profile.name || profile.email}</Text>
              <Text style={[styles.profileEmail, { color: colors.gray500 }]}>{profile.email}</Text>
              {profile.role !== 'customer' && (
                <View style={[styles.rolePill, { backgroundColor: `${colors.accent}20` }]}>
                  <ShieldCheck size={11} color={colors.accent} />
                  <Text style={[styles.rolePillText, { color: colors.accent }]}>{ROLE_LABEL[profile.role]}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.signInCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
            <Text style={[styles.signInTitle, { color: colors.gray900 }]}>Sign in to StoreDash</Text>
            <Text style={[styles.signInSubtitle, { color: colors.gray500 }]}>Track orders, save your details, and check out faster.</Text>
            <Button label="Sign in" onPress={() => router.push('/sign-in')} icon={<LogIn size={16} color="#fff" />} />
            <Button label="Create an account" onPress={() => router.push('/sign-up')} variant="secondary" />
          </View>
        )}

        {profile && (
          <SettingsSection title="Account">
            <SettingsRow icon={UserCog} label="Manage profile" onPress={() => router.push('/account/manage')} />
            <SettingsRow icon={Store} label="Become a store owner" onPress={() => router.push('/become-store-owner')} last />
          </SettingsSection>
        )}

        <SettingsSection title="Appearance">
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = preference === opt.key;
              return (
                <AnimatedPressable
                  key={opt.key}
                  haptics
                  onPress={() => setPreference(opt.key)}
                  style={[
                    styles.themeOption,
                    { borderColor: active ? colors.primary : colors.gray200, backgroundColor: active ? `${colors.primary}10` : 'transparent' },
                  ]}
                >
                  <Icon size={18} color={active ? colors.primary : colors.gray600} />
                  <Text style={[styles.themeLabel, { color: active ? colors.primary : colors.gray700 }]}>{opt.label}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon={Info} label="About & permissions" onPress={() => router.push('/legal/about')} />
          <SettingsRow icon={ShieldCheck} label="Privacy policy" onPress={() => router.push('/legal/privacy-policy')} />
          <SettingsRow icon={FileText} label="Terms of service" onPress={() => router.push('/legal/terms')} last />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow label={`App version ${Constants.expoConfig?.version ?? '1.0.0'}`} last />
        </SettingsSection>

        {profile && (
          <View style={{ marginTop: 4 }}>
            <Button label="Sign out" onPress={confirmSignOut} variant="secondary" icon={<LogOut size={16} color={colors.gray900} />} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    paddingTop: 6,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 12,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  signInCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  signInSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
