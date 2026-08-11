function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
  // Full URL of a customer-app page (e.g. https://shop.example.com/account or
  // .../become-a-store-owner), used as-is (no path appended) for the
  // "Sign up as a customer / request store owner access" links shown to a
  // signed-in-but-unauthorized user. Optional — links are hidden if unset.
  customerUrl: import.meta.env.VITE_CUSTOMER_URL || '',
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: required('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: required('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
  },
};
