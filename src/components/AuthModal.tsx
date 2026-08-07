import React, { useState } from 'react';
import { X, Lock, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { syncUserWithBackend } from '../lib/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      const profile = await syncUserWithBackend();
      if (profile) {
        onAuthSuccess(profile);
        onClose();
      } else {
        // Fallback user object if backend sync succeeds or provides default
        const fallbackProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || 'admin@example.com',
          name: userCredential.user.displayName || 'Admin User',
          role: 'Administrator',
          avatarUrl: userCredential.user.photoURL || undefined,
        };
        onAuthSuccess(fallbackProfile);
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase sign-in error:', err);
      setErrorMsg(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Admin Sign In</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 text-center">
          <div>
            <div className="size-16 rounded-full bg-blue-50 text-primary flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="size-8" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Authenticate Store Dash</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Sign in with your Google Workspace or Admin credentials secured via Firebase Auth & Cloud SQL.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200 text-left">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer hover:border-gray-400"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Signing In...' : 'Sign In with Google'}</span>
          </button>

          <p className="text-[11px] text-gray-400">
            Protected by Firebase Auth ID Token verification & Cloud SQL RBAC.
          </p>
        </div>
      </div>
    </div>
  );
};
