/**
 * Trophy Road Rewards
 *
 * Rewards unlock every $1,000 gain (every 2 milestones of $500).
 * Odd-indexed rewards are avatars, even-indexed are pets — never both at once.
 * Level 1 (0 gain) always gives the first avatar, used as the player's profile icon.
 */

export interface TrophyReward {
  gainThreshold: number; // $ gain required to unlock (0, 1000, 2000, ...)
  type: 'avatar' | 'pet';
  emoji: string;
  name: string;
  color: string;
}

export const TROPHY_REWARDS: TrophyReward[] = [
  // ── $0–$9,000 ───────────────────────────────────────────────────────────────
  { gainThreshold: 0,     type: 'avatar', emoji: '🌱', name: 'Seedling',           color: '#94A3B8' },
  { gainThreshold: 1000,  type: 'pet',    emoji: '🐣', name: 'Market Chick',        color: '#60A5FA' },
  { gainThreshold: 2000,  type: 'avatar', emoji: '📈', name: 'Bull Rider',          color: '#34D399' },
  { gainThreshold: 3000,  type: 'pet',    emoji: '🐯', name: 'Tiger Cub',           color: '#F59E0B' },
  { gainThreshold: 4000,  type: 'avatar', emoji: '⚡', name: 'Flash Trader',        color: '#F97316' },
  { gainThreshold: 5000,  type: 'pet',    emoji: '🐉', name: 'Baby Dragon',         color: '#EF4444' },
  { gainThreshold: 6000,  type: 'avatar', emoji: '🎯', name: 'Precision Trader',    color: '#8B5CF6' },
  { gainThreshold: 7000,  type: 'pet',    emoji: '🦅', name: 'Eagle Scout',         color: '#EC4899' },
  { gainThreshold: 8000,  type: 'avatar', emoji: '💎', name: 'Diamond Hands',       color: '#F5C518' },
  { gainThreshold: 9000,  type: 'pet',    emoji: '🦊', name: 'Quick Fox',           color: '#00D4AA' },
  // ── $10,000–$19,000 ─────────────────────────────────────────────────────────
  { gainThreshold: 10000, type: 'avatar', emoji: '🏆', name: 'Champion',            color: '#06B6D4' },
  { gainThreshold: 11000, type: 'pet',    emoji: '🦁', name: 'Little Lion',         color: '#84CC16' },
  { gainThreshold: 12000, type: 'avatar', emoji: '👑', name: 'Trading King',        color: '#F43F5E' },
  { gainThreshold: 13000, type: 'pet',    emoji: '🐺', name: 'Wall St Wolf',        color: '#A855F7' },
  { gainThreshold: 14000, type: 'avatar', emoji: '🔥', name: 'Market Flame',        color: '#0EA5E9' },
  { gainThreshold: 15000, type: 'pet',    emoji: '🐬', name: 'Dolphin',             color: '#22C55E' },
  { gainThreshold: 16000, type: 'avatar', emoji: '🚀', name: 'Rocket Trader',       color: '#EAB308' },
  { gainThreshold: 17000, type: 'pet',    emoji: '🐆', name: 'Speed Leopard',       color: '#FB923C' },
  { gainThreshold: 18000, type: 'avatar', emoji: '🌟', name: 'Rising Star',         color: '#6366F1' },
  { gainThreshold: 19000, type: 'pet',    emoji: '🦉', name: 'Wise Owl',            color: '#14B8A6' },
  // ── $20,000–$29,000 ─────────────────────────────────────────────────────────
  { gainThreshold: 20000, type: 'avatar', emoji: '🔮', name: 'Oracle',              color: '#F59E0B' },
  { gainThreshold: 21000, type: 'pet',    emoji: '🦋', name: 'Growth Butterfly',    color: '#EF4444' },
  { gainThreshold: 22000, type: 'avatar', emoji: '⚔️', name: 'Market Warrior',      color: '#8B5CF6' },
  { gainThreshold: 23000, type: 'pet',    emoji: '🐋', name: 'Whale',               color: '#60A5FA' },
  { gainThreshold: 24000, type: 'avatar', emoji: '🎩', name: 'Top Hat',             color: '#34D399' },
  { gainThreshold: 25000, type: 'pet',    emoji: '🦒', name: 'Long View',           color: '#94A3B8' },
  { gainThreshold: 26000, type: 'avatar', emoji: '🧠', name: 'Big Brain',           color: '#EC4899' },
  { gainThreshold: 27000, type: 'pet',    emoji: '🐘', name: 'Bull Elephant',       color: '#00D4AA' },
  { gainThreshold: 28000, type: 'avatar', emoji: '🏹', name: 'Archer',              color: '#06B6D4' },
  { gainThreshold: 29000, type: 'pet',    emoji: '🐊', name: 'Croc',                color: '#84CC16' },
  // ── $30,000–$39,000 ─────────────────────────────────────────────────────────
  { gainThreshold: 30000, type: 'avatar', emoji: '🌊', name: 'Wave Rider',          color: '#F43F5E' },
  { gainThreshold: 31000, type: 'pet',    emoji: '🦚', name: 'Peacock',             color: '#A855F7' },
  { gainThreshold: 32000, type: 'avatar', emoji: '🎓', name: 'Scholar',             color: '#0EA5E9' },
  { gainThreshold: 33000, type: 'pet',    emoji: '🦩', name: 'Flamingo',            color: '#22C55E' },
  { gainThreshold: 34000, type: 'avatar', emoji: '🌙', name: 'Moon Shot',           color: '#EAB308' },
  { gainThreshold: 35000, type: 'pet',    emoji: '🐼', name: 'Panda Bear',          color: '#FB923C' },
  { gainThreshold: 36000, type: 'avatar', emoji: '🧙', name: 'Wizard',              color: '#6366F1' },
  { gainThreshold: 37000, type: 'pet',    emoji: '🦄', name: 'Unicorn',             color: '#14B8A6' },
  { gainThreshold: 38000, type: 'avatar', emoji: '🦸', name: 'Market Hero',         color: '#F59E0B' },
  { gainThreshold: 39000, type: 'pet',    emoji: '🐙', name: 'Octopus',             color: '#EF4444' },
  // ── $40,000–$50,000 ─────────────────────────────────────────────────────────
  { gainThreshold: 40000, type: 'avatar', emoji: '☀️', name: 'Solar Trader',        color: '#8B5CF6' },
  { gainThreshold: 41000, type: 'pet',    emoji: '🦈', name: 'Baby Shark',          color: '#60A5FA' },
  { gainThreshold: 42000, type: 'avatar', emoji: '🌈', name: 'Rainbow Trader',      color: '#34D399' },
  { gainThreshold: 43000, type: 'pet',    emoji: '🐢', name: 'Long Game Turtle',    color: '#94A3B8' },
  { gainThreshold: 44000, type: 'avatar', emoji: '⚜️', name: 'Fleur de Lis',        color: '#EC4899' },
  { gainThreshold: 45000, type: 'pet',    emoji: '🦅', name: 'Phoenix',             color: '#00D4AA' },
  { gainThreshold: 46000, type: 'avatar', emoji: '🏅', name: 'Medalist',            color: '#06B6D4' },
  { gainThreshold: 47000, type: 'pet',    emoji: '🌙', name: 'Moon Bunny',          color: '#84CC16' },
  { gainThreshold: 48000, type: 'avatar', emoji: '🐉', name: 'Dragon Master',       color: '#F43F5E' },
  { gainThreshold: 49000, type: 'pet',    emoji: '🔥', name: 'Fire Cat',            color: '#A855F7' },
  { gainThreshold: 50000, type: 'pet',    emoji: '🐉', name: 'Cosmic Dragon',       color: '#8B5CF6' },
];

/**
 * Returns the highest-gain avatar the player has unlocked.
 * Always returns at least the Seedling ($0 threshold).
 */
export function getCurrentAvatar(gainDollars: number): TrophyReward {
  const unlocked = TROPHY_REWARDS.filter(
    r => r.type === 'avatar' && gainDollars >= r.gainThreshold
  );
  return unlocked[unlocked.length - 1] ?? TROPHY_REWARDS[0];
}

/**
 * Returns the highest-gain pet the player has unlocked, or null if none yet.
 */
export function getCurrentPet(gainDollars: number): TrophyReward | null {
  const unlocked = TROPHY_REWARDS.filter(
    r => r.type === 'pet' && gainDollars >= r.gainThreshold
  );
  return unlocked[unlocked.length - 1] ?? null;
}

/**
 * Returns the reward that unlocks at exactly this dollar gain, or null.
 * Rewards appear every $1,000.
 */
export function rewardAtGain(gainDollars: number): TrophyReward | null {
  if (gainDollars % 1000 !== 0) return null;
  return TROPHY_REWARDS.find(r => r.gainThreshold === gainDollars) ?? null;
}
