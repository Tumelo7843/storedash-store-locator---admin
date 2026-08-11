import type { UserProfile } from '@storedash/shared';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword as updateFirebasePassword,
  updateProfile as updateFirebaseProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { deleteMyAccount, syncProfile, updateMyProfile } from '../lib/api';

interface SignUpParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUpWithEmail: (params: SignUpParams) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Profile management (Account > Manage Profile). All of these operate on
  // `auth.currentUser` only — there is no way to target another account.
  reauthenticate: (currentPassword?: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  deleteAccount: () => Promise<{ hardDeleted: boolean }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setProfile(await syncProfile());
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Fires on sign-in, sign-out, token refresh, AND after phone-auth OTP
    // confirmation — phone sign-in itself is handled on its own page using
    // the same shared `auth` instance, so this listener is the single place
    // that reacts to it, no separate wiring needed there.
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

  // Firebase's own createUserWithEmailAndPassword is what actually prevents
  // a duplicate account (throws auth/email-already-in-use) — there is no
  // separate "check first" step to add on top of that (see README §23 for
  // why a pre-check via fetchSignInMethodsForEmail would be both redundant
  // and unreliable on a project with email-enumeration protection enabled,
  // which this one has). Everything after that call is best-effort: once the
  // Firebase account exists, sign-up must not appear to "fail" and strand the
  // user in a state where the account exists but they don't know it (they'd
  // hit email-already-in-use on any retry, confusingly). Profile sync retries
  // automatically via onAuthStateChanged -> loadProfile regardless.
  const signUpWithEmail = async ({ name, email, password, phone }: SignUpParams) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateFirebaseProfile(credential.user, { displayName: name }).catch(() => undefined);
    await syncProfile().catch(() => undefined);
    await updateMyProfile({ name, ...(phone ? { phone } : {}) }).catch(() => undefined);
    void sendEmailVerification(credential.user).catch(() => undefined);
    await loadProfile();
  };

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

  // Sensitive operations (change email/password, delete account) require a
  // "recently signed in" session — Firebase rejects them with
  // auth/requires-recent-login otherwise. For password/Google accounts this
  // re-proves identity transparently; a phone-only account has no equivalent
  // one-call re-proof here, so it throws a clear error instead of silently
  // doing nothing (the profile page tells the user to sign out and back in).
  const reauthenticate = async (currentPassword?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    const providerId = user.providerData[0]?.providerId;
    if (providerId === 'google.com') {
      await reauthenticateWithPopup(user, googleAuthProvider);
    } else if (providerId === 'password') {
      if (!user.email || !currentPassword) throw new Error('Enter your current password to continue.');
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    } else {
      throw new Error('Please sign out and sign back in with your phone number, then try again.');
    }
  };

  // verifyBeforeUpdateEmail (not the older updateEmail) is required on this
  // project: updateEmail throws auth/operation-not-allowed once email
  // enumeration protection is enabled (confirmed enabled for this Firebase
  // project — see README §23/§25), which is Firebase's replacement for it.
  // It emails a verification link to the NEW address; the address only
  // actually changes once that link is clicked, and our backend picks up the
  // new email automatically on the next `syncProfile()` after that happens.
  const changeEmail = async (newEmail: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    await verifyBeforeUpdateEmail(user, newEmail);
  };

  const changePassword = async (newPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    await updateFirebasePassword(user, newPassword);
  };

  const resendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    await sendEmailVerification(user);
  };

  // The backend deletes the Firebase Auth account itself (via the Admin SDK)
  // as part of this call — not the client — because a client-side deleteUser
  // afterward would leave a window where the still-valid ID token could
  // "resurrect" the account via requireAuth's lazy re-provisioning before the
  // client got around to calling it. See README §23 and
  // backend/src/services/users.service.ts's deleteOwnAccount for the full
  // reasoning, and what "delete" actually does to the database row (hard
  // delete vs. anonymize) depending on whether the account has order history.
  // All that's left client-side is clearing local state.
  const deleteAccount = async () => {
    const result = await deleteMyAccount();
    await firebaseSignOut(auth).catch(() => undefined);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        signOut,
        refreshProfile: loadProfile,
        reauthenticate,
        changeEmail,
        changePassword,
        resendVerificationEmail,
        deleteAccount,
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
