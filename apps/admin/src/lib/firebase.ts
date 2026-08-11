import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, GoogleAuthProvider, getAuth, setPersistence } from 'firebase/auth';
import { env } from './env';

const app = initializeApp(env.firebase);
export const auth = getAuth(app);
// Google sign-in exists here purely so an account that was originally
// created via Google (e.g. this project's first Super Admin) can sign in —
// see AuthContext.tsx and README §23 for why this doesn't weaken the
// email+password requirement: access is gated entirely by the backend-
// verified role/suspended state, never by which provider was used to
// authenticate.
export const googleAuthProvider = new GoogleAuthProvider();

// Explicit local persistence: an admin stays signed in across browser
// restarts, not just tab refreshes.
void setPersistence(auth, browserLocalPersistence);
