import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Linking, TouchableOpacity, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { auth, db, signOut } from '../../src/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Colors, FontSize, Spacing, Radius } from '../../src/constants/theme';

/**
 * Banned screen — shown when the signed-in user has accountBanned: true.
 * The user is NOT signed out; they remain authenticated so they can read
 * their own user doc to display the ban reason, but every app route
 * guards against banned users and bounces back here.
 */
export default function BannedScreen() {
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>('A repeat violation of our community guidelines.');
  const [reasonLabel, setReasonLabel] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [uid, setUid] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = auth.currentUser;
        if (!u) {
          if (!cancelled) setLoading(false);
          return;
        }
        if (!cancelled) setUid(u.uid);
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (cancelled) return;
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          if (!d.accountBanned) {
            // Reached this screen by mistake — bounce home.
            router.replace('/(app)/dashboard');
            return;
          }
          setUsername(String(d.username || ''));
          setDisplayName(String(d.displayName || d.username || '(unknown)'));
          setReason(String(d.banReason || 'A repeat violation of our community guidelines.'));
          setReasonLabel(String(d.banReasonLabel || ''));
        }
      } catch { /* non-fatal */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const onAppealEmail = () => {
    const subject = encodeURIComponent(`[Appeal] @${username || 'unknown'} (uid: ${uid || 'unknown'})`);
    const body = encodeURIComponent(
      `Hi Rookie Markets team,\n\nI'd like to appeal the ban on my account:\n\n` +
      `  Username: @${username}\n  UID: ${uid}\n  Ban reason: ${reason}\n\n` +
      `Please review my account because:\n[ explain in your own words why you believe the ban should be lifted ]\n\nThank you.`
    );
    const url = `mailto:rookiemarkets@gmail.com?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => { /* no email client */ });
  };

  const onSignOut = async () => {
    try { await signOut(); } catch { /* non-fatal */ }
    router.replace('/(auth)/welcome');
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.icon}>🚫</Text>
        <Text style={styles.title}>Your account is banned</Text>
        <Text style={styles.sub}>You can no longer use Rookie Markets with this account. Read below for how to appeal.</Text>

        <View style={styles.box}>
          <Text style={styles.label}>Account</Text>
          <Text style={styles.value}>
            {displayName} <Text style={styles.muted}>@{username}</Text>
          </Text>
          <Text style={styles.uid}>UID: {uid}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>Reason for ban</Text>
          <Text style={styles.value}>{reason}</Text>
          {reasonLabel && reasonLabel !== reason ? (
            <Text style={styles.muted}>Category: {reasonLabel}</Text>
          ) : null}
        </View>

        <View style={styles.appealBox}>
          <Text style={styles.appealTitle}>⚖️ Want to appeal?</Text>
          <Text style={styles.appealText}>
            If you think this ban was a mistake, contact us at <Text style={{ fontWeight: '700' }}>rookiemarkets@gmail.com</Text>. Please include your username and a clear explanation of why you believe the ban should be lifted. We'll review it and get back to you by email.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={onAppealEmail} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>📧 Email us to appeal</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={onSignOut} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>Sign out of this device</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          You will not be able to access any features of the app while this ban is active. Misusing the appeals process may result in a permanent denial of future appeals.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, paddingVertical: Spacing.xl as any },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
  },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: Spacing.sm },
  title: { color: Colors.market.loss, fontSize: FontSize.xl, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm },
  sub: { color: Colors.text.secondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  box: { backgroundColor: Colors.bg.primary, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md, marginBottom: Spacing.md },
  label: { color: Colors.text.tertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: 6 },
  value: { color: Colors.text.primary, fontSize: FontSize.sm, lineHeight: 20 },
  uid: { color: Colors.text.tertiary, fontSize: 11, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  muted: { color: Colors.text.tertiary, fontSize: 12 },
  appealBox: {
    backgroundColor: '#0E1726',
    borderColor: Colors.brand.primary,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  appealTitle: { color: Colors.brand.primary, fontSize: FontSize.sm, fontWeight: '800', marginBottom: 8 },
  appealText: { color: Colors.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: Spacing.sm },
  btnPrimary: { backgroundColor: Colors.brand.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
  btnSecondary: { borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: Radius.md, paddingVertical: Spacing.md - 2, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnSecondaryText: { color: Colors.text.tertiary, fontSize: FontSize.sm, fontWeight: '600' },
  footer: { color: Colors.text.tertiary, fontSize: 12, textAlign: 'center', marginTop: Spacing.md, lineHeight: 18 },
});
