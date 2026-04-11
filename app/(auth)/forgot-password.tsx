import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { lookupUserByEmail, loginUser, resetUserPassword } from '../../src/services/auth';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';

type Step = 'email' | 'reset' | 'success';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundUser, setFoundUser] = useState<Record<string, unknown> | null>(null);

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!email.includes('@') || !email.includes('.')) { setError('Please enter a valid email.'); return; }

    setLoading(true);
    try {
      const user = await lookupUserByEmail(email.trim().toLowerCase());
      if (!user) {
        setError('No account found with that email address.');
        setLoading(false);
        return;
      }
      setFoundUser(user as Record<string, unknown>);
      setStep('reset');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setError('');
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!foundUser) { setError('User not found. Please go back.'); return; }

    setLoading(true);
    try {
      // Sign in with the user's Firebase auth email first, then update password
      const firebaseEmail = foundUser.email as string;
      // We need the old password to sign in - but we don't have it
      // Instead, try to use Firebase's reauthentication
      // For now, update the password by signing in with the firebase email
      await resetUserPassword(
        foundUser.id as string,
        firebaseEmail,
        newPassword,
      );
      setStep('success');
    } catch {
      // If direct reset fails, try signing in with username and updating
      try {
        const username = foundUser.username as string;
        // Since we can't reset without old password on client-side,
        // we'll update the user's stored firebase email's password
        // by using Firebase Admin or re-auth
        setError('Password reset requires signing in first. Please contact support or try logging in with your current password.');
      } catch {
        setError('Failed to reset password. Please try again.');
      }
    }
    setLoading(false);
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
        <TouchableOpacity onPress={() => step === 'email' ? router.back() : setStep('email')} style={styles.back}>
          <Text style={styles.backText}>{step === 'success' ? '' : '\u2190 Back'}</Text>
        </TouchableOpacity>

        {step === 'email' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter the email address linked to your account</Text>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{'\u26A0\uFE0F'}  {error}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.brand.primary, '#0096C7']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{loading ? 'Checking...' : 'Continue'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === 'reset' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.subtitle}>
                Account found: @{foundUser?.username as string || ''}
                {'\n'}Enter your new password below.
              </Text>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{'\u26A0\uFE0F'}  {error}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={v => { setNewPassword(v); setError(''); }}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.text.tertiary}
                  secureTextEntry
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={v => { setConfirmPassword(v); setError(''); }}
                  placeholder="Re-enter new password"
                  placeholderTextColor={Colors.text.tertiary}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.brand.primary, '#0096C7']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>{'\u2705'}</Text>
            <Text style={styles.title}>Password Reset!</Text>
            <Text style={styles.subtitle}>
              Your password has been updated successfully.{'\n'}You can now sign in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/(auth)/login')}
            >
              <LinearGradient
                colors={[Colors.brand.primary, '#0096C7']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing['2xl'], paddingTop: 100, paddingBottom: 60, justifyContent: 'center' },
  back: { position: 'absolute', top: 60, left: Spacing['2xl'] },
  backText: { color: Colors.brand.primary, fontSize: FontSize.base },
  header: { marginBottom: Spacing['2xl'] },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: { fontSize: FontSize.base, color: Colors.text.secondary, lineHeight: 22 },
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
  button: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.base },
  gradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  disabled: { opacity: 0.6 },
  successContainer: { alignItems: 'center', gap: Spacing.md },
  successIcon: { fontSize: 48, marginBottom: Spacing.md },
});
