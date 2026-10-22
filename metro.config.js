const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const learningCore = path.resolve(projectRoot, 'packages/learning-core');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [learningCore];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  '@kids/learning-core': learningCore,
};

module.exports = config;
