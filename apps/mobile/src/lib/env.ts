function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  apiUrl: required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
  firebase: {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  },
  // Optional: Google sign-in is disabled (button hidden) if this is unset.
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  // Optional, same "degrade gracefully" pattern as the customer web app's
  // VITE_ADMIN_URL — the "Admin Dashboard" link/row is hidden if this is unset.
  adminUrl: process.env.EXPO_PUBLIC_ADMIN_URL || '',
  // Optional "latest APK" pointer for the Account screen's App Updates card
  // (see src/config/appUpdate.ts). Left unset by default — set per EAS build
  // profile in eas.json, or leave the static fallbacks in appUpdate.ts to
  // edit by hand after a build. Never required, so builds never fail if unset.
  latestApkVersion: process.env.EXPO_PUBLIC_LATEST_APK_VERSION || '',
  latestApkUrl: process.env.EXPO_PUBLIC_LATEST_APK_URL || '',
  latestApkNotes: process.env.EXPO_PUBLIC_LATEST_APK_NOTES || '',
};
