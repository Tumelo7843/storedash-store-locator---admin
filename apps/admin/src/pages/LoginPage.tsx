import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { env } from '../lib/env';
import { isValidEmail } from '../lib/validation';

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
            href={env.customerUrl}
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
  const { firebaseUser, profile, loading, isAuthorized, signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Signed in, but has no store to manage, isn't a platform admin, or is suspended.
  if (!loading && firebaseUser && profile && !isAuthorized) {
    return <NoAccessCard />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
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

        <form onSubmit={handleSignIn} className="w-full flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="input" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                Forgot password?
              </Link>
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

        <div className="flex items-center gap-3 w-full">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleSubmitting || loading}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {googleSubmitting ? 'Signing in…' : 'Continue with Google'}
        </button>
        <p className="text-[11px] text-gray-400 text-center -mt-2">
          Google sign-in only grants access if your account has already been approved as a store owner or admin.
        </p>

        {env.customerUrl && (
          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100 w-full">
            Not a store owner yet?{' '}
            <a href={env.customerUrl} className="font-bold text-primary hover:underline">
              Sign up as a customer and request access
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
