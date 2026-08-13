// Metro config for the StoreDash monorepo: apps/mobile depends on the
// @storedash/shared workspace package, which lives outside this app's own
// node_modules (npm workspaces hoists + symlinks it at the repo root). Metro
// needs to know to watch and resolve modules from the monorepo root too.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// @storedash/shared ships raw .ts source (no build step) — same as it's
// consumed by the Vite customer app. Metro's default sourceExts already
// includes ts/tsx, so no extra resolver config is needed beyond the paths
// above for it to be found and transformed.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
