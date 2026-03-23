import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { updateUser } from '../../src/services/auth';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';
import type { AvatarConfig } from '../../src/types';

const ANIMALS = [
  // Pets & big cats
  '🐶', '🐱', '🦁', '🐯', '🐻', '🐼',
  // Wild land
  '🦊', '🐺', '🐨', '🦘', '🦝', '🦡',
  // Birds
  '🐧', '🦅', '🦉', '🦜', '🦚', '🦩',
  // Fantasy & reptiles
  '🦄', '🐉', '🐸', '🦎', '🐢', '🐊',
  // Ocean
  '🦈', '🐙', '🐬', '🐳', '🦑', '🦀',
  // Large land animals
  '🐘', '🦒', '🦓', '🦏', '🦛', '🐪',
  // Small creatures
  '🦔', '🦦', '🦋', '🐝', '🐞', '🦗',
  // More mammals
  '🦭', '🦬', '🦫', '🦙', '🐑', '🐗',
  // More birds & aquatic
  '🦃', '🐓', '🐠', '🐡', '🦐', '🦇',
  // Extra
  '🦌', '🐿', '🦤', '🦎', '🐛', '🕷',
];

const BG_COLORS = [
  { hex: '#1A2235', label: 'Dark'   },
  { hex: '#7C3AED', label: 'Purple' },
  { hex: '#0369A1', label: 'Blue'   },
  { hex: '#15803D', label: 'Green'  },
  { hex: '#B91C1C', label: 'Red'    },
  { hex: '#C2410C', label: 'Orange' },
  { hex: '#DB2777', label: 'Pink'   },
  { hex: '#0F766E', label: 'Teal'   },
  { hex: '#B45309', label: 'Gold'   },
  { hex: '#475569', label: 'Slate'  },
];

export default function AvatarScreen() {
  const { user, setUser } = useAppStore();
  const params = useLocalSearchParams<{ from?: string }>();
  const fromProfile = params.from === 'profile';

  const existing = user?.avatarConfig;
  const [selected, setSelected] = useState<string>(existing?.animal ?? ANIMALS[0]);
  const [bgColor, setBgColor] = useState<string>(existing?.bgColor ?? BG_COLORS[0].hex);
  const [saving, setSaving] = useState(false);

  const handleDone = async () => {
    setSaving(true);
    try {
      const config: AvatarConfig = { animal: selected, bgColor };
      if (user) {
        await updateUser(user.id, { avatarConfig: config });
        setUser({ ...user, avatarConfig: config });
      }
    } catch { /* non-critical */ }
    if (fromProfile) {
      router.back();
    } else {
      router.replace('/(auth)/setup');
    }
  };

  return (
    <View style={[styles.container, Platform.OS === 'web' && { height: '100vh' as any }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {fromProfile && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>Choose Your Animal</Text>
        <Text style={styles.subtitle}>Pick an animal and background to represent you</Text>

        {/* Preview */}
        <View style={styles.previewCard}>
          <View style={[styles.animalCircle, { backgroundColor: bgColor }]}>
            <Text style={styles.animalEmoji}>{selected}</Text>
          </View>
          <Text style={styles.previewName}>{user?.username ?? 'Player'}</Text>
        </View>

        {/* Background Colour */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>Background Colour</Text>
          <View style={styles.colorRow}>
            {BG_COLORS.map((c) => (
              <TouchableOpacity
                key={c.hex}
                onPress={() => setBgColor(c.hex)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.hex },
                  bgColor === c.hex && styles.colorSwatchSelected,
                ]}
                activeOpacity={0.8}
              />
            ))}
          </View>
        </View>

        {/* Animal Grid */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>Animal</Text>
          <View style={styles.grid}>
            {ANIMALS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.animalTile, selected === emoji && styles.animalTileSelected]}
                onPress={() => setSelected(emoji)}
                activeOpacity={0.75}
              >
                <Text style={styles.tileEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.brand.primary, '#0096C7']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.doneText}>{saving ? 'Saving…' : fromProfile ? 'Save Changes' : "Let's Go →"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { padding: Spacing['2xl'], paddingTop: 60, paddingBottom: 60, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: FontSize.base, color: Colors.brand.primary, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text.primary, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: FontSize.base, color: Colors.text.secondary, marginBottom: Spacing.xl, textAlign: 'center' },
  previewCard: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  animalCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.brand.primary,
  },
  animalEmoji: { fontSize: 52 },
  previewName: { marginTop: 12, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  sectionBox: {
    width: '100%',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: 12,
  },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: Colors.brand.primary,
    transform: [{ scale: 1.18 }],
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  animalTile: {
    width: 58, height: 58, borderRadius: Radius.lg,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  animalTileSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: 'rgba(0,179,230,0.15)',
    transform: [{ scale: 1.1 }],
  },
  tileEmoji: { fontSize: 30 },
  doneButton: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.xl, width: '100%' },
  gradient: { paddingVertical: 16, alignItems: 'center' },
  doneText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
});
