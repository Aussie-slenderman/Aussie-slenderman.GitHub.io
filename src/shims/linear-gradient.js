'use strict';
/**
 * Web-compatibility shim for react-native-linear-gradient.
 *
 * react-native-gifted-charts depends on react-native-linear-gradient,
 * which is a native-only module and cannot run in a browser.
 * This shim re-exports expo-linear-gradient's LinearGradient component,
 * which is functionally identical and fully supports the web platform.
 *
 * Metro is configured (via metro.config.js) to resolve any import of
 * 'react-native-linear-gradient' to this file when building for web.
 */
const { LinearGradient } = require('expo-linear-gradient');

// Support both default-import and named-import patterns:
//   import LinearGradient from 'react-native-linear-gradient'  ← default
//   import { LinearGradient } from 'react-native-linear-gradient'  ← named
module.exports = LinearGradient;
module.exports.default = LinearGradient;
module.exports.LinearGradient = LinearGradient;
