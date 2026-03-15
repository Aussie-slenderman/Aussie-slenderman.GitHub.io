/**
 * Trophy Road
 *
 * Vertical progression road — milestones every $100 gain (up to +$50,000).
 * Every $1,000 a reward card appears: alternating avatar or pet, never both at once.
 * Level 1 avatar (Seedling) is always unlocked and used as the player's profile icon.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../../src/components/AppHeader';
import Sidebar from '../../src/components/Sidebar';
import { useAppStore } from '../../src/store/useAppStore';
import { getXPProgress } from '../../src/constants/achievements';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../src/constants/theme';
import { formatCurrency } from '../../src/utils/formatters';
import {
  TROPHY_REWARDS,
  getCurrentAvatar,
  getCurrentPet,
  rewardAtGain,
  type TrophyReward,
} from '../../src/constants/trophyRewards';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Road constants ──────────────────────────────────────────────────────────

const MAX_GAIN_DOLLARS = 50000;
const XP_PER_100 = 20; // 20 XP per $100 milestone = 100 XP per $500 = same level pace

/** All $100 milestone steps from $0 to $50,000. */
const MILESTONES = Array.from(
  { length: MAX_GAIN_DOLLARS / 100 + 1 },
  (_, i) => i * 100,
); // [0, 100, 200, …, 50000]

/** Level names for the first 10 defined levels + generic fallback. */
const LEVEL_NAMES: Record<number, string> = {
  1: 'Beginner Trader',
  2: 'Novice Investor',
  3: 'Apprentice Trader',
  4: 'Trader',
  5: 'Senior Trader',
  6: 'Portfolio Manager',
  7: 'Market Analyst',
  8: 'Hedge Fund Manager',
  9: 'Market Legend',
  10: 'Wolf of Wall Street',
};

function getLevelName(level: number): string {
  return LEVEL_NAMES[level] ?? `Elite Trader Lv.${level}`;
}

function getLevelColor(level: number): string {
  const COLORS = [
    '#94A3B8', '#60A5FA', '#34D399', '#F59E0B', '#F97316',
    '#EF4444', '#8B5CF6', '#EC4899', '#F5C518', '#00D4AA',
    '#06B6D4', '#84CC16', '#F43F5E', '#A855F7', '#0EA5E9',
    '#22C55E', '#EAB308', '#FB923C', '#6366F1', '#14B8A6',
  ];
  return COLORS[(level - 1) % COLORS.length];
}

// ─── Atmosphere helpers ───────────────────────────────────────────────────────

type AtmZone = 'space' | 'upper' | 'clouds' | 'sky' | 'ground';

function getZone(g: number): AtmZone {
  if (g >= 28000) return 'space';
  if (g >= 17500) return 'upper';
  if (g >= 5500)  return 'clouds';
  if (g >= 1500)  return 'sky';
  return 'ground';
}

// ─── Smooth row-background gradient helpers ───────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('');
}
function lerpColor(hexA: string, hexB: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

// Smooth gradient stops from bottom ($0 = ground) to top ($50k = deep space)
const BG_STOPS: [number, string][] = [
  [0,     '#0A2212'],  // deep forest green — ground
  [1500,  '#082235'],  // dark ocean blue — lower sky
  [5500,  '#2E0A22'],  // deep rose/pink — cloud layer
  [17500, '#1A083A'],  // rich dark purple — upper atmosphere
  [28000, '#0A0420'],  // deep indigo-black — space
  [50000, '#020108'],  // near-pure black — outer space
];

function getRowBg(gainDollars: number): string {
  for (let i = 0; i < BG_STOPS.length - 1; i++) {
    const [aG, aC] = BG_STOPS[i];
    const [bG, bC] = BG_STOPS[i + 1];
    if (gainDollars >= aG && gainDollars <= bG) {
      return lerpColor(aC, bC, (gainDollars - aG) / (bG - aG));
    }
  }
  return BG_STOPS[BG_STOPS.length - 1][1];
}

// Accent colour per zone — drives spine, node, XP pill, banner colours
const ZONE_ACCENT: Record<AtmZone, string> = {
  space:  '#8B5CF6',  // purple
  upper:  '#A855F7',  // violet
  clouds: '#EC4899',  // pink
  sky:    '#38BDF8',  // sky blue
  ground: '#22C55E',  // green
};

const ZONE_LABEL: Record<AtmZone, { icon: string; text: string; color: string }> = {
  space:  { icon: '🌌', text: 'OUTER SPACE',      color: '#8B5CF6' },
  upper:  { icon: '🌫️', text: 'UPPER ATMOSPHERE', color: '#A855F7' },
  clouds: { icon: '☁️', text: 'CLOUD LAYER',      color: '#EC4899' },
  sky:    { icon: '🌤️', text: 'LOWER SKY',        color: '#38BDF8' },
  ground: { icon: '🌍', text: 'GROUND LEVEL',     color: '#22C55E' },
};

interface DecorItem { icon: string; opacity: number; size: number }

function getLeftDecor(gainDollars: number, ri: number): DecorItem[] {
  const z = getZone(gainDollars);
  if (z === 'space') {
    const a = ['✨', '⭐', '💫', '🌟', '✨', '⭐', '🌟', '💫', '✨', '🪐', '🌌', '💫', '⭐', '✨', '🌠'];
    const b = ['💫', '🌟', '✨', '⭐', '🪐', '💫', '✨', '🌟', '⭐', '✨', '🌌', '⭐', '💫', '🌟', '✨'];
    return [
      { icon: a[ri % a.length], opacity: 0.5 + (ri % 5) * 0.1, size: 10 + (ri % 5) * 3 },
      { icon: b[(ri + 4) % b.length], opacity: 0.4 + (ri % 4) * 0.1, size: 9 + (ri % 4) * 2 },
    ];
  }
  if (z === 'upper') {
    const a = ['⭐', '🌙', '✈️', '⭐', '🛩️', '🌙', '⭐', '🌫️', '🌙', '⭐', '✈️', '💫'];
    const b = ['🌙', '⭐', '🛸', '🌫️', '⭐', '🌙', '✈️', '⭐', '🌫️', '🛩️', '⭐', '🌙'];
    return [
      { icon: a[ri % a.length], opacity: 0.45 + (ri % 4) * 0.1, size: 13 + (ri % 3) * 2 },
      { icon: b[(ri + 3) % b.length], opacity: 0.3 + (ri % 3) * 0.1, size: 11 + (ri % 3) * 2 },
    ];
  }
  if (z === 'clouds') {
    const a = ['☁️', '⛅', '☁️', '🌧️', '☁️', '⛅', '☁️', '☁️', '🌦️', '☁️', '⛅', '☁️', '🌨️', '☁️'];
    const b = ['⛅', '☁️', '🌧️', '☁️', '☁️', '🌦️', '⛅', '☁️', '☁️', '🌧️', '⛅', '☁️', '☁️', '⛅'];
    return [
      { icon: a[ri % a.length], opacity: 0.65 + (ri % 4) * 0.08, size: 18 + (ri % 4) * 4 },
      { icon: b[(ri + 5) % b.length], opacity: 0.55 + (ri % 3) * 0.1, size: 14 + (ri % 4) * 3 },
    ];
  }
  if (z === 'sky') {
    const a = ['🌤️', '☁️', '☀️', '🌤️', '🐦', '☁️', '🌤️', '☀️', '🌈', '☁️', '🐦', '☀️'];
    const b = ['🐦', '🌤️', '☁️', '☀️', '🌤️', '🐦', '☀️', '☁️', '🌤️', '🐦', '☁️', null];
    const bIcon = b[(ri + 4) % b.length];
    const result: DecorItem[] = [{ icon: a[ri % a.length], opacity: 0.5 + (ri % 3) * 0.1, size: 14 + (ri % 3) * 2 }];
    if (bIcon) result.push({ icon: bIcon, opacity: 0.35 + (ri % 3) * 0.1, size: 12 + (ri % 3) * 2 });
    return result;
  }
  // ground
  const a = ['🌿', '🌱', '🌳', '💰', '🌿', '🌲', '🪙', '🌱', '🌾', '🌿', '🌵', '🍀', '🌿', '💐'];
  const b = ['🌱', '🌾', null, '🪙', '🌿', null, '🌱', '🌿', null, '🌳', null, '🌱', '🌿', null];
  const bIcon = b[(ri + 5) % b.length];
  const result: DecorItem[] = [{ icon: a[ri % a.length], opacity: 0.55 + (ri % 3) * 0.1, size: 14 + (ri % 3) * 2 }];
  if (bIcon) result.push({ icon: bIcon, opacity: 0.4 + (ri % 3) * 0.1, size: 11 + (ri % 3) * 2 });
  return result;
}

function getRightDecor(gainDollars: number, ri: number): DecorItem[] {
  const z = getZone(gainDollars);
  if (z === 'space') {
    const a = ['✨', '💫', '⭐', '🌟', '✨', '⭐', '💫', '🌌', '✨', '🌟', '🪐', '🌠', '💫', '⭐', '🌌'];
    const b = ['🌟', '✨', '🪐', '💫', '⭐', '🌌', '✨', '🌟', '💫', '✨', '⭐', '🌌', '🌟', '💫', '🪐'];
    return [
      { icon: a[ri % a.length], opacity: 0.5 + (ri % 5) * 0.1, size: 11 + (ri % 6) * 3 },
      { icon: b[(ri + 6) % b.length], opacity: 0.4 + (ri % 4) * 0.1, size: 9 + (ri % 4) * 2 },
    ];
  }
  if (z === 'upper') {
    const a = ['🌙', '⭐', '🛸', '🌫️', '⭐', '🌙', '✈️', '⭐', '🌫️', '🛩️', '⭐', '🌙'];
    const b = ['⭐', '🌙', '🌫️', '✈️', '⭐', '🌙', '🛩️', '🌫️', '⭐', '🌙', null, '✈️'];
    const bIcon = b[(ri + 3) % b.length];
    const result: DecorItem[] = [{ icon: a[ri % a.length], opacity: 0.4 + (ri % 3) * 0.1, size: 14 + (ri % 3) * 2 }];
    if (bIcon) result.push({ icon: bIcon, opacity: 0.3 + (ri % 3) * 0.1, size: 11 + (ri % 3) * 2 });
    return result;
  }
  if (z === 'clouds') {
    const a = ['☁️', '⛅', '☁️', '☁️', '🌧️', '☁️', '⛅', '☁️', '🌦️', '☁️', '☁️', '🌨️', '⛅', '☁️'];
    const b = ['🌧️', '☁️', '⛅', '☁️', '☁️', '🌦️', '☁️', '⛅', '🌧️', '☁️', '🌨️', '⛅', '☁️', '☁️'];
    return [
      { icon: a[ri % a.length], opacity: 0.6 + (ri % 4) * 0.08, size: 16 + (ri % 5) * 3 },
      { icon: b[(ri + 6) % b.length], opacity: 0.5 + (ri % 3) * 0.1, size: 13 + (ri % 4) * 3 },
    ];
  }
  if (z === 'sky') {
    const a = ['🌈', '🌤️', '☁️', '🐦', '☁️', '🌤️', '🌈', '🐦', '☀️', '☁️', '🌤️', '🐦'];
    const b = ['🐦', null, '🌤️', null, '🌈', null, '☁️', '🌤️', null, '🐦', null, '☁️'];
    const bIcon = b[(ri + 5) % b.length];
    const result: DecorItem[] = [{ icon: a[ri % a.length], opacity: 0.4 + (ri % 3) * 0.1, size: 13 + (ri % 3) * 2 }];
    if (bIcon) result.push({ icon: bIcon, opacity: 0.3 + (ri % 3) * 0.1, size: 11 + (ri % 3) * 2 });
    return result;
  }
  // ground
  const a = ['🍃', '🌾', '🌿', '🌳', '🍀', '🌾', '🍃', '🌱', '🌲', '🌿', '🍃', '🌾', '💐', '🌿'];
  const b = ['🌾', null, '🍃', null, '🌱', null, '🌿', '🍃', null, '🌾', null, '🌱', '🍃', null];
  const bIcon = b[(ri + 4) % b.length];
  const result: DecorItem[] = [{ icon: a[ri % a.length], opacity: 0.45 + (ri % 3) * 0.1, size: 13 + (ri % 3) * 2 }];
  if (bIcon) result.push({ icon: bIcon, opacity: 0.35 + (ri % 3) * 0.1, size: 11 + (ri % 3) * 2 });
  return result;
}

// ─── Scattered floating decorations across full row width ────────────────────

interface FloatDecor { icon: string; leftPct: number; topPct: number; opacity: number; size: number }

function getFloatingDecors(gainDollars: number, ri: number): FloatDecor[] {
  const z = getZone(gainDollars);
  // Dense x positions across full width — six interleaved rows + center fill
  const xRow1 = [3, 13, 24, 35, 62, 72, 82, 92];
  const xRow2 = [7, 17, 28, 60, 68, 78, 87, 95];
  const xRow3 = [5, 10, 19, 31, 64, 70, 80, 90];
  const xRow4 = [9, 15, 26, 38, 66, 75, 85, 93];
  const xRow5 = [2, 11, 22, 33, 61, 71, 83, 91];
  const xRow6 = [6, 16, 29, 37, 63, 73, 86, 96];
  // Center band — fills the middle of the screen (behind spine/labels)
  const xCenter = [40, 43, 46, 49, 52, 55, 58, 61];

  if (z === 'space') {
    const icons = ['✨', '⭐', '💫', '🌟', '🪐', '🌌', '🌠', '✨', '💫', '⭐', '🌟', '🪐', '✨', '🌌', '💫', '⭐'];
    const result: FloatDecor[] = [];
    xRow1.forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 3) % icons.length], leftPct, topPct: 5 + (i % 4) * 22, opacity: 0.3 + ((ri + i) % 6) * 0.1, size: 8 + ((ri + i) % 7) * 2 }));
    xRow2.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 7 + 6) % icons.length], leftPct, topPct: 55 + (i % 3) * 15, opacity: 0.25 + ((ri + i) % 5) * 0.1, size: 7 + ((ri + i) % 6) * 2 }));
    xRow3.forEach((leftPct, i) => result.push({ icon: icons[(ri * 7 + i * 4 + 2) % icons.length], leftPct, topPct: 15 + (i % 5) * 17, opacity: 0.28 + ((ri + i) % 5) * 0.1, size: 9 + ((ri + i) % 5) * 2 }));
    xRow4.forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 6 + 9) % icons.length], leftPct, topPct: 65 + (i % 3) * 12, opacity: 0.22 + ((ri + i) % 4) * 0.1, size: 7 + ((ri + i) % 5) * 2 }));
    xRow5.forEach((leftPct, i) => result.push({ icon: icons[(ri * 9 + i * 3 + 1) % icons.length], leftPct, topPct: 8 + (i % 6) * 15, opacity: 0.2 + ((ri + i) % 5) * 0.1, size: 8 + ((ri + i) % 6) * 2 }));
    xRow6.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 5 + 11) % icons.length], leftPct, topPct: 72 + (i % 3) * 10, opacity: 0.18 + ((ri + i) % 4) * 0.1, size: 7 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 6 + i * 4 + 7) % icons.length], leftPct, topPct: 5 + (i % 5) * 18, opacity: 0.45 + ((ri + i) % 4) * 0.1, size: 10 + ((ri + i) % 5) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 7 + 3) % icons.length], leftPct, topPct: 50 + (i % 4) * 13, opacity: 0.4 + ((ri + i) % 3) * 0.1, size: 9 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 9 + i * 3 + 5) % icons.length], leftPct, topPct: 28 + (i % 4) * 15, opacity: 0.42 + ((ri + i) % 4) * 0.1, size: 11 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 6 + 10) % icons.length], leftPct, topPct: 72 + (i % 3) * 10, opacity: 0.38 + ((ri + i) % 3) * 0.1, size: 9 + ((ri + i) % 3) * 2 }));
    return result;
  }

  if (z === 'upper') {
    const icons = ['⭐', '🌙', '✈️', '🌫️', '💫', '🛸', '🛩️', '🌙', '⭐', '🌫️', '💫', '🌙', '✈️', '⭐', '🌫️', '🛸'];
    const result: FloatDecor[] = [];
    xRow1.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 3) % icons.length], leftPct, topPct: 8 + (i % 4) * 20, opacity: 0.25 + ((ri + i) % 5) * 0.1, size: 9 + ((ri + i) % 6) * 2 }));
    xRow2.forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 5 + 4) % icons.length], leftPct, topPct: 50 + (i % 3) * 18, opacity: 0.2 + ((ri + i) % 4) * 0.1, size: 8 + ((ri + i) % 5) * 2 }));
    xRow3.forEach((leftPct, i) => result.push({ icon: icons[(ri * 6 + i * 2 + 3) % icons.length], leftPct, topPct: 18 + (i % 4) * 18, opacity: 0.2 + ((ri + i) % 4) * 0.1, size: 8 + ((ri + i) % 5) * 2 }));
    xRow4.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 4 + 7) % icons.length], leftPct, topPct: 60 + (i % 3) * 14, opacity: 0.18 + ((ri + i) % 3) * 0.1, size: 7 + ((ri + i) % 4) * 2 }));
    xRow5.forEach((leftPct, i) => result.push({ icon: icons[(ri * 8 + i * 3 + 5) % icons.length], leftPct, topPct: 25 + (i % 4) * 16, opacity: 0.18 + ((ri + i) % 3) * 0.1, size: 7 + ((ri + i) % 4) * 2 }));
    xRow6.slice(0, 6).forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 2 + 10) % icons.length], leftPct, topPct: 70 + (i % 2) * 15, opacity: 0.15 + ((ri + i) % 3) * 0.1, size: 7 + ((ri + i) % 3) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 5 + 6) % icons.length], leftPct, topPct: 8 + (i % 4) * 20, opacity: 0.4 + ((ri + i) % 4) * 0.1, size: 10 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 7 + i * 3 + 9) % icons.length], leftPct, topPct: 55 + (i % 3) * 15, opacity: 0.35 + ((ri + i) % 3) * 0.1, size: 9 + ((ri + i) % 3) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 11 + i * 4 + 2) % icons.length], leftPct, topPct: 30 + (i % 5) * 14, opacity: 0.38 + ((ri + i) % 3) * 0.1, size: 10 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 6 + 13) % icons.length], leftPct, topPct: 75 + (i % 2) * 13, opacity: 0.32 + ((ri + i) % 3) * 0.1, size: 8 + ((ri + i) % 3) * 2 }));
    return result;
  }

  if (z === 'clouds') {
    const icons = ['☁️', '⛅', '☁️', '☁️', '🌧️', '⛅', '🌦️', '☁️', '🌨️', '☁️', '⛅', '☁️', '☁️', '🌧️', '⛅', '☁️'];
    const result: FloatDecor[] = [];
    xRow1.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 2) % icons.length], leftPct, topPct: 5 + (i % 5) * 18, opacity: 0.45 + ((ri + i) % 5) * 0.1, size: 14 + ((ri + i) % 6) * 3 }));
    xRow2.forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 3 + 5) % icons.length], leftPct, topPct: 50 + (i % 4) * 13, opacity: 0.4 + ((ri + i) % 4) * 0.1, size: 12 + ((ri + i) % 5) * 3 }));
    xRow3.forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 4 + 1) % icons.length], leftPct, topPct: 12 + (i % 4) * 20, opacity: 0.42 + ((ri + i) % 4) * 0.1, size: 13 + ((ri + i) % 5) * 3 }));
    xRow4.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 2 + 8) % icons.length], leftPct, topPct: 58 + (i % 3) * 14, opacity: 0.38 + ((ri + i) % 4) * 0.1, size: 11 + ((ri + i) % 5) * 3 }));
    xRow5.forEach((leftPct, i) => result.push({ icon: icons[(ri * 7 + i * 3 + 2) % icons.length], leftPct, topPct: 22 + (i % 5) * 15, opacity: 0.36 + ((ri + i) % 4) * 0.1, size: 12 + ((ri + i) % 4) * 3 }));
    xRow6.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 5 + 6) % icons.length], leftPct, topPct: 65 + (i % 3) * 12, opacity: 0.34 + ((ri + i) % 3) * 0.1, size: 11 + ((ri + i) % 4) * 3 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 4 + 8) % icons.length], leftPct, topPct: 5 + (i % 5) * 18, opacity: 0.5 + ((ri + i) % 4) * 0.1, size: 16 + ((ri + i) % 5) * 3 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 6 + 4) % icons.length], leftPct, topPct: 55 + (i % 3) * 15, opacity: 0.45 + ((ri + i) % 3) * 0.1, size: 14 + ((ri + i) % 4) * 3 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 8 + i * 3 + 11) % icons.length], leftPct, topPct: 25 + (i % 4) * 17, opacity: 0.48 + ((ri + i) % 4) * 0.1, size: 15 + ((ri + i) % 4) * 3 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 6 + i * 5 + 7) % icons.length], leftPct, topPct: 72 + (i % 3) * 10, opacity: 0.42 + ((ri + i) % 3) * 0.1, size: 13 + ((ri + i) % 4) * 3 }));
    return result;
  }

  if (z === 'sky') {
    const icons = ['🌤️', '☁️', '☀️', '🐦', '🌈', '☁️', '🌤️', '🐦', '☀️', '☁️', '🌈', '🌤️', '🐦', '☀️', '☁️', '🌤️'];
    const result: FloatDecor[] = [];
    xRow1.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 3) % icons.length], leftPct, topPct: 10 + (i % 4) * 22, opacity: 0.28 + ((ri + i) % 5) * 0.1, size: 10 + ((ri + i) % 5) * 2 }));
    xRow2.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 4 + 6) % icons.length], leftPct, topPct: 55 + (i % 3) * 15, opacity: 0.22 + ((ri + i) % 4) * 0.1, size: 9 + ((ri + i) % 4) * 2 }));
    xRow3.forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 3 + 2) % icons.length], leftPct, topPct: 20 + (i % 5) * 16, opacity: 0.24 + ((ri + i) % 4) * 0.1, size: 9 + ((ri + i) % 4) * 2 }));
    xRow4.forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 5 + 9) % icons.length], leftPct, topPct: 62 + (i % 3) * 13, opacity: 0.2 + ((ri + i) % 3) * 0.1, size: 8 + ((ri + i) % 4) * 2 }));
    xRow5.forEach((leftPct, i) => result.push({ icon: icons[(ri * 6 + i * 4 + 4) % icons.length], leftPct, topPct: 30 + (i % 4) * 15, opacity: 0.2 + ((ri + i) % 3) * 0.1, size: 8 + ((ri + i) % 4) * 2 }));
    xRow6.slice(0, 6).forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 3 + 8) % icons.length], leftPct, topPct: 70 + (i % 2) * 15, opacity: 0.18 + ((ri + i) % 3) * 0.1, size: 7 + ((ri + i) % 3) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 4 + 5) % icons.length], leftPct, topPct: 8 + (i % 5) * 18, opacity: 0.38 + ((ri + i) % 4) * 0.1, size: 11 + ((ri + i) % 5) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 6 + i * 2 + 9) % icons.length], leftPct, topPct: 55 + (i % 3) * 15, opacity: 0.34 + ((ri + i) % 3) * 0.1, size: 10 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 10 + i * 3 + 7) % icons.length], leftPct, topPct: 28 + (i % 4) * 16, opacity: 0.36 + ((ri + i) % 3) * 0.1, size: 10 + ((ri + i) % 4) * 2 }));
    xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 7 + i * 5 + 12) % icons.length], leftPct, topPct: 72 + (i % 2) * 14, opacity: 0.3 + ((ri + i) % 3) * 0.1, size: 9 + ((ri + i) % 3) * 2 }));
    return result;
  }

  // ground — trees, grass, flowers, coins
  const icons = ['🌿', '🌱', '🌳', '🌾', '🍀', '🌵', '💐', '🌲', '🌿', '🌱', '🌾', '🍃', '🌳', '💰', '🌿', '🌾'];
  const result: FloatDecor[] = [];
  xRow1.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 2) % icons.length], leftPct, topPct: 20 + (i % 4) * 20, opacity: 0.28 + ((ri + i) % 4) * 0.1, size: 10 + ((ri + i) % 5) * 2 }));
  xRow2.forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 4 + 5) % icons.length], leftPct, topPct: 55 + (i % 2) * 25, opacity: 0.22 + ((ri + i) % 3) * 0.1, size: 9 + ((ri + i) % 4) * 2 }));
  xRow3.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 3 + 3) % icons.length], leftPct, topPct: 30 + (i % 4) * 18, opacity: 0.24 + ((ri + i) % 3) * 0.1, size: 9 + ((ri + i) % 4) * 2 }));
  xRow4.forEach((leftPct, i) => result.push({ icon: icons[(ri * 3 + i * 2 + 7) % icons.length], leftPct, topPct: 65 + (i % 2) * 20, opacity: 0.2 + ((ri + i) % 3) * 0.1, size: 8 + ((ri + i) % 4) * 2 }));
  xRow5.forEach((leftPct, i) => result.push({ icon: icons[(ri * 5 + i * 4 + 2) % icons.length], leftPct, topPct: 40 + (i % 3) * 18, opacity: 0.2 + ((ri + i) % 3) * 0.1, size: 8 + ((ri + i) % 4) * 2 }));
  xRow6.slice(0, 6).forEach((leftPct, i) => result.push({ icon: icons[(ri * 2 + i * 5 + 6) % icons.length], leftPct, topPct: 72 + (i % 2) * 16, opacity: 0.18 + ((ri + i) % 2) * 0.1, size: 7 + ((ri + i) % 3) * 2 }));
  xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 4 + i * 3 + 4) % icons.length], leftPct, topPct: 10 + (i % 4) * 20, opacity: 0.36 + ((ri + i) % 3) * 0.1, size: 11 + ((ri + i) % 4) * 2 }));
  xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 7 + i * 2 + 8) % icons.length], leftPct, topPct: 55 + (i % 3) * 15, opacity: 0.32 + ((ri + i) % 3) * 0.1, size: 10 + ((ri + i) % 3) * 2 }));
  xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 9 + i * 4 + 6) % icons.length], leftPct, topPct: 30 + (i % 5) * 14, opacity: 0.34 + ((ri + i) % 3) * 0.1, size: 10 + ((ri + i) % 4) * 2 }));
  xCenter.forEach((leftPct, i) => result.push({ icon: icons[(ri * 6 + i * 3 + 11) % icons.length], leftPct, topPct: 75 + (i % 2) * 14, opacity: 0.3 + ((ri + i) % 2) * 0.1, size: 9 + ((ri + i) % 3) * 2 }));
  return result;
}

// ─── Pulsing dot (current position) ─────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, transform: [{ scale }] }]} />;
}

// ─── Zone banner row ─────────────────────────────────────────────────────────

function ZoneBanner({ zone }: { zone: AtmZone }) {
  const { icon, text, color } = ZONE_LABEL[zone];
  return (
    <LinearGradient
      colors={[`${color}00`, `${color}28`, `${color}00`]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.zoneBanner}
    >
      <View style={[styles.zoneBannerLine, { backgroundColor: `${color}66` }]} />
      <View style={[styles.zoneBannerPill, { backgroundColor: `${color}30`, borderWidth: 1, borderColor: `${color}55` }]}>
        <Text style={styles.zoneBannerIcon}>{icon}</Text>
        <Text style={[styles.zoneBannerText, { color }]}>{text}</Text>
      </View>
      <View style={[styles.zoneBannerLine, { backgroundColor: `${color}66` }]} />
    </LinearGradient>
  );
}

// ─── Single-reward card ──────────────────────────────────────────────────────

interface RewardCardProps {
  reward: TrophyReward;
  unlocked: boolean;
}

function RewardCard({ reward, unlocked }: RewardCardProps) {
  const isAvatar = reward.type === 'avatar';
  const typeColor = isAvatar ? Colors.brand.primary : Colors.brand.accent;

  return (
    <View style={[styles.rewardCard, !unlocked && styles.rewardCardLocked]}>
      <LinearGradient
        colors={unlocked ? [reward.color, `${reward.color}44`] : ['#1A2235', '#111827']}
        style={styles.rewardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header row: gain threshold + type pill */}
        <View style={styles.rewardHeader}>
          <View style={[styles.gainTag, { backgroundColor: unlocked ? reward.color : Colors.bg.tertiary }]}>
            <Text style={styles.gainTagText}>
              {reward.gainThreshold === 0 ? 'START' : `+$${reward.gainThreshold.toLocaleString()}`}
            </Text>
          </View>
          <View style={[styles.typePill, { backgroundColor: `${typeColor}22` }]}>
            <Text style={[styles.typePillText, { color: typeColor }]}>
              {isAvatar ? '🎨 AVATAR' : '🐾 PET'}
            </Text>
          </View>
        </View>

        {/* Reward item */}
        <View style={styles.rewardSingle}>
          <View style={[styles.rewardFrame, { borderColor: unlocked ? reward.color : `${reward.color}40` }]}>
            <Text style={[styles.rewardEmoji, !unlocked && { opacity: 0.45 }]}>
              {reward.emoji}
            </Text>
            {!unlocked && (
              <View style={styles.rewardLockOverlay}>
                <Text style={styles.rewardLockIcon}>🔒</Text>
              </View>
            )}
          </View>
          <Text style={[styles.rewardName, !unlocked && styles.lockedText]}>
            {reward.name}
          </Text>
          {!unlocked && (
            <Text style={styles.rewardTypeHint}>
              {reward.type === 'avatar' ? '🎨 Avatar' : '🐾 Pet'}
            </Text>
          )}
        </View>

        {!unlocked && (
          <Text style={styles.unlockHint}>
            🔒 Earn +${reward.gainThreshold.toLocaleString()} to unlock
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function TrophyRoadScreen() {
  const { user, portfolio, bling, isSidebarOpen, setSidebarOpen } = useAppStore();
  const scrollRef = useRef<ScrollView>(null);

  const currentGainDollars = portfolio?.totalGainLoss ?? 0;
  const currentLevel       = user?.level ?? 1;
  const xpInfo             = getXPProgress(user?.xp ?? 0);
  const levelColor         = getLevelColor(currentLevel);

  // Profile avatar and pet
  const avatarReward  = getCurrentAvatar(currentGainDollars);
  const petReward     = getCurrentPet(currentGainDollars);

  const scrollToMe = useCallback(() => {
    // For $0 gains just jump straight to the bottom (the Start node)
    if (currentGainDollars <= 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
      return;
    }
    const idx = [...MILESTONES].reverse()
      .findIndex(m => currentGainDollars >= m && currentGainDollars < m + 100);
    const ROW_H = SEGMENT_H * 2 + NODE_SIZE; // ≈ 116px per row
    // Reward-card rows (every $1,000) are ~180px taller; account for those above idx
    const rewardRowsAbove = Math.floor((MAX_GAIN_DOLLARS - currentGainDollars) / 1000);
    const targetY = Math.max(0, (idx - 2) * ROW_H + rewardRowsAbove * 180);
    scrollRef.current?.scrollTo({ y: targetY, animated: true });
  }, [currentGainDollars]);

  // Scroll to current position on mount
  useEffect(() => {
    const timer = setTimeout(scrollToMe, 400);
    return () => clearTimeout(timer);
  }, [scrollToMe]);

  // Build reversed milestone list with zone-transition markers
  const reversedMilestones = [...MILESTONES].reverse();

  return (
    <View style={styles.container}>
      <AppHeader title="Trophy Road" />

      {/* ── Status Header ── */}
      <LinearGradient
        colors={['#0D1830', '#0A1225', Colors.bg.primary]}
        style={styles.header}
      >
        {/* Bling balance badge */}
        <View style={styles.blingBadge}>
          <Text style={styles.blingEmoji}>💎</Text>
          <Text style={styles.blingText}>{bling.toLocaleString()}</Text>
        </View>

        <Text style={styles.headerSub}>Grow your portfolio to unlock rewards</Text>

        {/* Current status card */}
        <View style={styles.statusCard}>
          {/* Avatar bubble with pet badge */}
          <View style={[styles.avatarBubble, { borderColor: levelColor }]}>
            <Text style={styles.avatarEmoji}>{avatarReward.emoji}</Text>
            {petReward && (
              <View style={[styles.petBadge, { backgroundColor: petReward.color }]}>
                <Text style={styles.petEmoji}>{petReward.emoji}</Text>
              </View>
            )}
          </View>

          <View style={styles.statusInfo}>
            <View style={[styles.levelPill, { backgroundColor: levelColor }]}>
              <Text style={styles.levelPillText}>Level {currentLevel}</Text>
            </View>
            <Text style={styles.statusName}>{getLevelName(currentLevel)}</Text>
            <Text style={styles.statusGain}>
              Gains: {currentGainDollars >= 0 ? '+' : ''}{formatCurrency(currentGainDollars)}
            </Text>
            {xpInfo.nextLevel && (
              <Text style={styles.statusNext}>
                {xpInfo.xpInLevel} / {xpInfo.xpNeeded} XP to Lv.{xpInfo.nextLevel.level}
              </Text>
            )}
          </View>
        </View>

        {/* Reward summary pills */}
        <View style={styles.rewardSummary}>
          <View style={[styles.summaryPill, { borderColor: `${Colors.brand.primary}44` }]}>
            <Text style={styles.summaryEmoji}>{avatarReward.emoji}</Text>
            <Text style={[styles.summaryLabel, { color: Colors.brand.primary }]}>
              {avatarReward.name}
            </Text>
          </View>
          {petReward ? (
            <View style={[styles.summaryPill, { borderColor: `${Colors.brand.accent}44` }]}>
              <Text style={styles.summaryEmoji}>{petReward.emoji}</Text>
              <Text style={[styles.summaryLabel, { color: Colors.brand.accent }]}>
                {petReward.name}
              </Text>
            </View>
          ) : (
            <View style={[styles.summaryPill, styles.summaryPillLocked]}>
              <Text style={styles.summaryEmoji}>🐾</Text>
              <Text style={styles.summaryLabelLocked}>Earn +$1,000 for a pet</Text>
            </View>
          )}
        </View>

        {/* XP bar */}
        <View style={styles.xpBarOuter}>
          <Animated.View
            style={[
              styles.xpBarInner,
              { width: `${Math.min(xpInfo.progress * 100, 100)}%`, backgroundColor: levelColor },
            ]}
          />
        </View>
      </LinearGradient>

      {/* ── Road + floating button ── */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={styles.road}
          contentContainerStyle={styles.roadContent}
          showsVerticalScrollIndicator={false}
        >
          {reversedMilestones.map((gainDollars, revIdx) => {
            const isAchieved  = currentGainDollars >= gainDollars;
            const isCurrent   = currentGainDollars >= gainDollars && currentGainDollars < gainDollars + 100;
            const reward      = rewardAtGain(gainDollars);
            const isFirst     = revIdx === MILESTONES.length - 1;
            const isLast      = revIdx === 0;

            // Detect zone transitions (show banner when zone changes going downward in render)
            const prevGain    = gainDollars + 100;
            const zoneChanged = revIdx > 0 && getZone(gainDollars) !== getZone(prevGain);
            const zone        = getZone(gainDollars);
            const rowBg       = getRowBg(gainDollars);
            const zoneAccent  = ZONE_ACCENT[zone];

            const leftD    = getLeftDecor(gainDollars, revIdx);
            const rightD   = getRightDecor(gainDollars, revIdx);
            const floatD   = getFloatingDecors(gainDollars, revIdx);

            // Spine colours driven by zone accent
            const segmentColor  = isAchieved ? zoneAccent : `${zoneAccent}20`;
            const nodeBorderCol = isCurrent ? levelColor : isAchieved ? zoneAccent : `${zoneAccent}35`;
            const nodeBgCol     = isCurrent ? `${levelColor}33` : isAchieved ? `${zoneAccent}22` : Colors.bg.secondary;

            return (
              <React.Fragment key={gainDollars}>
                {/* Zone transition banner */}
                {zoneChanged && <ZoneBanner zone={zone} />}

                <View style={[styles.milestoneRow, { backgroundColor: rowBg }]}>

                  {/* Full-width floating atmosphere decorations */}
                  {floatD.map((d, i) => (
                    <Text
                      key={`f${i}`}
                      pointerEvents="none"
                      style={[styles.floatDecor, {
                        left: `${d.leftPct}%` as any,
                        top: `${d.topPct}%` as any,
                        opacity: d.opacity,
                        fontSize: d.size,
                      }]}
                    >
                      {d.icon}
                    </Text>
                  ))}

                  {/* Zone accent left strip */}
                  <View style={[styles.zoneAccentStrip, { backgroundColor: isAchieved ? zoneAccent : `${zoneAccent}25` }]} />

                  {/* Left atmosphere decoration */}
                  <View style={styles.leftDecorCol}>
                    {leftD.map((d, i) => (
                      <Text key={i} style={[styles.leftDecorEmoji, { opacity: d.opacity, fontSize: d.size }]}>
                        {d.icon}
                      </Text>
                    ))}
                  </View>

                  {/* Road spine */}
                  <View style={styles.spineCol}>
                    {!isLast && (
                      <View style={[styles.segment, { backgroundColor: segmentColor }]} />
                    )}
                    <View style={[
                      styles.node,
                      { borderColor: nodeBorderCol, backgroundColor: nodeBgCol },
                      isCurrent && styles.nodeCurrent,
                    ]}>
                      {isCurrent
                        ? <PulsingDot color={levelColor} />
                        : <Text style={[styles.nodeCheck, { color: zoneAccent, opacity: isAchieved ? 1 : 0.2 }]}>
                            {isAchieved ? '✓' : ''}
                          </Text>
                      }
                    </View>
                    {!isFirst && (
                      <View style={[styles.segment, { backgroundColor: segmentColor }]} />
                    )}
                  </View>

                  {/* Milestone label */}
                  <View style={styles.milestoneInfo}>
                    <View style={isAchieved && !isCurrent
                      ? [styles.gainPill, { backgroundColor: `${zoneAccent}20`, borderColor: `${zoneAccent}40` }]
                      : undefined}>
                      <Text style={[
                        styles.milestonePct,
                        isAchieved ? [styles.milestonePctDone, { color: isCurrent ? levelColor : zoneAccent }] : styles.milestonePctLocked,
                        isCurrent && { fontWeight: FontWeight.extrabold },
                      ]}>
                        {gainDollars === 0 ? 'Start' : `+$${gainDollars.toLocaleString()}`}
                      </Text>
                    </View>
                    {gainDollars > 0 && (
                      <View style={[styles.xpPill, { backgroundColor: `${zoneAccent}20`, borderColor: `${zoneAccent}40` }]}>
                        <Text style={[styles.milestoneXP, { color: zoneAccent, opacity: isAchieved ? 1 : 0.35 }]}>
                          +{XP_PER_100} XP
                        </Text>
                      </View>
                    )}
                    {isCurrent && (
                      <View style={[styles.hereBadge, { backgroundColor: levelColor }]}>
                        <Text style={styles.hereText}>YOU ARE HERE</Text>
                      </View>
                    )}
                  </View>

                  {/* Reward card or right atmosphere decor */}
                  {reward ? (
                    <View style={styles.rewardCol}>
                      <RewardCard reward={reward} unlocked={currentGainDollars >= reward.gainThreshold} />
                    </View>
                  ) : rightD.length > 0 ? (
                    <View style={styles.rightDecorCol}>
                      {rightD.map((d, i) => (
                        <Text key={i} style={[styles.rightDecorEmoji, { opacity: d.opacity, fontSize: d.size }]}>
                          {d.icon}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </React.Fragment>
            );
          })}

          <View style={styles.bottomPad} />
        </ScrollView>

        {/* ── Scroll-to-me FAB ── */}
        <TouchableOpacity
          style={[styles.locateMeBtn, { borderColor: `${levelColor}66`, backgroundColor: `${levelColor}18` }]}
          onPress={scrollToMe}
          activeOpacity={0.75}
        >
          <Text style={styles.locateMeEmoji}>📍</Text>
          <Text style={[styles.locateMeText, { color: levelColor }]}>ME</Text>
        </TouchableOpacity>
      </View>
      <Sidebar visible={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const NODE_SIZE  = 32;
const SEGMENT_H  = 42;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8A4C00' },

  // Header
  header: {
    paddingTop: 54,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: 4,
    alignItems: 'center',
  },

  // Bling badge (top-right corner of header)
  blingBadge: {
    position: 'absolute',
    top: 54,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `rgba(245,197,24,0.15)`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `rgba(245,197,24,0.4)`,
  },
  blingEmoji: { fontSize: 14 },
  blingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#F5C518',
  },

  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
  },
  headerSub: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: 8 },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radius.xl,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  avatarBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  avatarEmoji: { fontSize: 30 },
  petBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg.primary,
  },
  petEmoji: { fontSize: 14 },

  statusInfo: { flex: 1, gap: 3 },
  levelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginBottom: 2,
  },
  levelPillText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  statusName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text.primary },
  statusGain: { fontSize: FontSize.xs, color: Colors.brand.accent },
  statusNext: { fontSize: FontSize.xs, color: Colors.text.tertiary },

  rewardSummary: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  summaryPillLocked: { borderColor: Colors.border.default },
  summaryEmoji: { fontSize: 16 },
  summaryLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, flex: 1 },
  summaryLabelLocked: { fontSize: FontSize.xs, color: Colors.text.tertiary, flex: 1 },

  xpBarOuter: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  xpBarInner: { height: '100%', borderRadius: 3 },

  // Road
  road: { flex: 1 },
  roadContent: { paddingTop: Spacing.lg, paddingLeft: 4, paddingRight: Spacing.base },

  // Zone banner
  zoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'transparent',
    marginBottom: 2,
  },
  zoneBannerLine: { flex: 1, height: 1 },
  zoneBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  zoneBannerIcon: { fontSize: 13 },
  zoneBannerText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.2,
  },

  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: NODE_SIZE + 2,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },

  // Absolutely positioned floating decoration scattered across the row
  floatDecor: {
    position: 'absolute',
    zIndex: 1,
  },

  // Thin coloured strip on the left edge of each row indicating the zone
  zoneAccentStrip: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: NODE_SIZE + 2,
    flexShrink: 0,
  },

  // Pill wrapper for achieved milestone labels
  gainPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginBottom: 1,
  },

  // Pill wrapper for XP labels
  xpPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  // Left atmosphere decor column
  leftDecorCol: {
    width: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SEGMENT_H + NODE_SIZE / 2 - 8,
    gap: 2,
    flexShrink: 0,
  },
  leftDecorEmoji: { textAlign: 'center' },

  // Right atmosphere decor column (used when no reward card)
  rightDecorCol: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: SEGMENT_H + NODE_SIZE / 2 - 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingRight: 6,
    gap: 3,
  },
  rightDecorEmoji: { textAlign: 'center' },

  // Spine
  spineCol: { alignItems: 'center', width: NODE_SIZE, flexShrink: 0 },
  segment: {
    width: 3,
    height: SEGMENT_H,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 2,
  },
  segmentDone: { backgroundColor: Colors.brand.primary },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2.5,
    borderColor: Colors.bg.tertiary,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nodeDone: {
    borderColor: Colors.brand.primary,
    backgroundColor: `${Colors.brand.primary}22`,
  },
  nodeCurrent: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nodeCheck: { fontSize: 14, color: Colors.brand.primary, fontWeight: FontWeight.bold },

  // Milestone text
  milestoneInfo: {
    paddingTop: SEGMENT_H + NODE_SIZE / 2 - 10,
    flex: 1,
    gap: 2,
  },
  milestonePct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  milestonePctDone: { color: Colors.text.primary },
  milestonePctLocked: { color: Colors.text.tertiary },
  milestoneXP: { fontSize: FontSize.xs, color: Colors.brand.accent },
  hereBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginTop: 3,
  },
  hereText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    letterSpacing: 0.8,
  },

  // Reward card
  rewardCol: { flex: 2, paddingTop: SEGMENT_H - 6 },
  rewardCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: 8,
  },
  rewardCardLocked: { opacity: 0.7 },
  rewardGradient: { padding: 10, gap: 8 },

  rewardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gainTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  gainTagText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    flex: 1,
    alignItems: 'center',
  },
  typePillText: { fontSize: 10, fontWeight: FontWeight.bold },

  rewardSingle: { alignItems: 'center', gap: 4 },
  rewardFrame: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rewardLockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardLockIcon: { fontSize: 10 },
  rewardEmoji: { fontSize: 26 },
  rewardName: {
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  rewardTypeHint: {
    fontSize: 9,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  lockedText: { color: Colors.text.secondary },
  unlockHint: { fontSize: FontSize.xs, color: Colors.text.tertiary, textAlign: 'center', fontStyle: 'italic' },

  // Scroll-to-me FAB
  locateMeBtn: {
    position: 'absolute',
    right: 14,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  locateMeEmoji: { fontSize: 18, lineHeight: 22 },
  locateMeText: {
    fontSize: 8,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
    lineHeight: 10,
  },

  bottomPad: { height: 100 },
});
