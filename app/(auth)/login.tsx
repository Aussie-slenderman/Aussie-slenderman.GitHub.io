import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { loginUser, signOut } from '../../src/services/auth';
import { setLoginInProgress } from '../_layout';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';
import { auth, db } from '../../src/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CURRENT_TERMS_VERSION } from '../../src/constants/legal';

function buildBannedMessage(reason?: string, username?: string, uid?: string) {
  const base = reason
    ? `Your account has been banned. Reason: ${reason}.`
    : 'Your account has been banned for repeated violations of our community guidelines.';
  const subject = encodeURIComponent(`[Appeal] @${username || 'unknown'} (uid: ${uid || 'unknown'})`);
  const body = encodeURIComponent(
    `Hi Rookie Markets team,\n\nI'd like to appeal the ban on my account:\n\n` +
    `  Username: @${username || ''}\n  UID: ${uid || ''}\n  Ban reason: ${reason || ''}\n\n` +
    `Please review my account because:\n[ explain in your own words why you believe the ban should be lifted ]\n\nThank you.`
  );
  // We surface the email + a tappable mailto link. The error banner in the
  // login screen renders plain text, so we include both so a user can
  // either tap the link or copy the address manually.
  return `${base}\n\nIf you want to appeal so this ban is taken away, contact us at rookiemarkets@gmail.com.\n` +
    `mailto:rookiemarkets@gmail.com?subject=${subject}&body=${body}`;
}
const BANNED_MESSAGE = buildBannedMessage();

const ROOKIE_MARKETS_LOGO = require('../../assets/rookie-markets-logo.png');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If the user was just signed out due to a ban (set by the moderation
  // gate or root layout), surface that message immediately on mount.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).sessionStorage) {
        if ((window as any).sessionStorage.getItem('cqAccountBanned') === '1') {
          setError(BANNED_MESSAGE);
          (window as any).sessionStorage.removeItem('cqAccountBanned');
        }
      }
    } catch { /* non-fatal */ }
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!username.trim()) { setError('Please enter your username or email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    // Prevent the auth listener from redirecting to welcome during sign-in
    setLoginInProgress(true);
    try {
      await loginUser(username.trim().toLowerCase(), password);
      // Server-side ban check — refuse the session if the account doc has
      // accountBanned: true. Pulled directly so we don't rely on the auth
      // listener race.
      try {
        const u = auth.currentUser;
        if (u) {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const userDoc = snap.exists() ? (snap.data() as any) : null;
          if (userDoc?.accountBanned) {
            // Banned users are NOT signed out — they sign in successfully
            // and are redirected to a dedicated banned screen / page that
            // shows the appeal info. They cannot navigate anywhere else
            // because the auth listener / ModerationGate also redirects
            // them to the same place.
            try {
              if (typeof window !== 'undefined' && (window as any).location) {
                (window as any).location.href = '/banned.html';
                return;
              }
            } catch { /* non-web fallthrough */ }
            // Native fallback: still navigate to the banned route inside
            // the app (created at app/(auth)/banned.tsx).
            setLoginInProgress(false);
            router.replace('/banned' as any);
            return;
          }
          if (!userDoc || userDoc.acceptedTermsVersion !== CURRENT_TERMS_VERSION) {
            setLoginInProgress(false);
            router.replace('/terms' as any);
            return;
          }
        }
      } catch {
        setLoginInProgress(false);
        router.replace('/terms' as any);
        return;
      }
      // Navigate immediately to dashboard. The auth listener will still fire
      // and load user data / portfolio in the background.
      router.replace('/dashboard');
    } catch (e: unknown) {
      setLoginInProgress(false);
      setError((e as { message?: string }).message || 'Invalid username or password.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, Platform.OS === 'web' && { height: '100vh' as any }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Image
            source={ROOKIE_MARKETS_LOGO}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Rookie Markets"
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Rookie Markets account</Text>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️  {error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Username or email</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="your_username or your@email.com"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.tertiary}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.brand.primary, '#0096C7']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.loginText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotLink}
          onPress={() => router.push('/forgot-password')}
        >
          <Text style={styles.forgotLinkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.registerLinkText}>
            Don't have an account? <Text style={styles.linkAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scrollView: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: Spacing['2xl'],
    paddingTop: 80,
    paddingBottom: 60,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 24,
    left: Spacing['2xl'],
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: { color: Colors.brand.primary, fontSize: FontSize.base },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandLogo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  form: { gap: Spacing.base, marginBottom: Spacing.xl },
  field: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text.secondary },
  input: {
    backgroundColor: Colors.bg.input,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border.default,
    color: Colors.text.primary,
    fontSize: FontSize.base,
  },
  errorBanner: {
    backgroundColor: 'rgba(255,61,87,0.12)',
    borderWidth: 1,
    borderColor: '#FF3D57',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorText: { color: '#FF3D57', fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  loginButton: { borderRadius: Radius.lg, overflow: 'hidden' },
  gradient: { paddingVertical: 16, alignItems: 'center' },
  loginText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  disabled: { opacity: 0.6 },
  forgotLink: { marginTop: Spacing.lg, alignItems: 'center' },
  forgotLinkText: { fontSize: FontSize.sm, color: Colors.brand.primary, fontWeight: FontWeight.semibold },
  registerLink: { marginTop: Spacing.base, alignItems: 'center' },
  registerLinkText: { fontSize: FontSize.base, color: Colors.text.secondary },
  linkAccent: { color: Colors.brand.primary, fontWeight: FontWeight.semibold },
});
