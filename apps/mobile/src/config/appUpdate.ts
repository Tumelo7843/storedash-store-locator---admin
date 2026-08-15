import { env } from '../lib/env';

// Source of truth for the Account screen's "App Updates" card.
//
// EAS internal-distribution builds don't expose a single URL that always
// points at "the latest APK" — each build gets its own artifact URL. So
// there's no way to make this fully automatic without adding a CI step, and
// nothing in this repo runs one today. Until that exists, update the three
// fallback values below by hand right after each `eas build --platform
// android` you want to publish (copy the "Build details" artifact URL from
// the EAS dashboard, or run `npx eas build:list --platform android --limit 1`).
//
// If a CI step is added later, it can skip editing this file entirely by
// setting EXPO_PUBLIC_LATEST_APK_URL / _VERSION / _NOTES as build-time env
// vars (e.g. in eas.json's per-profile `env`) — those take priority over the
// fallbacks below, so wiring up real automation is a config-only change.
const FALLBACK_LATEST_VERSION = '1.0.0';
const FALLBACK_APK_URL = 'https://expo.dev/artifacts/eas/dvzIfbpL-W4tKACsgjfY-JWMLf7i9WmtDtECxokd8p4.apk';
const FALLBACK_RELEASE_NOTES = '';

export const APP_UPDATE = {
  latestVersion: env.latestApkVersion || FALLBACK_LATEST_VERSION,
  apkUrl: env.latestApkUrl || FALLBACK_APK_URL,
  releaseNotes: env.latestApkNotes || FALLBACK_RELEASE_NOTES,
};
