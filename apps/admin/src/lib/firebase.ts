import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { env } from './env';

const app = initializeApp(env.firebase);
export const auth = getAuth(app);

// Explicit local persistence: an admin stays signed in across browser
// restarts, not just tab refreshes.
void setPersistence(auth, browserLocalPersistence);
