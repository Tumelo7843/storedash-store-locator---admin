import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from '../src/components/AuthScreen';
import { ErrorBanner } from '../src/components/Banner';
import { Button } from '../src/components/Button';
import { Divider, GoogleButton } from '../src/components/GoogleButton';
import { TextField } from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { authErrorMessage } from '../src/lib/authErrors';
import { isValidEmail, passwordError, passwordStrength } from '../src/lib/validation';

const STRENGTH_META: Record<ReturnType<typeof passwordStrength>, { width: `${number}%`; color: string; label: string }> = {
  weak: { width: '33%', color: '#dc2626', label: 'Weak' },
  medium: { width: '66%', color: '#f59e0b', label: 'Medium' },
  strong: { width: '100%', color: '#059669', label: 'Strong' },
};

export default function SignUpScreen() {
  const { signUpWithEmail, signInWithGoogle, googleSignInAvailable } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [emailInUse, setEmailInUse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const strength = form.password ? passwordStrength(form.password) : null;

  const handleSubmit = async () => {
    setError('');
    setEmailInUse(false);
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email address.');
    const pwError = passwordError(form.password);
    if (pwError) return setError(pwError);
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await signUpWithEmail({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() || undefined });
      router.replace('/(tabs)/account');
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/email-already-in-use') {
        setEmailInUse(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/account');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Sign up to place orders and track them across every store."
      footer={
        <Text style={[styles.footerText, { color: colors.gray500 }]}>
          Already have an account?{' '}
          <Link href="/sign-in" asChild>
            <Text style={[styles.link, { color: colors.accent }]}>Sign in</Text>
          </Link>
        </Text>
      }
    >
      {error && <ErrorBanner message={error} />}
      {emailInUse && (
        <View style={[styles.emailInUseBox, { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)' }]}>
          <Text style={[styles.emailInUseText, { color: colors.rose400 }]}>An account with {form.email.trim()} already exists.</Text>
          <View style={styles.emailInUseActions}>
            <View style={{ flex: 1 }}>
              <Button label="Sign in" onPress={() => router.push('/sign-in')} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Reset password" onPress={() => router.push('/forgot-password')} variant="secondary" fullWidth />
            </View>
          </View>
        </View>
      )}

      <View style={{ gap: 14 }}>
        <TextField label="Full name *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} autoComplete="name" />
        <TextField
          label="Email *"
          value={form.email}
          onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label="Phone number (optional)"
          value={form.phone}
          onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
          placeholder="+27 82 123 4567"
          keyboardType="phone-pad"
        />
        <View style={{ gap: 6 }}>
          <TextField
            label="Password *"
            value={form.password}
            onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
            secureTextEntry
            autoComplete="new-password"
            placeholder="At least 7 characters"
          />
          {strength && (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthTrack, { backgroundColor: colors.gray200 }]}>
                <View style={[styles.strengthFill, { width: STRENGTH_META[strength].width, backgroundColor: STRENGTH_META[strength].color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: colors.gray500 }]}>{STRENGTH_META[strength].label}</Text>
            </View>
          )}
        </View>
        <TextField
          label="Confirm password *"
          value={form.confirmPassword}
          onChangeText={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
          secureTextEntry
          autoComplete="new-password"
        />
        <Button label={submitting ? 'Creating account…' : 'Create account'} onPress={handleSubmit} loading={submitting} />
      </View>

      {googleSignInAvailable && (
        <>
          <Divider label="or" />
          <GoogleButton onPress={handleGoogle} disabled={googleSubmitting} label={googleSubmitting ? 'Signing up…' : 'Sign up with Google'} />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
  },
  emailInUseBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  emailInUseText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emailInUseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 999,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
});
