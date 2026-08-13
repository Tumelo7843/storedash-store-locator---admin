import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, initializeAuth } from 'firebase/auth';
// getReactNativePersistence is exported by Firebase's React Native build,
// resolved via Metro's "react-native" package-exports condition (see
// metro.config.js) — but is missing from the platform-agnostic TypeScript
// declarations `firebase/auth` ships, so it type-checks as absent even
// though it exists at runtime. See firebase-js-sdk#9316.
// @ts-expect-error — see comment above
import { getReactNativePersistence } from 'firebase/auth';
import { env } from './env';

const app = getApps().length ? getApps()[0]! : initializeApp(env.firebase);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const googleAuthProvider = new GoogleAuthProvider();
