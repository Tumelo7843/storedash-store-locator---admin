#!/usr/bin/env node
// Pulls the most recent finished Android build from EAS and writes its
// artifact URL + app version into src/config/appUpdate.ts, so the Account
// screen's "App Updates" card reflects it without a manual copy-paste.
//
// Run by hand after `eas build --platform android --profile <profile>`
// finishes (requires `eas login` first):
//
//   node scripts/sync-apk-link.mjs [profile]
//
// `profile` defaults to "preview" (the internal-distribution APK profile in
// eas.json). Nothing here runs automatically — there's no CI wired up yet to
// call this after a build — see the comment in src/config/appUpdate.ts.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', 'src', 'config', 'appUpdate.ts');
const profile = process.argv[2] || 'preview';

function fail(message) {
  console.error(`[sync-apk-link] ${message}`);
  process.exit(1);
}

// EAS profile names in eas.json are plain identifiers (development, preview,
// production, ...) — reject anything else up front. Not just input hygiene:
// `profile` is about to be interpolated into a shell command line (see
// `shell: true` below), so this is what keeps that safe.
if (!/^[a-zA-Z0-9_-]+$/.test(profile)) {
  fail(`Invalid profile name "${profile}" — expected letters, numbers, "-" or "_" only.`);
}

// `shell: true` is required on Windows: npm's CLI shims (npx, eas, ...) are
// `.cmd` files, and plain `execFileSync('npx', ...)` fails outright there
// (ENOENT/EINVAL) — Windows can't CreateProcess a .cmd directly, it has to
// go through cmd.exe, which only `shell: true` does. That's normally a
// command-injection risk for any interpolated argument (Node's own DEP0190
// warning), which is exactly why `profile` is validated above before this
// runs — every other argument here is a fixed literal.
let raw;
try {
  raw = execFileSync(
    'npx',
    ['eas-cli', 'build:list', '--platform', 'android', '--profile', profile, '--status', 'finished', '--limit', '1', '--non-interactive', '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: true },
  );
} catch (err) {
  fail(`\`eas build:list\` failed — is eas-cli installed and are you logged in (\`npx eas-cli login\`)? ${err.message}`);
}

let builds;
try {
  builds = JSON.parse(raw);
} catch {
  fail('Could not parse `eas build:list` output as JSON.');
}

const build = Array.isArray(builds) ? builds[0] : null;
const apkUrl = build?.artifacts?.buildUrl;
const version = build?.appVersion;

if (!build || !apkUrl || !version) {
  fail(`No finished Android build with a downloadable artifact found for profile "${profile}".`);
}

const versionPattern = /const FALLBACK_LATEST_VERSION = '.*';/;
const urlPattern = /const FALLBACK_APK_URL = '.*';/;

const source = readFileSync(configPath, 'utf8');

// Check each pattern actually matched *before* replacing — comparing the
// before/after text (as a stand-in for "did the regex match") is wrong
// whenever the fetched build happens to be identical to what's already
// saved, since the replacement is then a genuine no-op even on a match.
if (!versionPattern.test(source) || !urlPattern.test(source)) {
  fail('Could not find the fallback constants to update in src/config/appUpdate.ts — has it been renamed?');
}

const updated = source
  .replace(versionPattern, `const FALLBACK_LATEST_VERSION = '${version}';`)
  .replace(urlPattern, `const FALLBACK_APK_URL = '${apkUrl}';`);

writeFileSync(configPath, updated);
console.log(`[sync-apk-link] Updated appUpdate.ts — version ${version}, ${apkUrl}`);
