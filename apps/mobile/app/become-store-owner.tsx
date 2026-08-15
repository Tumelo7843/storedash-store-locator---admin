import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, ShieldCheck, Store as StoreIcon, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchMyApplications, submitStoreOwnerApplication, type StoreOwnerApplicationInput } from '../src/api/applications';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { ErrorState, Spinner } from '../src/components/ErrorState';
import { Screen } from '../src/components/Screen';
import { TextField } from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { env } from '../src/lib/env';
import { useAsync } from '../src/lib/useAsync';
import type { StoreOwnerApplication } from '@storedash/shared';

const EMPTY_FORM: StoreOwnerApplicationInput = {
  businessName: '',
  category: 'General',
  description: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'South Africa',
  phone: '',
  email: '',
};

function StatusBanner({ application }: { application: StoreOwnerApplication }) {
  const { colors } = useTheme();
  if (application.status === 'pending') {
    return (
      <View style={[styles.banner, { backgroundColor: 'rgba(180,83,9,0.08)', borderColor: 'rgba(180,83,9,0.2)' }]}>
        <Clock size={18} color={colors.amber400} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.bannerTitle, { color: colors.gray900 }]}>Application pending review</Text>
          <Text style={[styles.bannerText, { color: colors.gray500 }]}>
            Thanks for applying! The StoreDash team is reviewing your application for {application.businessName}. We'll notify you by email once a
            decision is made.
          </Text>
        </View>
      </View>
    );
  }
  if (application.status === 'approved') {
    return (
      <View style={[styles.banner, { backgroundColor: 'rgba(5,150,105,0.08)', borderColor: 'rgba(5,150,105,0.2)' }]}>
        <CheckCircle2 size={18} color={colors.emerald400} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ gap: 3 }}>
            <Text style={[styles.bannerTitle, { color: colors.gray900 }]}>You're approved!</Text>
            <Text style={[styles.bannerText, { color: colors.gray500 }]}>
              {application.businessName} is live on StoreDash and you're now a store owner. Manage your store's products, services, and orders from the
              StoreDash admin dashboard on the web.
            </Text>
          </View>
          {env.adminUrl && (
            <AnimatedPressable
              haptics
              onPress={() => Linking.openURL(env.adminUrl)}
              style={[styles.adminLinkBtn, { backgroundColor: colors.emerald400 }]}
            >
              <ExternalLink size={14} color="#fff" />
              <Text style={styles.adminLinkText}>Go to admin dashboard</Text>
            </AnimatedPressable>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.banner, { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)' }]}>
      <XCircle size={18} color={colors.rose400} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.bannerTitle, { color: colors.gray900 }]}>Application not approved</Text>
        <Text style={[styles.bannerText, { color: colors.gray500 }]}>
          Your application for {application.businessName} wasn't approved{application.rejectionReason ? `: ${application.rejectionReason}` : '.'} You're
          welcome to review the details and submit a new application below.
        </Text>
      </View>
    </View>
  );
}

function ApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { colors } = useTheme();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof StoreOwnerApplicationInput) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await submitStoreOwnerApplication(form);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Could not submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
      {error && <Text style={{ fontSize: 12, fontWeight: '700', color: colors.rose400 }}>{error}</Text>}
      <TextField label="Business name *" value={form.businessName} onChangeText={set('businessName')} />
      <TextField label="Category *" value={form.category} onChangeText={set('category')} placeholder="Grocery, Fashion, Electronics…" />
      <TextField label="Business phone *" value={form.phone} onChangeText={set('phone')} placeholder="+27 82 123 4567" keyboardType="phone-pad" />
      <TextField label="Business email *" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Description" value={form.description} onChangeText={set('description')} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
      <TextField label="Street address *" value={form.address} onChangeText={set('address')} />
      <TextField label="City *" value={form.city} onChangeText={set('city')} />
      <TextField label="Province *" value={form.state} onChangeText={set('state')} placeholder="Gauteng" />
      <TextField label="Postal code *" value={form.postalCode} onChangeText={set('postalCode')} />
      <TextField label="Country" value={form.country} onChangeText={set('country')} />
      <Button label={submitting ? 'Submitting…' : 'Submit application'} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

export default function BecomeStoreOwnerScreen() {
  const { profile, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const query = useAsync(() => (profile ? fetchMyApplications() : Promise.resolve([])), [profile?.id]);

  const applications = query.data ?? [];
  const latest = applications[0];
  const showForm = !latest || latest.status === 'rejected';

  return (
    <Screen>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Become a Store Owner</Text>
        <View style={{ width: 34 }} />
      </View>

      {(authLoading || (profile && query.loading)) && <Spinner />}

      {!authLoading && !profile && (
        <EmptyState
          icon={StoreIcon}
          title="Sign in first"
          description="Sign in to your StoreDash account to apply for store-owner access."
          action={
            <View style={{ width: 160, marginTop: 8 }}>
              <Button label="Sign in" onPress={() => router.push('/sign-in')} />
            </View>
          }
        />
      )}

      {profile && !query.loading && query.error && <ErrorState message={query.error} onRetry={query.reload} />}

      {profile && !query.loading && !query.error && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: colors.gray500 }]}>
            Tell us about your business. A StoreDash administrator will review your application and, once approved, you'll be able to manage your
            store's products, services, and orders from the admin dashboard.
          </Text>
          {latest && <StatusBanner application={latest} />}
          {showForm && <ApplicationForm onSubmitted={query.reload} />}
        </ScrollView>
      )}
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
    gap: 16,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
  },
  banner: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 17,
  },
  adminLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  adminLinkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
});
