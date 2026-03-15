// CapitalQuest Theme — Charles Schwab-inspired, dark-first professional palette

export const Colors = {
  // Core backgrounds (Schwab dark theme)
  bg: {
    primary: '#0A0E1A',      // deepest background
    secondary: '#111827',    // card background
    tertiary: '#1A2235',     // elevated card
    input: '#1E2940',        // input fields
    overlay: 'rgba(0,0,0,0.75)',
  },

  // Brand
  brand: {
    primary: '#00B3E6',      // Schwab-style blue
    accent: '#00D4AA',       // teal/green accent
    gold: '#F5C518',         // achievement gold
    purple: '#7C3AED',       // level/XP purple
  },

  // Market colors
  market: {
    gain: '#00C853',         // green — up
    gainLight: '#00E676',
    gainBg: 'rgba(0,200,83,0.12)',
    loss: '#FF3D57',         // red — down
    lossLight: '#FF6B7A',
    lossBg: 'rgba(255,61,87,0.12)',
    neutral: '#64748B',
  },

  // Text
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0A0E1A',
    link: '#00B3E6',
  },

  // Borders
  border: {
    default: '#1E2940',
    subtle: '#111827',
    focus: '#00B3E6',
  },

  // Charts
  chart: {
    line: '#00B3E6',
    area: 'rgba(0,179,230,0.1)',
    grid: '#1E2940',
  },

  // Levels
  levels: [
    '#94A3B8', // 1  — Beginner
    '#60A5FA', // 2  — Novice
    '#34D399', // 3  — Apprentice
    '#F59E0B', // 4  — Trader
    '#F97316', // 5  — Pro Trader
    '#EF4444', // 6  — Expert
    '#8B5CF6', // 7  — Master
    '#EC4899', // 8  — Elite
    '#F5C518', // 9  — Legend
    '#00D4AA', // 10 — Wolf of Wall Street
  ],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#00B3E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};
