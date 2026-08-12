import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { getMe, syncProfile, type ManagedProfile } from '../lib/api';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: ManagedProfile | null;
  loading: boolean;
  // A signed-in user who manages no stores, isn't a super_admin, or has been
  // suspended — the account exists (e.g. they've ordered as a customer
  // elsewhere) but has no reason to be in this app. The backend would reject
  // every admin call for them anyway; this just avoids showing an empty,
  // broken dashboard. Suspension is enforced server-side regardless (every
  // API call 403s via requireAuth) — this is UX only.
  isAuthorized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  // Google is offered as an ALTERNATIVE to email+password (not a replacement
  // for it) purely so an account originally created via Google — e.g. this
  // project's first Super Admin — can still sign in here. It grants nothing
  // by itself: isAuthorized below still comes from the backend-verified role,
  // computed identically regardless of which provider produced the token.
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  // Reauthenticates with the current password, then sets the new one in one
  // call — Firebase rejects a bare updatePassword() with
  // auth/requires-recent-login unless the session is fresh, so this always
  // proves the current password first rather than reacting to that error.
  // Only meaningful for a password-provider account (see providerHasPassword).
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  // Whether the signed-in Firebase user has a password sign-in method at all
  // (false for a Google-only account) — determines whether Settings shows
  // the change-password form or a "send a reset link" fallback instead.
  providerHasPassword: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ManagedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      await syncProfile();
      setProfile(await getMe());
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser?.email) throw new Error('No signed-in email account');
    await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email, currentPassword));
    await firebaseUpdatePassword(firebaseUser, newPassword);
  };

  const providerHasPassword = Boolean(firebaseUser?.providerData.some((p) => p.providerId === 'password'));

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isAuthorized = Boolean(profile && profile.role !== 'customer' && !profile.suspended);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        isAuthorized,
        signInWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        changePassword,
        providerHasPassword,
        signOut,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
