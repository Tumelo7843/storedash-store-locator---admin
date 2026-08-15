# StoreDash Mobile
<!-- apk link -->
https://expo.dev/artifacts/eas/Rek-OFV6FJHlDXtPRStAba7evlKDFhkxw_hoWxzVV3g.apk

Native Android/iOS client (Expo + React Native + Expo Router) for the StoreDash platform. It gives
customers the same discovery/ordering experience as [`apps/customer`](../customer) — store map,
products/services, cart, checkout, order history, account management, and the store-owner
application flow — as an installable app instead of a website. It talks to the **same** backend,
database, and Firebase project as `apps/customer` and `apps/admin`; there is no mobile-only API.

See the repo root [README.md](../../README.md) for the full platform architecture (backend,
database, the two web apps, deployment). This document covers everything specific to the mobile
app: setup, environment variables, how auth/API integration works, running locally without an
emulator, building APKs with EAS, and troubleshooting.

## 1. Architecture

```
apps/mobile (Expo Router, React Native)
  app/                     File-based routes (screens) — see §2
  src/
    api/                   Typed fetch wrapper + one file per backend resource (stores, products,
                            services, orders, applications, auth) — hand-written, not generated;
                            mirrors apps/customer/src/lib/api.ts's contract against the same backend
    components/            Reusable UI (buttons, cards, badges, skeletons, the map view, ...)
    context/                AuthContext (Firebase auth + profile sync), CartContext (local-only
                            cart, AsyncStorage-persisted), ThemeContext (light/dark/system)
    lib/                    env.ts (env var validation), firebase.ts (Firebase client init),
                            storage.ts (AsyncStorage JSON helpers), geo.ts, hours.ts, validation.ts,
                            authErrors.ts (Firebase error code -> plain-English message)
    theme/                  Color palettes (light/dark)
  app.config.ts             Expo config (name, bundle/package IDs, plugins, permissions)
  eas.json                  EAS Build profiles (development / preview / production)
  metro.config.js           Monorepo-aware Metro config (resolves ../../shared)
```

**Auth is Firebase-client-side**, exactly like `apps/customer`: sign-up/sign-in/sign-out/password
reset/email change/password change/account deletion all call the `firebase/auth` JS SDK directly
from the device — the backend is never asked to authenticate anyone. The backend's only job is to
**verify** the Firebase ID token on every protected request (`requireAuth` middleware, backend
`src/middleware/auth.ts`) and to store/serve a `users` row keyed by Firebase UID. See root README
§12 for the full authentication vs. authorization model — it's identical across all three clients.

**Data (stores/products/services/orders/applications)** goes through a small typed REST client
(`src/api/*.ts` → `src/api/client.ts`) that calls the backend's existing public and
customer-authenticated routes (`/api/stores`, `/api/products`, `/api/services`, `/api/orders`,
`/api/store-owner-applications`, `/api/auth/*`) — the same routes `apps/customer` uses. There is
no GraphQL layer, no mobile-specific serializer, and no offline/local database — every screen
fetches live from the backend on mount (with `AsyncStorage`-persisted exceptions for the cart and
theme preference only, both purely local/device state that was never meant to sync).

## 2. Screens (Expo Router file-based routing)

```
app/
  _layout.tsx              Root layout — providers (Theme, Auth, Cart), root Stack navigator
  (tabs)/_layout.tsx        Bottom tab bar: Discover, Orders, Cart, Account
  (tabs)/index.tsx          Discover — store list/map toggle, Grid/List store display, search,
                            category filter, geolocation sort
  (tabs)/orders.tsx          Order history (requires sign-in; shows a sign-in prompt otherwise)
  (tabs)/cart.tsx            Cart + checkout (requires sign-in to place the order, not to browse)
  (tabs)/account.tsx         Profile summary, theme picker, admin dashboard link (approved store
                            admins only), legal links, sign-in/out
  stores/[id].tsx            Store detail: info, hours, products/services (tap through to details)
  products/[id].tsx          Product details: image, price, description, store link, add-to-cart
  services/[id].tsx          Service details: image, price, duration, description, store link
  orders/[id].tsx            Order detail
  sign-in.tsx / sign-up.tsx / forgot-password.tsx   Modal auth screens (email + Google)
  account/manage.tsx         Manage profile: name/phone, change email/password, delete account
  become-store-owner.tsx     Store-owner application form + live application status + admin link
                            once approved
  legal/about.tsx, privacy-policy.tsx, terms.tsx
  +not-found.tsx
```

Every screen that requires a signed-in user (`cart` checkout, `orders`, `account/manage`,
`become-store-owner`) checks `useAuth().profile` and renders a sign-in prompt instead of the
protected content when it's `null` — this is a UX convenience, not the real security boundary. The
real boundary is the backend: every write endpoint independently re-verifies the Firebase ID token
and, where relevant, resource ownership (e.g. `GET /api/orders/mine/:id` 403s if the order belongs
to a different user) — so even a modified/rooted client gains nothing by skipping the UI gate.

## 3. Requirements

- Node.js 20+ and npm 10+ (same as the rest of the monorepo)
- An Expo account (free) — [expo.dev/signup](https://expo.dev/signup) — for EAS Build
- `eas-cli` (installed automatically via `npx`, no global install required): `npx eas login`
- The **same Firebase project** already used by `apps/customer` — see §5
- The backend running somewhere reachable from your device/emulator — either the deployed Render
  instance, or your machine's LAN IP if running the backend locally and testing on a physical
  device (`localhost` in `EXPO_PUBLIC_API_URL` will not resolve from a phone)
- **No Android Studio / emulator is required** for anything in this README — every workflow below
  (typecheck, `expo-doctor`, EAS cloud builds, installing the resulting `.apk` on a physical phone)
  works without one. You only need Android Studio if you want a local emulator instead of a
  physical device or EAS's cloud builds.

## 4. Installation

From the **repo root** (this is an npm workspace, not a standalone project):

```bash
npm install
```

This installs `apps/mobile`'s dependencies alongside the backend and both web apps, and wires up
`@storedash/shared` as a local symlink so all four packages share the same TypeScript types.
Running `npm install` from inside `apps/mobile` also works but is unnecessary.

## 5. Environment variables

Copy the example file and fill in real values:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

| Variable | Required | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | yes | Backend base URL, no trailing slash. Use your deployed Render URL, or your machine's LAN IP (`http://192.168.x.x:3001`) if pointing a physical device at a locally-running backend — `localhost` only works from a simulator/emulator running on the same machine as the backend. |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | yes | Firebase Console > Project Settings > General > Your apps > Web app |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | Same place |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | yes | **Must match** `FIREBASE_PROJECT_ID` in `backend/.env` exactly — a mismatch makes every `requireAuth` call fail with 401 with no other symptom |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | no | |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | no | |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | yes | |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | no | OAuth 2.0 **Web application** client ID (Google Cloud Console — the one Firebase auto-created when you enabled Google sign-in), used as `webClientId` by `@react-native-google-signin/google-signin` on **both** platforms. **Not** an Android/iOS client ID. If unset, the Google sign-in button is simply hidden — email sign-in still works fully. |
| `EXPO_PUBLIC_ADMIN_URL` | no | Full URL (including path) of the admin app's sign-in page, e.g. `https://<your-admin-domain>/login` — mirrors the customer web app's `VITE_ADMIN_URL`. Shown as an "Admin Dashboard" row on the Account screen and a link on the "Become a store owner" approval screen, **only** to signed-in users whose profile `role` is `store_admin` or `super_admin` and who are not `suspended`. If unset, those links are simply hidden. Opening it does not grant any permission — the admin app independently authenticates and re-verifies the user's role server-side. |

All of these are `EXPO_PUBLIC_*`, meaning Expo inlines them into the built JS bundle at build
time — same trust model as `apps/customer`'s `VITE_*` variables (see root README §5): they identify
the Firebase project and backend, they don't authenticate as anything, so none of them are secret
in the way a database credential or service-account key is.

**`apps/mobile/src/lib/env.ts` throws immediately at app startup if any variable marked `yes` above
is missing** — this is intentional fail-fast behavior so a misconfigured build fails loudly instead
of silently hitting the wrong backend. See §12 for why this matters specifically for EAS cloud
builds (`.env` is git-ignored and not visible to EAS's build servers unless configured separately —
already done for you in `eas.json`, see §12).

## 6. Firebase configuration

This app must point at the **exact same Firebase project** as `apps/customer` (root README §10) —
it is not a separate Firebase app, just a second registered "Web app" client config under the same
project (Firebase's Web SDK config works fine for Expo/React Native; there's no separate "native"
config needed for the auth methods this app uses).

1. Firebase Console > your existing project > Project Settings > General > Your apps > either reuse
   the existing Web app's config values or register a new Web app specifically for mobile — either
   works, since Web app configs from the same project are interchangeable for auth purposes. Fill
   those into `apps/mobile/.env` (§5).
2. Authentication > Sign-in method: **Email/Password** and **Google** must be enabled (same as
   `apps/customer`). This app does **not** use Firebase Phone Auth (see §14 for why it was removed).
3. Authentication > Settings > **Authorized domains**: no change needed for the app itself (mobile
   auth doesn't go through a browser redirect the way a web OAuth popup does), but if you test
   Google sign-in from an Expo Go/dev-client session that opens a web fallback, the same domains
   list from root README §10 applies.
4. **Google Sign-In on Android additionally requires your build's SHA-1 certificate fingerprint to
   be registered** in the Google Cloud Console OAuth client (not just the Firebase config values) —
   this is a native-platform requirement independent of the JS config and is easy to miss:
   - For an **EAS-managed keystore** (the default — see §12): get the fingerprint with
     `npx eas credentials` (Android > select the profile > "Keystore: Manage everything needed to
     build your project" > shows SHA-1/SHA-256).
   - Add it in Google Cloud Console > APIs & Services > Credentials > your **Android** OAuth 2.0
     client ID (create one if it doesn't exist yet, package name `com.storedash.mobile`) >
     paste the SHA-1.
   - Without this step, Google sign-in fails on a real device/build even though the JS
     `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is configured correctly — the error is on Google's side, not
     this app's, and won't reproduce in a web-based flow.
   - Debug/dev builds and production builds use **different keystores** (unless you set up EAS's
     shared credentials) and therefore have **different SHA-1s** — both need to be registered if you
     want Google sign-in to work in both.

## 7. Backend configuration

No mobile-specific backend configuration exists or is needed — `apps/mobile` calls the exact same
`backend` deployment as `apps/customer`. Point `EXPO_PUBLIC_API_URL` (§5) at:

- The deployed Render backend (`https://storedash-store-locator-admin.onrender.com` or your own
  domain) — works from any network, simplest for testing on a real device.
- Or a locally-running backend (`npm run dev:backend` from the repo root) — only reachable from a
  physical device if you use your machine's LAN IP (not `localhost`) and both devices are on the
  same network; an emulator running on the same machine can usually reach `http://10.0.2.2:3001`
  (Android emulator's alias for the host machine's `localhost`).

`backend/src/index.ts`'s CORS check (`ALLOWED_ORIGINS`) only applies to **browser** requests that
send an `Origin` header — a React Native app's `fetch` calls don't send one, so **no backend CORS
configuration is needed for the mobile app**, unlike the two web apps.

## 8. How authentication works end-to-end

1. User signs up/in via `AuthContext` (`src/context/AuthContext.tsx`), which calls the Firebase JS
   SDK directly (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`,
   `signInWithCredential` with a Google ID token from `@react-native-google-signin/google-signin`).
2. `src/lib/firebase.ts` initializes the Firebase Auth client with
   `getReactNativePersistence(AsyncStorage)` — this is what makes sign-in **persist across app
   restarts**; without it, every cold start would require signing in again.
3. `onAuthStateChanged` (also in `AuthContext.tsx`) fires on sign-in, sign-out, and silent token
   refresh, and calls `POST /api/auth/sync` (`src/api/auth.ts`) to fetch/create the corresponding
   `users` row and load the app's own `UserProfile` (role, phone, etc. — not just the Firebase
   identity) into React state.
4. Every authenticated API call (`src/api/client.ts`'s `request(path, options, withAuth: true)`)
   attaches `Authorization: Bearer <token>` where `token = await auth.currentUser.getIdToken()` —
   the SDK handles refreshing an expired token transparently before returning it.
5. The backend's `requireAuth` middleware verifies that token with the Firebase Admin SDK on every
   request; a missing/expired/invalid token is rejected with 401 before any route handler runs (root
   README §12).

**Sensitive account changes** (change email, change password, delete account) require a "recently
signed in" session — Firebase itself enforces this, not app code — surfaced via
`auth/requires-recent-login` and handled with an inline re-authentication prompt on the Manage
Profile screen (password re-entry, or a fresh Google sign-in, matching whichever provider the
account uses).

## 9. API configuration

`src/lib/env.ts` reads `EXPO_PUBLIC_API_URL`; `src/api/client.ts` builds every request as
`` `${env.apiUrl}${path}` `` (e.g. `/api/stores?search=...`). There is no separate "API config
file" beyond this — one base URL, one auth-header helper, one error-shape parser
(`{ error: { code, message } }`, matching the backend's `errorHandler.ts` exactly), reused by every
file in `src/api/`.

If you need to point the app at a different backend deployment temporarily (staging, a teammate's
local server, etc.), change `EXPO_PUBLIC_API_URL` in `.env` and restart `expo start` — Expo does not
hot-reload environment variable changes.

## 10. Running locally

```bash
cd apps/mobile
npx expo start
```

Then:

- Press **`a`** to open on a connected Android device/emulator, or **`i`** for iOS simulator (macOS
  only), or scan the QR code with the **Expo Go** app on a physical phone for the fastest iteration
  loop.
- **Expo Go limitation**: Expo Go can only run JS — it cannot load custom native modules that
  aren't already bundled inside it. `@react-native-google-signin/google-signin` and
  `react-native-maps` (Google Maps provider) both need a real **development build** (§12), not Expo
  Go, to function on-device. Everything else (all screens, email auth, cart, orders) works fine in
  Expo Go for quick iteration; switch to a development build once you need to test Google sign-in
  or the map.
- The backend (`npm run dev:backend` from the repo root, or the deployed Render URL) must be
  reachable at whatever `EXPO_PUBLIC_API_URL` points to, or every data-loading screen will show an
  error state.

## 11. Creating a preview APK

A **preview** build is a standalone, installable release-configuration APK — no dev menu, no
Metro connection, exactly what a tester would install. Good for "does this actually work on a real
phone" testing without publishing anywhere.

```bash
cd apps/mobile
npx eas login                 # first time only
npx eas build --platform android --profile preview
```

This uploads the project to EAS's cloud build servers (no local Android SDK/Gradle needed) and, on
completion, prints a download link for the `.apk` (also visible at
[expo.dev](https://expo.dev) under your account's `storedash-mobile` project). See §16 to install
it on a device.

## 12. Creating a development build

A **development build** is like Expo Go, but compiled specifically for this project — it includes
the actual native modules (`react-native-maps`, `@react-native-google-signin/google-signin`) that
Expo Go can't load, while still connecting live to your `expo start` Metro server for fast
JS-only iteration (no rebuild needed for JS-only changes).

```bash
cd apps/mobile
npx eas build --platform android --profile development
```

Install the resulting `.apk` on your device (§16), open it, and it will prompt you to connect to a
running `npx expo start` session (scan the QR code or enter the URL manually) — from then on it
behaves like Expo Go but with full native-module support.

### Why the previous development build kept failing to launch

Two independent, compounding problems, both now fixed:

1. **A genuinely broken native dependency.** `expo-firebase-recaptcha` (used only for the phone
   sign-in method, since removed — see §14) depends on `expo-firebase-core@6.0.0`, a package that
   hasn't tracked Expo SDK versions in years. Its Android `build.gradle` pins
   `com.google.firebase:firebase-core:21.1.0` — a Firebase Android artifact **Google discontinued
   around 2020** (folded into `firebase-analytics`) — and Kotlin `1.6.10`, both incompatible with
   this project's Expo SDK 57 / React Native 0.86 native toolchain. This is very likely to fail the
   native Android build outright, or in some dependency-resolution orders, to produce a build that
   installs but crashes immediately. **Fix: removed the package entirely**, along with the phone
   sign-in UI that depended on it (§14).
2. **EAS builds run with no environment variables by default.** `apps/mobile/.env` is (correctly)
   git-ignored, so EAS's cloud build servers never saw it — and `src/lib/env.ts` throws at JS
   bundle-evaluation time if any required `EXPO_PUBLIC_*` variable is missing (§5), which would
   crash the app immediately on launch on a cloud-built APK even if the native build itself
   succeeded (this could easily look identical to "the build failed" from the outside, since the
   symptom either way is "installed app won't open"). **Fix: added an `env` block with the actual,
   non-secret `EXPO_PUBLIC_*` values to every profile in `eas.json`** — this is
   [Expo's documented mechanism](https://docs.expo.dev/build-reference/variables/) for supplying
   build-time env vars to EAS Build, and is safe to commit precisely because these values were never
   secret (§5).

Also fixed in the same pass (lower risk, but worth knowing about): a **stray, wrongly-scoped EAS
config** had been created at the repo root (different EAS project ID and different Android package
name than the real `apps/mobile/app.config.ts`) — almost certainly from running `eas init` /
`eas build:configure` from the repo root instead of from inside `apps/mobile`. It's been deleted.
**Always run `eas`/`expo` commands from inside `apps/mobile`**, never the repo root — the repo root
has no Expo project at all (its `package.json` has no `expo`/`react-native` dependency).

### EAS project / credentials setup

- This project is already linked to EAS project `ba9584a0-168f-4c5d-a3cf-c7031addcb96`
  (`@tumelobokote/storedash-mobile`, `apps/mobile/app.config.ts` → `extra.eas.projectId`). Confirm
  you're logged into an account with access via `npx eas whoami` / `npx eas project:info`.
- **Android keystore**: EAS manages this for you by default ("remote credentials") — the first
  build auto-generates a keystore in the cloud if none exists yet. You don't need `keytool` or a
  local Android SDK installed. Inspect/manage it any time with `npx eas credentials`.
- Every build profile (`development`, `preview`, `production`) in `eas.json` now carries its own
  `env` block (§5, §12.1 above) — if you rotate a Firebase key or change the backend URL, update it
  in **both** `apps/mobile/.env` (local dev) **and** `apps/mobile/eas.json` (cloud builds); they are
  intentionally not the same file, since EAS Build doesn't read `.env`.

## 13. Android build configuration

- **Package name**: `com.storedash.mobile` (`app.config.ts` → `android.package`). This is a
  placeholder — Google Play requires a package name you own and **cannot ever change post-publish**,
  so replace it with a real reverse-DNS name you control before shipping to production (the file has
  a comment marking this).
- **Permissions**: `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` (via the `expo-location` plugin
  config) — used only for "sort stores by distance to me" and the map's "locate me" button; the app
  functions fully without granting it, just without distance sorting.
- **Google Maps API key**: `android.config.googleMaps.apiKey` in `app.config.ts`, sourced from
  `process.env.ANDROID_GOOGLE_MAPS_API_KEY` — **currently unset**. Without it, the map screen
  (`react-native-maps`, `PROVIDER_GOOGLE`) renders blank/grey on Android, though the list view
  (default) works fully regardless. Get a key from Google Cloud Console > APIs & Services >
  Credentials, restrict it to the Maps SDK for Android + your app's package name/SHA-1, and either
  export it as `ANDROID_GOOGLE_MAPS_API_KEY` before running `eas build` locally, or add it to
  `eas.json`'s `env` blocks the same way the Firebase values were added (§5) — unlike the Firebase
  web config, treat a Maps API key as sensitive if it isn't restricted, since an unrestricted key can
  be used by anyone who extracts it from the APK.
- **Splash screen**: configured via the `expo-splash-screen` plugin in `app.config.ts` (separate
  light/dark images and background colors). No manual `SplashScreen.preventAutoHideAsync()`/
  `hideAsync()` calls are used in `app/_layout.tsx` — the plugin's default auto-hide-on-first-render
  behavior is sufficient here since nothing in the root layout does long blocking work before first
  render (`ThemeProvider` returns `null` for one tick while reading a persisted preference, which is
  fine — the splash stays up that one tick, then the real UI renders). See §17 if you ever see it
  hang.
- **New Architecture**: enabled by default (Expo SDK 57 / React Native 0.86 default) — every native
  dependency currently in `package.json` is New-Architecture-compatible; this was specifically why
  `expo-firebase-recaptcha`/`expo-firebase-core` (not updated for it) had to go rather than be patched
  (§12).

## 14. Why phone sign-in was removed

The customer **web** app (`apps/customer`) supports Firebase phone-number sign-in. The mobile app
originally attempted the same via `expo-firebase-recaptcha`'s `FirebaseRecaptchaVerifierModal`, but
that package's native dependency chain is incompatible with this project's Expo SDK version and was
the direct cause of the development build failing (§12) — so it was removed rather than patched (the
package itself hasn't been meaningfully maintained in years; there's no newer version to upgrade
to). **Email + password and Google sign-in remain fully functional** and are unaffected, since both
go through the plain `firebase/auth` JS SDK with no extra native dependency. If phone sign-in is a
hard requirement for mobile later, the realistic paths are: (a) a hand-built invisible-reCAPTCHA
WebView wrapper (the app already depends on `react-native-webview`, so this is possible without a
new native module), or (b) migrating auth to `@react-native-firebase/auth`, a much larger native
footprint that also requires `google-services.json`/`GoogleService-Info.plist` native Firebase
project files this app doesn't currently have. Neither was in scope for this pass.

## 15. How to test without an Android emulator

Everything in this README works without Android Studio or an emulator:

- **Static checks** (no device needed at all): `npx tsc --noEmit` (typecheck), `npx expo-doctor`
  (dependency/config validation), `npx expo config` (resolved config dump).
- **EAS cloud builds** (§11, §12) compile in Expo's cloud infrastructure, not on your machine — no
  local Android SDK required to produce an installable `.apk`.
- **Installing and testing the `.apk`** only requires a physical Android phone (§16) — most testing
  described in this README (sign-up, sign-in, browsing, cart, checkout, orders, account, dark mode,
  the store-owner application) is realistically only fully verifiable on a real device or emulator,
  since it needs a JS engine, touch input, and (for parts of it) camera/location/network — this
  environment could verify configuration, dependency compatibility, and code correctness, but not
  actual on-device rendering/interaction. Do a manual pass on a real device before considering any
  release "tested."
- **Expo Go** (§10) is the fastest loop for anything that doesn't touch Google Sign-In or the map.

## 16. Installing the APK on a physical Android device

1. On the device: **Settings > Security** (or **Apps > Special access**) > enable **Install unknown
   apps** for whichever app you'll use to open the APK (e.g. Chrome, Files).
2. Get the APK onto the device — easiest is the direct download link EAS prints after a build
   completes (open it in the phone's browser), or `adb install path/to/build.apk` if connected via
   USB with USB debugging enabled, or transfer the file any other way (email, cloud storage, cable).
3. Open the downloaded file and tap **Install**. If Play Protect warns about an unknown app, this is
   expected for a non-Play-Store APK — this is a normal Android warning, not an app problem.
4. Launch it from the home screen like any other app. A **development**-profile build will prompt
   for a Metro/`expo start` connection on first launch (§12); a **preview**-profile build runs fully
   standalone.

## 17. Troubleshooting

- **App is stuck on the splash screen / never renders**: almost always means the JS bundle threw an
  error before rendering anything, most commonly a missing required env var (§5 — check every
  `EXPO_PUBLIC_*` value marked `yes` is actually set, in `.env` for local runs or `eas.json`'s `env`
  block for EAS builds) or a Firebase project ID mismatch making startup calls fail before mount.
  Connect a debugger/`npx expo start` with the device attached to see the actual thrown error instead
  of guessing.
- **Development build installs but crashes/won't open**: see §12's full root-cause writeup — check
  you're on the current dependency set (`npm install` from the repo root after pulling this fix,
  `expo-firebase-recaptcha`/`expo-firebase-core` should not appear in `apps/mobile/package.json` or
  `node_modules`), and that `eas.json`'s `env` blocks are present and correctly populated.
- **`npx expo-doctor` fails**: run it and read the specific check that failed — after this pass it
  should report 20/20 passing. A "duplicate dependencies" failure specifically means two versions of
  a native-relevant package got installed (fix: `npm dedupe` from the repo root, then re-check;
  `react`'s exact-patch-version advisory is intentionally silenced via `expo.install.exclude` in
  `package.json` since a harmless patch difference isn't worth fighting the whole monorepo's
  dependency graph over — see the root README's 2026-08-13 mobile-audit entry for why).
- **API calls fail / every screen shows an error state**: check `EXPO_PUBLIC_API_URL` is reachable
  from wherever the app is actually running (§7 — `localhost` does not work from a physical device);
  check the backend is actually up (`curl <EXPO_PUBLIC_API_URL>/api/health`).
- **401 on every authenticated request, but the backend is reachable**: `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  doesn't match the backend's `FIREBASE_PROJECT_ID` — they must be the exact same Firebase project
  (§5, §6).
- **Google sign-in button doesn't appear**: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is unset — this is a
  deliberate graceful-degradation (`googleSignInAvailable` in `AuthContext.tsx`), not a bug. Set it
  to fix (§5).
- **Google sign-in button appears but fails on a real device/build**: almost always a missing/wrong
  SHA-1 fingerprint registration for that specific build's keystore (§6, step 4) — a debug/dev build
  and a preview/production build have different keystores and need separate SHA-1 registrations.
- **Map screen is blank or grey**: missing `ANDROID_GOOGLE_MAPS_API_KEY` (§13) — the list view works
  regardless; this only affects the map view specifically.
- **Changes to `.env` don't seem to take effect**: Expo doesn't hot-reload env vars — restart
  `npx expo start`. For EAS builds, `.env` isn't read at all (§5, §12) — edit `eas.json`'s `env`
  blocks instead and trigger a new build.
- **`Cannot find module '@storedash/shared'` or similar monorepo resolution errors**: run
  `npm install` from the **repo root**, not from inside `apps/mobile` alone — the shared package is
  a workspace symlink set up by the root install.

## 18. Available scripts

```bash
npx expo start              # start the Metro dev server (Expo Go / dev-client)
npx expo start --android    # same, and immediately open on a connected Android device/emulator
npx tsc --noEmit             # typecheck (also runs as part of npm run typecheck at the repo root)
npx expo-doctor              # validate dependencies/config against the installed Expo SDK
npx eas build --platform android --profile preview       # installable APK (§11)
npx eas build --platform android --profile development   # dev-client APK (§12)
npx eas credentials          # inspect/manage Android signing credentials
```
