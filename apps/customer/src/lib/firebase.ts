import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, GoogleAuthProvider, getAuth, setPersistence } from 'firebase/auth';
import { env } from './env';

const app = initializeApp(env.firebase);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Explicit local persistence: a signed-in customer stays signed in across
// browser restarts, not just tab refreshes (Firebase's default for web, but
// set explicitly so it's not silently dependent on an SDK default).
void setPersistence(auth, browserLocalPersistence);
