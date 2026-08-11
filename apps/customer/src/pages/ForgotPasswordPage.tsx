import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard, FormError, FormSuccess } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { isValidEmail } from '../lib/validation';

export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
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
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      footer={
        <p className="text-center text-sm text-gray-500">
          Remembered it?{' '}
          <Link to="/sign-in" className="font-bold text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {error && <FormError message={error} />}
      {sent ? (
        <FormSuccess message={`If an account exists for ${email}, a password reset link is on its way. Check your inbox and spam folder.`} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              className="input"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
