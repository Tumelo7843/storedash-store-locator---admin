import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { firebaseUser, profile, loading, isAuthorized, signInWithGoogle, signOut } = useAuth();
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  // Signed in, but has no store to manage and isn't a platform admin.
  if (!loading && firebaseUser && profile && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-8 text-center flex flex-col items-center gap-4">
          <div className="size-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
            <AlertCircle className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">No store access</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your account ({profile.email}) isn't set up as an admin for any store. Ask a store admin to add your email, or contact the platform
              owner.
            </p>
          </div>
          <button onClick={signOut} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-8 flex flex-col items-center gap-5 text-center">
        <div className="size-16 rounded-full bg-blue-50 text-primary flex items-center justify-center">
          <ShieldCheck className="size-8" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">StoreDash Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your store's products, services, and orders.</p>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <button
          onClick={handleSignIn}
          disabled={signingIn || loading}
          className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
