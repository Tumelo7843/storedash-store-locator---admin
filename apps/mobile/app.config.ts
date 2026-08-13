import type { ExpoConfig } from 'expo/config';

// PLACEHOLDER — replace with your real reverse-DNS identifiers before
// publishing (Play Console requires a package name you own/control and
// cannot ever change post-publish).
const ANDROID_PACKAGE = 'com.storedash.mobile';
const IOS_BUNDLE_ID = 'com.storedash.mobile';

const config: ExpoConfig = {
  name: 'StoreDash',
  slug: 'storedash-mobile',
  scheme: 'storedash',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: IOS_BUNDLE_ID,
    supportsTablet: true,
    config: {
      // PLACEHOLDER — Google Cloud Console > APIs & Services > Credentials.
      // Only needed if you also build for iOS; leave blank for Android-only.
      googleMapsApiKey: process.env.IOS_GOOGLE_MAPS_API_KEY || '',
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'StoreDash uses your location to show nearby stores and sort them by distance.',
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      backgroundColor: '#7c3aed',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        // PLACEHOLDER — Google Cloud Console > APIs & Services > Credentials.
        // Required for the store map (react-native-maps) to render on
        // Android; without it the map screen shows a blank/greyed map.
        apiKey: process.env.ANDROID_GOOGLE_MAPS_API_KEY || '',
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-image',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#7c3aed',
        dark: {
          image: './assets/splash-icon.png',
          backgroundColor: '#0d0b12',
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'StoreDash uses your location to show nearby stores and sort them by distance.',
      },
    ],
    '@react-native-google-signin/google-signin',
  ],
  extra: {
    // Set by `eas build:configure` (links this project to
    // https://expo.dev/accounts/tumelobokote/projects/storedash-mobile).
    // Required for EAS Build + Updates.
    eas: {
      projectId: 'ba9584a0-168f-4c5d-a3cf-c7031addcb96',
    },
  },
};

export default config;
