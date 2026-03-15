/**
 * Shop Items
 *
 * Avatars and pets purchasable with Bling (in-game currency).
 * Tiers and prices:
 *   Rare          →   500 bling
 *   Super Rare    →  1500 bling
 *   Epic          →  5000 bling
 *   Mythic        →  7000 bling
 *   Legendary     → 10000 bling
 *   Ultra Legendary → 20000 bling
 */

export type ShopTier =
  | 'rare'
  | 'super_rare'
  | 'epic'
  | 'mythic'
  | 'legendary'
  | 'ultra_legendary';

export type ShopItemType = 'avatar' | 'pet';

/**
 * Special timed ability available on Ultra Legendary pets.
 * durationMs  — how long the buff lasts once activated
 * cooldownMs  — how long before it can be activated again
 */
export type PetAbilityType = 'xp_boost' | 'sell_boost' | 'daily_luck';

export interface PetAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  durationMs: number;
  cooldownMs: number;
  /** Human-readable duration shown in the UI */
  durationLabel: string;
  /** Human-readable cooldown shown in the UI */
  cooldownLabel: string;
  /**
   * xp_boost    — multiplies XP earned while active (manual activation)
   * sell_boost  — multiplies sell earnings while active (manual activation)
   * daily_luck  — auto-rolls once per day; procs with 5% chance to 2× earnings
   */
  abilityType: PetAbilityType;
}

export interface ShopItem {
  id: string;
  type: ShopItemType;
  tier: ShopTier;
  emoji: string;
  name: string;
  description: string;
  price: number; // bling
  ability?: PetAbility;
}

export const TIER_PRICES: Record<ShopTier, number> = {
  rare:            500,
  super_rare:     1500,
  epic:           5000,
  mythic:         7000,
  legendary:     10000,
  ultra_legendary: 20000,
};

export const TIER_LABELS: Record<ShopTier, string> = {
  rare:            'Rare',
  super_rare:      'Super Rare',
  epic:            'Epic',
  mythic:          'Mythic',
  legendary:       'Legendary',
  ultra_legendary: 'Ultra Legendary',
};

export const TIER_COLORS: Record<ShopTier, string> = {
  rare:            '#60A5FA',
  super_rare:      '#A78BFA',
  epic:            '#F59E0B',
  mythic:          '#EF4444',
  legendary:       '#F5C518',
  ultra_legendary: '#00D4AA',
};

/**
 * Passive earn bonus applied to sell proceeds when a shop pet of this tier
 * is equipped. Stored as a decimal fraction (e.g. 0.0001 = +0.01%).
 */
export const PET_TIER_BONUSES: Record<ShopTier, number> = {
  rare:            0.0001,   // +0.01%
  super_rare:      0.0005,   // +0.05%
  epic:            0.0008,   // +0.08%
  mythic:          0.001,    // +0.1%
  legendary:       0.005,    // +0.5%
  ultra_legendary: 0.01,     // +1%
};

/**
 * Returns the sell-earnings multiplier for the currently equipped pet.
 * Only shop pets carry tier bonuses; trophy road pets return 1.0.
 * e.g. Rare pet → 1.0001, Ultra Legendary pet → 1.01
 */
export function getPetBonusMultiplier(equippedPetId: string | null): number {
  if (!equippedPetId || equippedPetId.startsWith('trophy:')) return 1;
  const item = SHOP_ITEMS.find(i => i.id === equippedPetId && i.type === 'pet');
  if (!item) return 1;
  return 1 + PET_TIER_BONUSES[item.tier];
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Rare Avatars (500 bling) ────────────────────────────────────────────────
  {
    id: 'avatar_rare_1',
    type: 'avatar', tier: 'rare',
    emoji: '🎭', name: 'Masked Trader',
    description: 'Hide your true strategy behind the mask.',
    price: 500,
  },
  {
    id: 'avatar_rare_2',
    type: 'avatar', tier: 'rare',
    emoji: '🧢', name: 'Cap & Trade',
    description: 'Casual but calculated.',
    price: 500,
  },
  {
    id: 'avatar_rare_3',
    type: 'avatar', tier: 'rare',
    emoji: '🎪', name: 'Ringmaster',
    description: 'Every trade is a performance.',
    price: 500,
  },

  // ── Rare Pets (500 bling) ────────────────────────────────────────────────────
  {
    id: 'pet_rare_1',
    type: 'pet', tier: 'rare',
    emoji: '🐹', name: 'Hamster Trader',
    description: 'Runs on the wheel of fortune. +0.01% sell earnings.',
    price: 500,
  },
  {
    id: 'pet_rare_2',
    type: 'pet', tier: 'rare',
    emoji: '🐇', name: 'Lucky Rabbit',
    description: 'Always finds the lucky trade. +0.01% sell earnings.',
    price: 500,
  },
  {
    id: 'pet_rare_3',
    type: 'pet', tier: 'rare',
    emoji: '🦜', name: 'Ticker Bird',
    description: 'Repeats stock tips all day long. +0.01% sell earnings.',
    price: 500,
  },

  // ── Super Rare Avatars (1500 bling) ─────────────────────────────────────────
  {
    id: 'avatar_sr_1',
    type: 'avatar', tier: 'super_rare',
    emoji: '🦊', name: 'Sly Fox',
    description: 'Outwit the market every time.',
    price: 1500,
  },
  {
    id: 'pet_ul_volcano',
    type: 'pet', tier: 'ultra_legendary',
    emoji: '🌋', name: 'Volcano',
    description: 'Erupts with explosive gains. +1% sell earnings.',
    price: 20000,
    ability: {
      id: 'daily_luck',
      name: 'Eruption Luck',
      description: '5% daily chance to double sell earnings (auto-rolls on trade)',
      icon: '🎲',
      durationMs:  24 * 60 * 60 * 1000,        // 24 hours when it procs
      cooldownMs:  30 * 24 * 60 * 60 * 1000,  // once every 30 days
      durationLabel: '24 hours',
      cooldownLabel: '30 days',
      abilityType: 'daily_luck',
    },
  },
  {
    id: 'avatar_sr_3',
    type: 'avatar', tier: 'super_rare',
    emoji: '🎸', name: 'Rock Star',
    description: 'Plays the market like a guitar.',
    price: 1500,
  },

  // ── Super Rare Pets (1500 bling) ─────────────────────────────────────────────
  {
    id: 'pet_sr_1',
    type: 'pet', tier: 'super_rare',
    emoji: '🦔', name: 'Hedgehog',
    description: 'Defends against losses with spiny precision. +0.05% sell earnings.',
    price: 1500,
  },
  {
    id: 'pet_sr_2',
    type: 'pet', tier: 'super_rare',
    emoji: '🦦', name: 'River Otter',
    description: 'Plays in both bull and bear markets. +0.05% sell earnings.',
    price: 1500,
  },
  {
    id: 'pet_sr_3',
    type: 'pet', tier: 'super_rare',
    emoji: '🦌', name: 'Stag',
    description: 'Stands tall on any terrain. +0.05% sell earnings.',
    price: 1500,
  },

  // ── Epic Avatars (5000 bling) ────────────────────────────────────────────────
  {
    id: 'avatar_epic_1',
    type: 'avatar', tier: 'epic',
    emoji: '🏋️', name: 'Heavy Lifter',
    description: 'Carries an entire portfolio with ease.',
    price: 5000,
  },
  {
    id: 'avatar_epic_2',
    type: 'avatar', tier: 'epic',
    emoji: '⚗️', name: 'Alchemist',
    description: 'Turns small investments into gold.',
    price: 5000,
  },
  {
    id: 'avatar_epic_3',
    type: 'avatar', tier: 'epic',
    emoji: '🌍', name: 'Global Titan',
    description: 'Trades across every exchange on Earth.',
    price: 5000,
  },

  // ── Epic Pets (5000 bling) ───────────────────────────────────────────────────
  {
    id: 'pet_epic_1',
    type: 'pet', tier: 'epic',
    emoji: '🐆', name: 'Speed Leopard',
    description: 'Fastest reaction time in the market. +0.08% sell earnings.',
    price: 5000,
  },
  {
    id: 'pet_epic_2',
    type: 'pet', tier: 'epic',
    emoji: '🦁', name: 'Market Lion',
    description: 'Rules the trading jungle. +0.08% sell earnings.',
    price: 5000,
  },
  {
    id: 'pet_epic_3',
    type: 'pet', tier: 'epic',
    emoji: '🐊', name: 'Croc',
    description: 'Patient predator with perfect timing. +0.08% sell earnings.',
    price: 5000,
  },

  // ── Mythic Avatars (7000 bling) ──────────────────────────────────────────────
  {
    id: 'avatar_mythic_1',
    type: 'avatar', tier: 'mythic',
    emoji: '🗿', name: 'Stone God',
    description: 'Unmoved by market volatility.',
    price: 7000,
  },
  {
    id: 'avatar_mythic_2',
    type: 'avatar', tier: 'mythic',
    emoji: '🧬', name: 'Market DNA',
    description: 'Trading is encoded in your genes.',
    price: 7000,
  },
  {
    id: 'avatar_mythic_3',
    type: 'avatar', tier: 'mythic',
    emoji: '🌊', name: 'Tsunami',
    description: 'Sweeps through markets like a tidal wave.',
    price: 7000,
  },

  // ── Mythic Pets (7000 bling) ─────────────────────────────────────────────────
  {
    id: 'pet_mythic_1',
    type: 'pet', tier: 'mythic',
    emoji: '🐋', name: 'Whale',
    description: 'The biggest player in the ocean. +0.1% sell earnings.',
    price: 7000,
  },
  {
    id: 'pet_mythic_2',
    type: 'pet', tier: 'mythic',
    emoji: '🦈', name: 'Market Shark',
    description: 'Always circling, always hunting. +0.1% sell earnings.',
    price: 7000,
  },

  // ── Legendary Avatars (10000 bling) ─────────────────────────────────────────
  {
    id: 'avatar_leg_1',
    type: 'avatar', tier: 'legendary',
    emoji: '🐲', name: 'Elder Dragon',
    description: 'Centuries of market wisdom.',
    price: 10000,
  },
  {
    id: 'avatar_leg_2',
    type: 'avatar', tier: 'legendary',
    emoji: '👁️', name: 'All-Seeing Eye',
    description: 'Sees every market movement before it happens.',
    price: 10000,
  },
  {
    id: 'avatar_leg_3',
    type: 'avatar', tier: 'legendary',
    emoji: '⚡', name: 'Thunder God',
    description: 'Strikes the market with divine timing.',
    price: 10000,
  },

  // ── Legendary Pets (10000 bling) ─────────────────────────────────────────────
  {
    id: 'pet_leg_1',
    type: 'pet', tier: 'legendary',
    emoji: '🦄', name: 'Market Unicorn',
    description: 'A once-in-a-generation asset. +0.5% sell earnings.',
    price: 10000,
  },
  {
    id: 'pet_leg_2',
    type: 'pet', tier: 'legendary',
    emoji: '🔮', name: 'Crystal Oracle',
    description: 'Predicts every price movement. +0.5% sell earnings.',
    price: 10000,
  },

  // ── Epic Avatars bonus (moved from Ultra Legendary) ─────────────────────────
  {
    id: 'avatar_epic_star',
    type: 'avatar', tier: 'epic',
    emoji: '🌠', name: 'Shooting Star',
    description: 'A once-in-a-universe talent.',
    price: 5000,
  },
  {
    id: 'avatar_epic_crown',
    type: 'avatar', tier: 'epic',
    emoji: '👑', name: 'Infinite Crown',
    description: 'The ultimate trading royalty.',
    price: 5000,
  },

  // ── Ultra Legendary Pets (20000 bling) ───────────────────────────────────────
  {
    id: 'pet_epic_bull',
    type: 'pet', tier: 'epic',
    emoji: '🐂', name: 'Fortune Bull',
    description: 'Charges through the market with raw power. +0.08% sell earnings.',
    price: 5000,
  },
];

/**
 * Returns how much bling the player earns at a given $500 milestone.
 * Every 10 milestones ($5,000 gain) → 1000 bling.
 * All other milestones → 100–300 bling (deterministic).
 */
export function blingAtMilestone(gainDollars: number): number {
  if (gainDollars <= 0) return 0;
  if (gainDollars % 5000 === 0) return 1000; // every 10 stages
  // Deterministic 100–300 based on the milestone value
  const t = (gainDollars % 5000) / 5000; // 0 to <1
  return Math.round(100 + t * 200); // 100 to 300
}
