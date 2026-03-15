import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { Colors, FontSize, FontWeight, Spacing } from '../constants/theme';

interface AppHeaderProps {
  /** Screen name shown on the left */
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const {
    notifications, unreadCount,
    bling,
    isSidebarOpen, setSidebarOpen,
  } = useAppStore();

  const unreadNotifs =
    notifications.filter(n => !n.read).length + (unreadCount ?? 0);

  const formatBling = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <View style={styles.header}>
      {/* Left: screen title */}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {/* Right: bling → bell → hamburger */}
      <View style={styles.right}>

        {/* 💎 Bling counter */}
        <View style={styles.blingPill}>
          <Text style={styles.blingGem}>💎</Text>
          <Text style={styles.blingText}>{formatBling(bling ?? 0)}</Text>
        </View>

        {/* 🔔 Bell */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/(app)/notifications' as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.iconEmoji}>🔔</Text>
          {unreadNotifs > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>

        {/* ☰ Sidebar toggle */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setSidebarOpen(!isSidebarOpen)}
          activeOpacity={0.7}
        >
          {isSidebarOpen ? (
            <Text style={styles.closeText}>✕</Text>
          ) : (
            <View style={styles.hamburger}>
              <View style={styles.hLine} />
              <View style={[styles.hLine, { width: 14 }]} />
              <View style={styles.hLine} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    flex: 1,
    letterSpacing: 0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Bling pill
  blingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  blingGem:  { fontSize: 13 },
  blingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.brand.gold,
  },

  // Icon buttons
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconEmoji: { fontSize: 20 },
  closeText: { color: Colors.text.secondary, fontSize: 20 },

  // Notification dot
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.market.loss,
    borderWidth: 1.5,
    borderColor: Colors.bg.primary,
  },

  // Hamburger lines
  hamburger: { gap: 4, alignItems: 'flex-end' },
  hLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.text.secondary,
    borderRadius: 2,
  },
});
