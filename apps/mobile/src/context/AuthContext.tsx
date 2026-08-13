import type { UserProfile } from '@storedash/shared';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as updateFirebasePassword,
  updateProfile as updateFirebaseProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { env } from '../lib/env';
import { deleteMyAccount, syncProfile, updateMyProfile } from '../api/auth';

if (env.googleWebClientId) {
  GoogleSignin.configure({ webClientId: env.googleWebClientId });
}

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
  googleSignInAvailable: boolean;
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

async function googleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response) || !response.data.idToken) {
    throw new Error('Google sign-in was cancelled.');
  }
  return response.data.idToken;
}

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
    // confirmation — phone sign-in itself is handled on its own screen using
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
  // separate "check first" step. Everything after that call is best-effort:
  // once the Firebase account exists, sign-up must not appear to "fail" and
  // strand the user in a state where the account exists but they don't know
  // it. Profile sync retries automatically via onAuthStateChanged -> loadProfile.
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
    const idToken = await googleIdToken();
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await GoogleSignin.signOut().catch(() => undefined);
  };

  // Sensitive operations (change email/password, delete account) require a
  // "recently signed in" session — Firebase rejects them with
  // auth/requires-recent-login otherwise. For password/Google accounts this
  // re-proves identity transparently; a phone-only account has no equivalent
  // one-call re-proof here, so it throws a clear error instead (the profile
  // screen tells the user to sign out and back in).
  const reauthenticate = async (currentPassword?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    const providerId = user.providerData[0]?.providerId;
    if (providerId === 'google.com') {
      const idToken = await googleIdToken();
      await reauthenticateWithCredential(user, GoogleAuthProvider.credential(idToken));
    } else if (providerId === 'password') {
      if (!user.email || !currentPassword) throw new Error('Enter your current password to continue.');
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    } else {
      throw new Error('Please sign out and sign back in with your phone number, then try again.');
    }
  };

  // verifyBeforeUpdateEmail (not the older updateEmail) emails a
  // verification link to the NEW address; the address only actually changes
  // once that link is clicked, and the backend picks up the new email
  // automatically on the next syncProfile() after that happens.
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
  // as part of this call — not the client — so there's no window where a
  // still-valid ID token could "resurrect" the account via requireAuth's
  // lazy re-provisioning. All that's left client-side is clearing local state.
  const deleteAccount = async () => {
    const result = await deleteMyAccount();
    await firebaseSignOut(auth).catch(() => undefined);
    await GoogleSignin.signOut().catch(() => undefined);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        googleSignInAvailable: Boolean(env.googleWebClientId),
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
