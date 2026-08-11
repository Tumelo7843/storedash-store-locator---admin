function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
  // Full URL of the admin app's sign-in page (e.g. https://admin.example.com/login),
  // used as-is (no path appended) for the "Admin sign in" link on the auth
  // pages. Optional — the link is hidden if unset. See apps/customer/.env.
  adminUrl: import.meta.env.VITE_ADMIN_URL || '',
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: required('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: required('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
  },
};
