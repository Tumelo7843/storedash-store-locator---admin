import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { env } from '../lib/env';

function NoAccessCard() {
  const { profile, signOut } = useAuth();
  const suspended = profile?.suspended;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-8 text-center flex flex-col items-center gap-4">
        <div className="size-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
          <AlertCircle className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{suspended ? 'Account suspended' : 'No store access'}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {suspended
              ? `Your account (${profile?.email}) has been suspended by a platform administrator. Contact them if you think this is a mistake.`
              : `Your account (${profile?.email}) isn't set up as a store owner or admin yet.`}
          </p>
        </div>
        {!suspended && env.customerUrl && (
          <a
            href={`${env.customerUrl}/become-a-store-owner`}
            className="w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold"
          >
            Request store-owner access
          </a>
        )}
        <button onClick={signOut} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold">
          Sign out
        </button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { firebaseUser, profile, loading, isAuthorized, signInWithEmail, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Signed in, but has no store to manage, isn't a platform admin, or is suspended.
  if (!loading && firebaseUser && profile && !isAuthorized) {
    return <NoAccessCard />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?" again.');
      return;
    }
    setError('');
    setResetSent(false);
    try {
      await sendPasswordReset(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-8 flex flex-col items-center gap-5">
        <div className="size-16 rounded-full bg-blue-50 text-primary flex items-center justify-center">
          <ShieldCheck className="size-8" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-gray-900">StoreDash Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your store's products, services, and orders.</p>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg px-3 py-2 w-full text-center">{error}</p>}
        {resetSent && (
          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 w-full text-center">
            If an account exists for {email}, a password reset link is on its way.
          </p>
        )}

        <form onSubmit={handleSignIn} className="w-full flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="input" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">Password</label>
              <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="input"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {env.customerUrl && (
          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100 w-full">
            Not a store owner yet?{' '}
            <a href={`${env.customerUrl}/become-a-store-owner`} className="font-bold text-primary hover:underline">
              Sign up as a customer and request access
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
