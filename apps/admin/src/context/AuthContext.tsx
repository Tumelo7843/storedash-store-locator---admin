import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
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

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isAuthorized = Boolean(profile && profile.role !== 'customer' && !profile.suspended);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, isAuthorized, signInWithEmail, signInWithGoogle, sendPasswordReset, signOut, refreshProfile: loadProfile }}
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
