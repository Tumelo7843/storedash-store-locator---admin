import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, CheckCircle2, Mail, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { updateMyProfile } from '../../src/api/auth';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { ErrorBanner, SuccessBanner } from '../../src/components/Banner';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { authErrorMessage } from '../../src/lib/authErrors';
import { isValidEmail, passwordError } from '../../src/lib/validation';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray100 }]}>
      <Text style={[styles.cardTitle, { color: colors.gray900 }]}>{title}</Text>
      {children}
    </View>
  );
}

function useProvider() {
  const { firebaseUser } = useAuth();
  return firebaseUser?.providerData[0]?.providerId ?? null;
}

function ReauthGate({ onVerified }: { onVerified: () => void }) {
  const { reauthenticate } = useAuth();
  const provider = useProvider();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const attempt = async (currentPassword?: string) => {
    setError('');
    setBusy(true);
    try {
      await reauthenticate(currentPassword);
      onVerified();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (provider === 'google.com') {
    return (
      <View style={{ gap: 8 }}>
        {error && <ErrorBanner message={error} />}
        <Text style={[styles.helperText, { color: colors.gray500 }]}>For your security, please re-verify with Google before continuing.</Text>
        <Button label={busy ? 'Verifying…' : 'Verify with Google'} onPress={() => attempt()} loading={busy} variant="secondary" fullWidth={false} />
      </View>
    );
  }

  if (provider === 'phone') {
    return <Text style={[styles.helperText, { color: colors.amber400 }]}>For your security, please sign out and sign back in with your phone number, then return here to continue.</Text>;
  }

  return (
    <View style={{ gap: 8 }}>
      {error && <ErrorBanner message={error} />}
      <Text style={[styles.helperText, { color: colors.gray500 }]}>For your security, confirm your current password to continue.</Text>
      <TextField placeholder="Current password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      <Button label={busy ? 'Verifying…' : 'Verify'} onPress={() => attempt(password)} loading={busy} />
    </View>
  );
}

function ProfileInfoSection({ onSaved }: { onSaved: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSaved(false);
    if (!name.trim()) return setError('Name cannot be empty.');
    setSaving(true);
    try {
      await updateMyProfile({ name: name.trim(), phone: phone.trim() });
      setSaved(true);
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Profile information">
      {error && <ErrorBanner message={error} />}
      {saved && <SuccessBanner message="Profile updated." />}
      <TextField label="Name" value={name} onChangeText={setName} />
      <TextField label="Phone number" value={phone} onChangeText={setPhone} placeholder="+27 82 123 4567" keyboardType="phone-pad" />
      <Button label={saving ? 'Saving…' : 'Save changes'} onPress={handleSubmit} loading={saving} fullWidth={false} />
    </Card>
  );
}

function EmailVerificationBanner() {
  const { firebaseUser, resendVerificationEmail } = useAuth();
  const { colors } = useTheme();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!firebaseUser || firebaseUser.emailVerified || !firebaseUser.email) return null;

  const handleResend = async () => {
    setError('');
    setSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.verifyBanner, { backgroundColor: 'rgba(180,83,9,0.08)', borderColor: 'rgba(180,83,9,0.2)' }]}>
      <Mail size={16} color={colors.amber400} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.cardTitle, { color: colors.gray900 }]}>Verify your email</Text>
        <Text style={[styles.helperText, { color: colors.gray500 }]}>
          {sent ? 'Verification email sent — check your inbox and spam folder.' : `We sent a verification link to ${firebaseUser.email} when you signed up.`}
        </Text>
        {error && <Text style={{ fontSize: 11, color: colors.rose400 }}>{error}</Text>}
        {!sent && (
          <AnimatedPressable onPress={handleResend} disabled={sending}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.amber400 }}>{sending ? 'Sending…' : 'Resend verification email'}</Text>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

function ChangeEmailSection() {
  const { firebaseUser, changeEmail } = useAuth();
  const { colors } = useTheme();
  const [newEmail, setNewEmail] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const attempt = async () => {
    setError('');
    setSubmitting(true);
    try {
      await changeEmail(newEmail.trim());
      setSent(true);
      setNeedsReauth(false);
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!isValidEmail(newEmail)) return setError('Please enter a valid email address.');
    if (newEmail.trim() === firebaseUser?.email) return setError('That is already your current email.');
    await attempt();
  };

  return (
    <Card title="Change email">
      <Text style={[styles.helperText, { color: colors.gray500 }]}>Current: {firebaseUser?.email}</Text>
      {error && <ErrorBanner message={error} />}
      {sent ? (
        <SuccessBanner message={`We sent a confirmation link to ${newEmail.trim()}. Your email changes once you click it.`} />
      ) : needsReauth ? (
        <ReauthGate onVerified={attempt} />
      ) : (
        <>
          <TextField value={newEmail} onChangeText={setNewEmail} placeholder="new-email@example.com" autoCapitalize="none" keyboardType="email-address" />
          <Button label={submitting ? 'Sending…' : 'Update'} onPress={handleSubmit} loading={submitting} fullWidth={false} />
        </>
      )}
    </Card>
  );
}

function ChangePasswordSection() {
  const { firebaseUser, changePassword, sendPasswordReset } = useAuth();
  const provider = useProvider();
  const { colors } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (provider !== 'password') {
    const handleSetPassword = async () => {
      setError('');
      setSuccess('');
      if (!firebaseUser?.email) return;
      try {
        await sendPasswordReset(firebaseUser.email);
        setSuccess(`We sent a link to ${firebaseUser.email} to set a password for this account.`);
      } catch (err) {
        setError(authErrorMessage(err));
      }
    };
    return (
      <Card title="Password">
        <Text style={[styles.helperText, { color: colors.gray500 }]}>
          You sign in with {provider === 'google.com' ? 'Google' : 'your phone number'} — there's no password to change. You can add one so you can also
          sign in with email + password.
        </Text>
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={success} />}
        <Button label="Email me a link to set a password" onPress={handleSetPassword} variant="secondary" fullWidth={false} />
      </Card>
    );
  }

  const attempt = async () => {
    setError('');
    setSubmitting(true);
    try {
      await changePassword(newPassword);
      setSuccess('Password changed.');
      setNeedsReauth(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    const pwError = passwordError(newPassword);
    if (pwError) return setError(pwError);
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    await attempt();
  };

  return (
    <Card title="Change password">
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}
      {needsReauth ? (
        <ReauthGate onVerified={attempt} />
      ) : (
        <>
          <TextField value={newPassword} onChangeText={setNewPassword} placeholder="New password (min. 7 characters)" secureTextEntry autoComplete="new-password" />
          <TextField value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" secureTextEntry autoComplete="new-password" />
          <Button label={submitting ? 'Saving…' : 'Change password'} onPress={handleSubmit} loading={submitting} fullWidth={false} />
        </>
      )}
    </Card>
  );
}

function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const attempt = async () => {
    setError('');
    setBusy(true);
    try {
      await deleteAccount();
      router.replace('/(tabs)');
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.2)' }]}>
      <View style={styles.dangerTitleRow}>
        <AlertTriangle size={16} color={colors.rose400} />
        <Text style={[styles.cardTitle, { color: colors.rose400 }]}>Delete account</Text>
      </View>
      {!open ? (
        <>
          <Text style={[styles.helperText, { color: colors.gray500 }]}>
            Permanently delete your StoreDash account. This cannot be undone. Order history is kept for the store's records, but your name, email, and
            phone are removed from it.
          </Text>
          <Button label="Delete my account" onPress={() => setOpen(true)} variant="danger" fullWidth={false} icon={<Trash2 size={14} color="#fff" />} />
        </>
      ) : (
        <View style={{ gap: 10 }}>
          {error && <ErrorBanner message={error} />}
          {needsReauth ? (
            <ReauthGate onVerified={attempt} />
          ) : (
            <>
              <Text style={[styles.helperText, { color: colors.gray500 }]}>
                This is permanent. Type <Text style={{ fontWeight: '800' }}>DELETE</Text> to confirm.
              </Text>
              <TextField value={confirmText} onChangeText={setConfirmText} placeholder="DELETE" autoCapitalize="characters" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={busy ? 'Deleting…' : 'Permanently delete'}
                    onPress={attempt}
                    disabled={confirmText !== 'DELETE' || busy}
                    variant="danger"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Cancel" onPress={() => setOpen(false)} variant="secondary" />
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function ManageProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  if (!profile) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray100 }]}>
          <ArrowLeft size={17} color={colors.gray800} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Manage Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EmailVerificationBanner />
        <ProfileInfoSection onSaved={refreshProfile} />
        <ChangeEmailSection />
        <ChangePasswordSection />
        <DeleteAccountSection />

        <View style={styles.footerNote}>
          <CheckCircle2 size={13} color={colors.gray500} />
          <Text style={[styles.footerNoteText, { color: colors.gray500 }]}>Sensitive changes require re-confirming your identity.</Text>
        </View>
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
  },
  verifyBanner: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  dangerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerNoteText: {
    fontSize: 11,
  },
});
