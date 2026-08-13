import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScreen } from '../src/components/AuthScreen';
import { ErrorBanner, SuccessBanner } from '../src/components/Banner';
import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { authErrorMessage } from '../src/lib/authErrors';
import { isValidEmail } from '../src/lib/validation';

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Please enter a valid email address.');
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a link to reset your password."
      footer={
        <Text style={{ fontSize: 13, textAlign: 'center', color: colors.gray500 }}>
          Remembered it?{' '}
          <Link href="/sign-in" asChild>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>Sign in</Text>
          </Link>
        </Text>
      }
    >
      {error && <ErrorBanner message={error} />}
      {sent ? (
        <SuccessBanner message={`We sent a password reset link to ${email.trim()}. Check your inbox and spam folder.`} />
      ) : (
        <View style={{ gap: 14 }}>
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Button label={submitting ? 'Sending…' : 'Send reset link'} onPress={handleSubmit} loading={submitting} />
        </View>
      )}
    </AuthScreen>
  );
}
