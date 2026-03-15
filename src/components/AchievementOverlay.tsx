/**
 * AchievementOverlay
 *
 * Shows a toast popup in the top-right corner when an achievement is unlocked,
 * with animated confetti pieces drifting down the screen.
 *
 * Usage: render once at the root layout level. It reads `pendingAchievement`
 * from the Zustand store and auto-dismisses after 4 seconds.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Confetti piece ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#00B3E6', '#00D4AA', '#F5C518', '#FF6B6B',
  '#A78BFA', '#34D399', '#F97316', '#EC4899',
  '#60A5FA', '#FCD34D',
];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

function createPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    x: new Animated.Value(Math.random() * SCREEN_W),
    y: new Animated.Value(-20 - Math.random() * 120),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.floor(Math.random() * 7),
    shape: Math.random() > 0.4 ? 'rect' : 'circle',
  }));
}

function ConfettiView({ piece }: { piece: ConfettiPiece }) {
  const spin = piece.rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 + Math.floor(Math.random() * 360)}deg`],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        piece.shape === 'circle' ? styles.confettiCircle : styles.confettiRect,
        {
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.shape === 'rect' ? piece.size * 0.6 : piece.size,
          borderRadius: piece.shape === 'circle' ? piece.size / 2 : 2,
          position: 'absolute',
          transform: [
            { translateX: piece.x },
            { translateY: piece.y },
            { rotate: spin },
          ],
          opacity: piece.opacity,
        },
      ]}
    />
  );
}

// ─── Toast card ───────────────────────────────────────────────────────────────

export default function AchievementOverlay() {
  const { pendingAchievement, setPendingAchievement } = useAppStore();
  const slideAnim = useRef(new Animated.Value(220)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const piecesRef = useRef<ConfettiPiece[]>([]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 220, duration: 300, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setPendingAchievement(null));
  }, [slideAnim, toastOpacity, setPendingAchievement]);

  useEffect(() => {
    if (!pendingAchievement) return;

    // Reset toast
    slideAnim.setValue(220);
    toastOpacity.setValue(0);

    // Create fresh confetti pieces
    const pieces = createPieces(40);
    piecesRef.current = pieces;

    // Animate toast in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Animate confetti fall
    pieces.forEach((piece, i) => {
      const delay = i * 40;
      const duration = 2200 + Math.random() * 1600;
      const targetX = (piece.x as unknown as { _value: number })._value + (Math.random() - 0.5) * 120;
      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_H + 40,
          duration,
          delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: targetX,
          duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration: 400,
          delay: delay + duration - 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [pendingAchievement, dismiss, slideAnim, toastOpacity]);

  if (!pendingAchievement) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Confetti layer */}
      {piecesRef.current.map((piece, i) => (
        <ConfettiView key={i} piece={piece} />
      ))}

      {/* Toast card */}
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastOpacity,
            transform: [{ translateX: slideAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.toastIconWrapper}>
          <Text style={styles.toastIcon}>{pendingAchievement.icon}</Text>
        </View>
        <View style={styles.toastBody}>
          <Text style={styles.toastLabel}>Achievement Unlocked!</Text>
          <Text style={styles.toastTitle}>{pendingAchievement.title}</Text>
          <Text style={styles.toastXp}>+{pendingAchievement.xpReward} XP</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  confettiRect: {},
  confettiCircle: {},
  toast: {
    position: 'absolute',
    top: 56,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.brand.gold,
    shadowColor: Colors.brand.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: 260,
  },
  toastIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.brand.gold}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIcon: { fontSize: 26 },
  toastBody: { flex: 1, gap: 1 },
  toastLabel: {
    fontSize: FontSize.xs,
    color: Colors.brand.gold,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  toastTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  toastXp: {
    fontSize: FontSize.xs,
    color: Colors.brand.accent,
    fontWeight: FontWeight.semibold,
  },
});
