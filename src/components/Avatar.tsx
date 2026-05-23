import React from 'react';
import { View, Text, Image, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';
import type { AvatarConfig } from '../types';

interface AvatarProps {
  size?: number;
  avatarUrl?: string | null;
  avatarConfig?: AvatarConfig | null;
  fallbackInitial?: string;
  fallbackBgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Unified avatar renderer.
 * Priority: custom photo (avatarUrl) → emoji (avatarConfig) → initial fallback.
 */
export default function Avatar({
  size = 60,
  avatarUrl,
  avatarConfig,
  fallbackInitial,
  fallbackBgColor,
  borderColor,
  borderWidth,
  style,
}: AvatarProps) {
  const radius = size / 2;
  const ring = borderColor
    ? { borderWidth: borderWidth ?? 2, borderColor }
    : null;

  if (avatarUrl) {
    return (
      <View
        style={[
          { width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: '#000' },
          ring,
          style,
        ]}
      >
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      </View>
    );
  }

  if (avatarConfig?.animal) {
    const bg = avatarConfig.bgColor ?? Colors.bg.tertiary;
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          ring,
          style,
        ]}
      >
        <Text style={{ fontSize: size * 0.53 }}>{avatarConfig.animal}</Text>
      </View>
    );
  }

  const initBg = fallbackBgColor ?? Colors.brand.primary;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: initBg + '33',
          alignItems: 'center',
          justifyContent: 'center',
        },
        ring,
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: initBg }}>
        {(fallbackInitial ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}
