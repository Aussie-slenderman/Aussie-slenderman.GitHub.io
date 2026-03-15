// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── Web: alias react-native-linear-gradient → expo-linear-gradient ──────────
// react-native-gifted-charts (charts library) depends on react-native-linear-gradient
// which is a native-only package. This alias redirects it to expo-linear-gradient,
// which has full web support, so charts render correctly in the browser.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-linear-gradient': path.resolve(
    __dirname,
    'src/shims/linear-gradient.js'
  ),
};

module.exports = config;
