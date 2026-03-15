import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';

// ─── Package definitions ───────────────────────────────────────────────────────

const PACKAGES = [
  {
    id: 'bling_1k',
    bling: 1_000,
    price: 2.00,
    label: '1,000',
    badge: null,
    gradient: ['#1A2235', '#1E2A40'] as [string, string],
    accent: Colors.brand.primary,
  },
  {
    id: 'bling_5k',
    bling: 5_000,
    price: 6.00,
    label: '5,000',
    badge: 'POPULAR',
    gradient: ['#1A2235', '#1E2A40'] as [string, string],
    accent: Colors.brand.accent,
  },
  {
    id: 'bling_10k',
    bling: 10_000,
    price: 10.00,
    label: '10,000',
    badge: 'BEST VALUE',
    gradient: ['#1A2C1A', '#1E351E'] as [string, string],
    accent: Colors.market.gain,
  },
  {
    id: 'bling_20k',
    bling: 20_000,
    price: 20.00,
    label: '20,000',
    badge: 'BEST VALUE',
    gradient: ['#1A2C1A', '#1E351E'] as [string, string],
    accent: Colors.market.gain,
  },
  {
    id: 'bling_50k',
    bling: 50_000,
    price: 50.00,
    label: '50,000',
    badge: 'MEGA PACK',
    gradient: ['#2A1E0E', '#3A2810'] as [string, string],
    accent: Colors.brand.gold,
  },
];

type Package = typeof PACKAGES[0];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BuyBlingScreen() {
  const { bling, addBling } = useAppStore();
  const [confirmPkg, setConfirmPkg] = useState<Package | null>(null);

  function confirmPurchase() {
    if (!confirmPkg) return;
    addBling(confirmPkg.bling);
    setConfirmPkg(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Bling</Text>
        <View style={styles.blingBadge}>
          <Text style={styles.blingBadgeIcon}>💎</Text>
          <Text style={styles.blingBadgeText}>{bling.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>💎</Text>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>What is Bling?</Text>
            <Text style={styles.introDesc}>
              Bling is CapitalQuest's in-game currency. Use it to unlock exclusive avatars, pets, and mystery boxes in the Shop.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>CHOOSE A PACKAGE</Text>

        {/* Packages */}
        {PACKAGES.map(pkg => (
          <TouchableOpacity
            key={pkg.id}
            activeOpacity={0.85}
            onPress={() => setConfirmPkg(pkg)}
          >
            <LinearGradient
              colors={pkg.gradient}
              style={[styles.packageCard, { borderColor: `${pkg.accent}55` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {pkg.badge && (
                <View style={[styles.packageBadge, { backgroundColor: pkg.accent }]}>
                  <Text style={styles.packageBadgeText}>{pkg.badge}</Text>
                </View>
              )}

              <View style={styles.packageLeft}>
                <Text style={styles.packageEmoji}>💎</Text>
                <View>
                  <Text style={[styles.packageBlingAmount, { color: pkg.accent }]}>
                    {pkg.label}
                  </Text>
                  <Text style={styles.packageBlingLabel}>Bling</Text>
                </View>
              </View>

              <View style={styles.packageRight}>
                <Text style={styles.packagePrice}>${pkg.price.toFixed(2)}</Text>
                <View style={[styles.buyChip, { backgroundColor: pkg.accent }]}>
                  <Text style={styles.buyChipText}>Buy</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Bling is virtual in-game currency for use within CapitalQuest only.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Confirmation Modal ── */}
      <Modal
        visible={confirmPkg !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmPkg(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>💎</Text>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            <Text style={styles.modalBody}>
              Add{' '}
              <Text style={[styles.modalHighlight, { color: confirmPkg ? confirmPkg.accent : Colors.brand.gold }]}>
                {confirmPkg?.label} Bling
              </Text>
              {' '}to your account?
            </Text>
            <Text style={styles.modalPrice}>${confirmPkg?.price.toFixed(2)}</Text>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmPkg?.accent ?? Colors.brand.primary }]}
              onPress={confirmPurchase}
            >
              <Text style={styles.confirmBtnText}>Confirm — ${confirmPkg?.price.toFixed(2)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmPkg(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  backArrow: {
    fontSize: 28,
    color: Colors.brand.primary,
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  blingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.brand.gold}22`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.brand.gold}55`,
  },
  blingBadgeIcon: { fontSize: 13 },
  blingBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.brand.gold,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: `${Colors.brand.primary}15`,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.brand.primary}30`,
    marginBottom: Spacing.lg,
  },
  introEmoji: { fontSize: 32 },
  introText: { flex: 1 },
  introTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  introDesc: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },

  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  packageBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: Radius.md,
  },
  packageBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    letterSpacing: 0.8,
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  packageEmoji: { fontSize: 36 },
  packageBlingAmount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  packageBlingLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  packageRight: {
    alignItems: 'flex-end',
    gap: 6,
    paddingTop: 10,
  },
  packagePrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  buyChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  buyChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
  },

  footerNote: {
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  modalEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  modalBody: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalHighlight: {
    fontWeight: FontWeight.extrabold,
  },
  modalPrice: {
    fontSize: FontSize['2xl'] ?? 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    marginTop: 4,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confirmBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  cancelBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
});
