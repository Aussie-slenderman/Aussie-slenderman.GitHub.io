import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useAppStore } from '../store/useAppStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Confetti pool ────────────────────────────────────────────────────────────
// We create a large stable pool once; each achievement animates a subset of it
// whose size is proportional to the XP reward.

const MAX_CONFETTI = 160;
const MIN_CONFETTI = 20;
const MIN_XP       = 50;
const MAX_XP       = 5000;

const CONFETTI_COLORS = [
  '#FF3D57', '#00C853', '#00B3E6', '#F5C518',
  '#8B5CF6', '#FF9800', '#EC4899', '#00D4AA',
];

function xpToConfettiCount(xp: number): number {
  const clamped = Math.max(MIN_XP, Math.min(MAX_XP, xp));
  const ratio   = (clamped - MIN_XP) / (MAX_XP - MIN_XP);
  return Math.round(MIN_CONFETTI + ratio * (MAX_CONFETTI - MIN_CONFETTI));
}

const confettiPool = Array.from({ length: MAX_CONFETTI }, () => ({
  y:       new Animated.Value(-30),
  x:       new Animated.Value(0),
  rotate:  new Animated.Value(0),
  opacity: new Animated.Value(0),
  color:   CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  size:    Math.random() * 8 + 6,            // 6–14 px
  startX:  Math.random() * SCREEN_W,
  xDrift:  Math.random() * 200 - 100,        // −100 … +100
  duration: Math.random() * 2000 + 3000,     // 3000–5000 ms (longer for 5 s window)
  delay:   Math.random() * 900,
}));

// ─── Component ────────────────────────────────────────────────────────────────

export default function AchievementToast() {
  const { pendingAchievement, setPendingAchievement } = useAppStore();
  const slideAnim  = useRef(new Animated.Value(-220)).current;
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingAchievement) return;

    if (clearTimer.current) clearTimeout(clearTimer.current);

    // How many pieces to use for this achievement
    const count = xpToConfettiCount(pendingAchievement.xpReward);

    // Reset the pieces we'll use (leave the rest hidden)
    confettiPool.forEach((p, i) => {
      p.y.setValue(-30);
      p.x.setValue(0);
      p.rotate.setValue(0);
      p.opacity.setValue(i < count ? 0 : -1); // -1 keeps extras invisible
    });

    // Slide toast in
    slideAnim.setValue(-220);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Animate the active confetti pieces
    confettiPool.slice(0, count).forEach(p => {
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.opacity, {
            toValue: 1, duration: 120, useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: SCREEN_H + 60,
            duration: p.duration,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: p.xDrift,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotate, {
            toValue: 1,
            duration: p.duration,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Slide toast out after 5 s then clear state
    clearTimer.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -220,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setPendingAchievement(null));
    }, 5000);

    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [pendingAchievement]);

  if (!pendingAchievement) return null;

  const activeCount = xpToConfettiCount(pendingAchievement.xpReward);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* ── Confetti ── */}
      {confettiPool.slice(0, activeCount).map((p, i) => {
        const rotation = p.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '720deg'],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: p.startX,
              width: p.size,
              height: p.size * 0.5,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity: p.opacity,
              transform: [
                { translateY: p.y },
                { translateX: p.x },
                { rotate: rotation },
              ],
            }}
          />
        );
      })}

      {/* ── Toast card (top-right) ── */}
      <Animated.View
        style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={styles.icon}>{pendingAchievement.icon}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Achievement Unlocked!</Text>
          <Text style={styles.title} numberOfLines={1}>
            {pendingAchievement.title}
          </Text>
        </View>
        <Text style={styles.xp}>+{pendingAchievement.xpReward} XP</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 58,
    right: 14,
    backgroundColor: '#1A2235',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F5C518',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    maxWidth: 290,
    gap: 10,
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 14,
  },
  icon:      { fontSize: 26 },
  textBlock: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F5C518',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 2,
  },
  xp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00D4AA',
  },
});
