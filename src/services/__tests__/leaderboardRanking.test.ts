import { describe, expect, it } from 'vitest';
import {
  applyActivePortfolioToLeaderboard,
  buildActivePortfolioLeaderboardEntry,
} from '../leaderboardRanking';
import type { LeaderboardEntry, Portfolio, User } from '../../types';

const currentUser = {
  id: 'user_1',
  username: 'rookie',
  displayName: 'Rookie',
  level: 3,
  country: 'US',
} as User;

function portfolio(overrides: Partial<Portfolio>): Portfolio {
  return {
    id: 'active',
    userId: 'user_1',
    ownerId: 'user_1',
    name: 'Active Portfolio',
    cashBalance: 10000,
    startingBalance: 10000,
    totalValue: 10000,
    investedValue: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    holdings: [],
    orders: [],
    createdAt: 1,
    ...overrides,
  };
}

function entry(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    rank: 0,
    userId: 'other',
    username: 'other',
    displayName: 'Other',
    startingBalance: 10000,
    currentValue: 10000,
    gainDollars: 0,
    level: 1,
    country: 'US',
    ...overrides,
  };
}

describe('leaderboard ranking with active portfolio', () => {
  it('builds the current user entry from the selected portfolio metrics', () => {
    const active = portfolio({
      id: 'portfolio_2',
      startingBalance: 10000,
      totalValue: 12500,
      totalGainLoss: 2500,
      privacy: 'public',
    });

    expect(buildActivePortfolioLeaderboardEntry(currentUser, active)).toMatchObject({
      userId: 'user_1',
      username: 'rookie',
      currentValue: 12500,
      gainDollars: 2500,
      portfolioPrivacy: 'public',
      isCurrentUser: true,
    });
  });

  it('re-ranks the current user from the active portfolio instead of stale leaderboard values', () => {
    const active = portfolio({ totalValue: 13000, totalGainLoss: 3000 });
    const entries = [
      entry({ userId: 'other_1', gainDollars: 2000, currentValue: 12000 }),
      entry({ userId: 'user_1', gainDollars: -500, currentValue: 9500 }),
      entry({ userId: 'other_2', gainDollars: 1000, currentValue: 11000 }),
    ];

    const ranked = applyActivePortfolioToLeaderboard(entries, currentUser, active);

    expect(ranked.map(e => `${e.rank}:${e.userId}:${e.gainDollars}`)).toEqual([
      '1:user_1:3000',
      '2:other_1:2000',
      '3:other_2:1000',
    ]);
  });

  it('adds the current user from the active portfolio when they are missing from fetched results', () => {
    const active = portfolio({ totalValue: 9000, totalGainLoss: -1000 });
    const entries = [
      entry({ userId: 'other_1', gainDollars: 500, currentValue: 10500 }),
      entry({ userId: 'other_2', gainDollars: -500, currentValue: 9500 }),
    ];

    const ranked = applyActivePortfolioToLeaderboard(entries, currentUser, active);

    expect(ranked).toHaveLength(3);
    expect(ranked.find(e => e.userId === 'user_1')).toMatchObject({
      rank: 3,
      currentValue: 9000,
      gainDollars: -1000,
      isCurrentUser: true,
    });
  });
});
