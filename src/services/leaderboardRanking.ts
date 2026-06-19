import type { AvatarConfig, LeaderboardEntry, Portfolio, User } from '../types';

type LeaderboardUser = Pick<
  User,
  'id' | 'username' | 'displayName' | 'level' | 'country' | 'avatarUrl' | 'avatarConfig'
>;

function numeric(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function buildActivePortfolioLeaderboardEntry(
  user: LeaderboardUser,
  portfolio: Portfolio | null,
  existing?: LeaderboardEntry,
): LeaderboardEntry {
  const startingBalance = numeric(portfolio?.startingBalance, existing?.startingBalance ?? 10000);
  const currentValue = numeric(portfolio?.totalValue, existing?.currentValue ?? startingBalance);
  const gainDollars = numeric(portfolio?.totalGainLoss, currentValue - startingBalance);

  return {
    rank: existing?.rank ?? 0,
    userId: user.id,
    username: user.username ?? existing?.username ?? 'Player',
    displayName: user.displayName ?? user.username ?? existing?.displayName ?? 'Player',
    startingBalance,
    currentValue,
    gainDollars,
    level: user.level ?? existing?.level ?? 1,
    country: user.country ?? existing?.country ?? '',
    avatarUrl: user.avatarUrl ?? existing?.avatarUrl,
    avatarConfig: (user.avatarConfig as AvatarConfig | undefined) ?? existing?.avatarConfig,
    isCurrentUser: true,
    portfolioPrivacy: portfolio?.privacy ?? existing?.portfolioPrivacy ?? 'private',
    allowedAccountNumbers: portfolio?.allowedAccountNumbers ?? existing?.allowedAccountNumbers ?? [],
    ownerFriendIds: existing?.ownerFriendIds ?? [],
  };
}

export function applyActivePortfolioToLeaderboard(
  entries: LeaderboardEntry[],
  user: LeaderboardUser | null,
  portfolio: Portfolio | null,
): LeaderboardEntry[] {
  const decorated = entries.map((entry, originalIndex) => ({ entry, originalIndex }));

  if (user) {
    const existingIndex = decorated.findIndex(({ entry }) => entry.userId === user.id);
    if (existingIndex >= 0) {
      const existing = decorated[existingIndex].entry;
      decorated[existingIndex] = {
        ...decorated[existingIndex],
        entry: buildActivePortfolioLeaderboardEntry(user, portfolio, existing),
      };
    } else {
      decorated.push({
        entry: buildActivePortfolioLeaderboardEntry(user, portfolio),
        originalIndex: decorated.length,
      });
    }
  }

  return decorated
    .sort((a, b) => {
      const gainDelta = b.entry.gainDollars - a.entry.gainDollars;
      if (gainDelta !== 0) return gainDelta;
      const valueDelta = b.entry.currentValue - a.entry.currentValue;
      if (valueDelta !== 0) return valueDelta;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ entry }, index) => ({ ...entry, rank: index + 1 }));
}
