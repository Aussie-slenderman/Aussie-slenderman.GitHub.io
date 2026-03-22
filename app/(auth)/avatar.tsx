import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { updateUser } from '../../src/services/auth';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';
import type { AvatarConfig } from '../../src/types';

const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524'];
const HAIR_STYLES = ['afro', 'spiky', 'long', 'curly', 'buzz'];
const HAIR_STYLE_LABELS = ['Afro', 'Spiky', 'Long', 'Curly', 'Buzz'];
const HAIR_COLORS = ['#1A1A1A', '#8B4513', '#FFD700', '#FF6B6B', '#4FC3F7', '#E8E8E8'];
const EYE_COLORS = ['#2C3E50', '#16A085', '#8E44AD', '#E67E22', '#2980B9'];
const OUTFIT_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];

function AvatarPreview({ config }: { config: AvatarConfig }) {
  const skin = SKIN_TONES[config.skinTone];
  const hair = HAIR_COLORS[config.hairColor];
  const eye = EYE_COLORS[config.eyeColor];
  const outfit = OUTFIT_COLORS[config.outfitColor];
  const isLong = config.hairStyle === 2;

  // Hair shapes — head top edge is at y=16 in the wrapper.
  // All styles must NOT cover the face (only sit on top of / beside the head).
  const hairTopStyle = () => {
    switch (config.hairStyle) {
      // 0 Afro — round puff sitting ON TOP of head; bottom=(-20+40)=20 → 4px into scalp only
      case 0: return { borderRadius: 44, top: -20, width: 88, height: 40, left: -4 };
      // 1 Spiky — flat-topped block above head
      case 1: return { top: -24, width: 68, height: 28, left: 6, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 };
      // 3 Curly — wavy oval on top; bottom=(-14+34)=20 → just on scalp
      case 3: return { borderRadius: 44, top: -14, width: 88, height: 34, left: -4 };
      // 4 Buzz — thin flat cap right at scalp top
      case 4: return { borderRadius: 4, top: 14, width: 72, height: 10, left: 4 };
      default: return { borderRadius: 44, top: -20, width: 88, height: 40, left: -4 };
    }
  };

  return (
    <View style={previewStyles.wrapper}>
      {/* Hair — Long uses side streaks + top cap; all others use a single top piece */}
      {isLong ? (
        <>
          {/* Top cap so hair is visible on top of head */}
          <View style={[previewStyles.hairLongTop, { backgroundColor: hair }]} />
          {/* Left streak — behind the head, beside the face */}
          <View style={[previewStyles.hairSideL, { backgroundColor: hair }]} />
          {/* Right streak */}
          <View style={[previewStyles.hairSideR, { backgroundColor: hair }]} />
        </>
      ) : (
        <View style={[previewStyles.hair, hairTopStyle(), { backgroundColor: hair }]} />
      )}
      {/* Head */}
      <View style={[previewStyles.head, { backgroundColor: skin }]}>
        {/* Eyes — white sclera with coloured iris */}
        <View style={previewStyles.eyeRow}>
          <View style={previewStyles.eyeShell}>
            <View style={[previewStyles.eyeIris, { backgroundColor: eye }]} />
          </View>
          <View style={previewStyles.eyeShell}>
            <View style={[previewStyles.eyeIris, { backgroundColor: eye }]} />
          </View>
        </View>
        {/* Smile */}
        <View style={previewStyles.smileWrapper}>
          <View style={[previewStyles.smile, { borderColor: '#5C3317' }]} />
        </View>
      </View>
      {/* Neck */}
      <View style={[previewStyles.neck, { backgroundColor: skin }]} />
      {/* Body */}
      <View style={[previewStyles.body, { backgroundColor: outfit }]}>
        <View style={[previewStyles.collar, { borderTopColor: outfit }]} />
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: 80, height: 130 },
  hair: { position: 'absolute', zIndex: 2 },
  // Long hair: top cap on scalp + two narrow side streaks behind head
  hairLongTop: {
    position: 'absolute', zIndex: 2,
    top: 12, left: 4, width: 72, height: 16,
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  hairSideL: {
    position: 'absolute', zIndex: 0,
    top: 16, left: 2, width: 11, height: 96,
    borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
    borderTopRightRadius: 0, borderBottomRightRadius: 0,
  },
  hairSideR: {
    position: 'absolute', zIndex: 0,
    top: 16, left: 67, width: 11, height: 96,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
    borderTopRightRadius: 6, borderBottomRightRadius: 6,
  },
  head: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16, zIndex: 1,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  eyeRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  eyeShell: { width: 15, height: 15, borderRadius: 8, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  eyeIris: { width: 9, height: 9, borderRadius: 5 },
  smileWrapper: { overflow: 'hidden', width: 28, height: 14 },
  smile: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 3, borderColor: '#5C3317',
    backgroundColor: 'transparent',
    marginTop: -14,
  },
  neck: { width: 18, height: 10, zIndex: 0 },
  body: {
    width: 68, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4,
  },
  collar: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
});

export default function AvatarScreen() {
  const { user, setUser } = useAppStore();
  const [config, setConfig] = useState<AvatarConfig>({
    skinTone: 0, hairStyle: 0, hairColor: 0, eyeColor: 0, outfitColor: 0,
  });
  const [saving, setSaving] = useState(false);

  const update = (key: keyof AvatarConfig, value: number) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const handleDone = async () => {
    setSaving(true);
    try {
      if (user) {
        await updateUser(user.id, { avatarConfig: config });
        setUser({ ...user, avatarConfig: config });
      }
    } catch { /* non-critical */ }
    router.replace('/(auth)/setup');
  };

  return (
    <View style={[styles.container, Platform.OS === 'web' && { height: '100vh' as any }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Your Avatar</Text>
        <Text style={styles.subtitle}>Customise how you look to other players</Text>

        {/* Live preview */}
        <View style={styles.previewCard}>
          <AvatarPreview config={config} />
          <Text style={styles.previewName}>{user?.username ?? 'Player'}</Text>
        </View>

        <Section label="Skin Tone">
          {SKIN_TONES.map((c, i) => (
            <Swatch key={i} color={c} selected={config.skinTone === i} onPress={() => update('skinTone', i)} />
          ))}
        </Section>

        <Section label="Hair Style">
          {HAIR_STYLE_LABELS.map((label, i) => (
            <OptionChip key={i} label={label} selected={config.hairStyle === i} onPress={() => update('hairStyle', i)} />
          ))}
        </Section>

        <Section label="Hair Colour">
          {HAIR_COLORS.map((c, i) => (
            <Swatch key={i} color={c} selected={config.hairColor === i} onPress={() => update('hairColor', i)} />
          ))}
        </Section>

        <Section label="Eye Colour">
          {EYE_COLORS.map((c, i) => (
            <Swatch key={i} color={c} selected={config.eyeColor === i} onPress={() => update('eyeColor', i)} />
          ))}
        </Section>

        <Section label="Outfit Colour">
          {OUTFIT_COLORS.map((c, i) => (
            <Swatch key={i} color={c} selected={config.outfitColor === i} onPress={() => update('outfitColor', i)} />
          ))}
        </Section>

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
            <Text style={styles.doneText}>{saving ? 'Saving…' : "Let's Go →"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionRow}>{children}</View>
    </View>
  );
}

function Swatch({ color, selected, onPress }: { color: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    />
  );
}

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { padding: Spacing['2xl'], paddingTop: 60, paddingBottom: 60, alignItems: 'center' },
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
  previewName: { marginTop: 10, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  section: { width: '100%', marginBottom: Spacing.lg },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary, marginBottom: Spacing.sm },
  sectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: Colors.brand.primary, transform: [{ scale: 1.15 }] },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  chipSelected: { borderColor: Colors.brand.primary, backgroundColor: 'rgba(0,179,230,0.15)' },
  chipText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  chipTextSelected: { color: Colors.brand.primary, fontWeight: FontWeight.semibold },
  doneButton: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.xl, width: '100%' },
  gradient: { paddingVertical: 16, alignItems: 'center' },
  doneText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
});
