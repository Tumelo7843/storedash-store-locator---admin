import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from '../src/components/AuthScreen';
import { ErrorBanner } from '../src/components/Banner';
import { Button } from '../src/components/Button';
import { Divider, GoogleButton } from '../src/components/GoogleButton';
import { TextField } from '../src/components/TextField';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { authErrorMessage } from '../src/lib/authErrors';
import { isValidEmail } from '../src/lib/validation';
import { Link } from 'expo-router';

function EmailSignIn() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Please enter a valid email address.');
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)/account');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      {error && <ErrorBanner message={error} />}
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <View style={{ gap: 6 }}>
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <Link href="/forgot-password" asChild>
          <AnimatedPressable style={{ alignSelf: 'flex-end' }}>
            <ForgotLink />
          </AnimatedPressable>
        </Link>
      </View>
      <Button label={submitting ? 'Signing in…' : 'Sign in'} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

function ForgotLink() {
  const { colors } = useTheme();
  return <Text style={[styles.link, { color: colors.accent }]}>Forgot password?</Text>;
}

export default function SignInScreen() {
  const { signInWithGoogle, googleSignInAvailable } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

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
      title="Sign in to StoreDash"
      subtitle="Welcome back — sign in to order and track your purchases."
      footer={
        <Text style={[styles.footerText, { color: colors.gray500 }]}>
          New here?{' '}
          <Link href="/sign-up" asChild>
            <Text style={[styles.link, { color: colors.accent }]}>Create an account</Text>
          </Link>
        </Text>
      }
    >
      {error && <ErrorBanner message={error} />}

      <EmailSignIn />

      {googleSignInAvailable && (
        <>
          <Divider label="or" />
          <GoogleButton onPress={handleGoogle} disabled={googleSubmitting} label={googleSubmitting ? 'Signing in…' : 'Continue with Google'} />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
