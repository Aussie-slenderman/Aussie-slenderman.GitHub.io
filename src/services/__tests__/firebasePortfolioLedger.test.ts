/* eslint-disable import/first */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DocRef = { path: string; id: string };
type CollectionRef = { path: string };
type Snapshot = { exists: () => boolean; data: () => Record<string, unknown>; id: string };

const firestore = vi.hoisted(() => {
  const store = new Map<string, Record<string, unknown>>();
  let autoId = 0;

  const clone = (value: Record<string, unknown>) => JSON.parse(JSON.stringify(value));
  const makeSnapshot = (ref: DocRef): Snapshot => {
    const data = store.get(ref.path);
    return {
      id: ref.id,
      exists: () => Boolean(data),
      data: () => clone(data ?? {}),
    };
  };
  const applySentinels = (next: Record<string, unknown>, previous: Record<string, unknown> = {}) => {
    const applied: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(next)) {
      if (value && typeof value === 'object' && '__increment' in value) {
        applied[key] = Number(previous[key] ?? 0) + Number((value as { __increment: number }).__increment);
      } else {
        applied[key] = value;
      }
    }
    return applied;
  };
  const setPath = (ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) => {
    const previous = store.get(ref.path) ?? {};
    const applied = applySentinels(data, previous);
    store.set(ref.path, options?.merge ? { ...previous, ...applied } : applied);
  };
  const refFromPath = (parts: string[]): DocRef => {
    const path = parts.join('/');
    return { path, id: parts[parts.length - 1] };
  };

  return {
    store,
    reset() {
      store.clear();
      autoId = 0;
    },
    seed(path: string, data: Record<string, unknown>) {
      store.set(path, clone(data));
    },
    read(path: string) {
      const data = store.get(path);
      return data ? clone(data) : undefined;
    },
    api: {
      getFirestore: vi.fn(() => ({ app: 'firebase-test-app' })),
      doc: vi.fn((base: unknown, ...segments: string[]) => {
        if ((base as CollectionRef)?.path && segments.length === 0) {
          autoId += 1;
          return refFromPath([...(base as CollectionRef).path.split('/'), `auto_${autoId}`]);
        }
        if ((base as CollectionRef)?.path) {
          return refFromPath([...(base as CollectionRef).path.split('/'), ...segments]);
        }
        return refFromPath(segments);
      }),
      collection: vi.fn((base: unknown, ...segments: string[]) => {
        if ((base as DocRef | CollectionRef)?.path) {
          return { path: [(base as DocRef | CollectionRef).path, ...segments].join('/') };
        }
        return { path: segments.join('/') };
      }),
      getDoc: vi.fn(async (ref: DocRef) => makeSnapshot(ref)),
      setDoc: vi.fn(async (ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) => {
        setPath(ref, data, options);
      }),
      updateDoc: vi.fn(async (ref: DocRef, data: Record<string, unknown>) => {
        setPath(ref, data, { merge: true });
      }),
      getDocs: vi.fn(async (collectionRef: CollectionRef) => {
        const prefix = `${collectionRef.path}/`;
        const docs = [...store.entries()]
          .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
          .map(([path, data]) => ({
            id: path.slice(prefix.length),
            data: () => clone(data),
          }))
          .sort((a, b) => Number(a.data().createdAt ?? 0) - Number(b.data().createdAt ?? 0));
        return { empty: docs.length === 0, docs };
      }),
      query: vi.fn((collectionRef: CollectionRef) => collectionRef),
      where: vi.fn(() => ({})),
      orderBy: vi.fn(() => ({})),
      limit: vi.fn(() => ({})),
      onSnapshot: vi.fn(),
      addDoc: vi.fn(),
      serverTimestamp: vi.fn(() => 123456),
      increment: vi.fn((amount: number) => ({ __increment: amount })),
      Timestamp: { now: vi.fn(() => ({ seconds: 123, nanoseconds: 0 })) },
      writeBatch: vi.fn(() => {
        const operations: (() => void)[] = [];
        return {
          set: (ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) => {
            operations.push(() => setPath(ref, data, options));
          },
          commit: async () => {
            operations.forEach(operation => operation());
          },
        };
      }),
      arrayUnion: vi.fn((...items: unknown[]) => ({ __arrayUnion: items })),
      arrayRemove: vi.fn((...items: unknown[]) => ({ __arrayRemove: items })),
      documentId: vi.fn(() => '__name__'),
      runTransaction: vi.fn(async (_db: unknown, callback: (transaction: unknown) => Promise<unknown>) => {
        const operations: (() => void)[] = [];
        const result = await callback({
          get: async (ref: DocRef) => makeSnapshot(ref),
          set: (ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) => {
            operations.push(() => setPath(ref, data, options));
          },
        });
        operations.forEach(operation => operation());
        return result;
      }),
    },
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'firebase-test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'firebase-test-app' })),
}));

vi.mock('firebase/auth', () => ({
  initializeAuth: vi.fn(() => ({})),
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: {} }));
vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  set: vi.fn(),
  push: vi.fn(),
  serverTimestamp: vi.fn(() => 123456),
}));
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(),
}));
vi.mock('firebase/firestore', () => firestore.api);

import {
  consumePortfolioCreditAndCreatePortfolio,
  ensureUserPortfolioDocuments,
  grantPortfolioCreditFromPurchase,
  switchActivePortfolio,
} from '../firebase';

describe('Firestore portfolio ledger helpers', () => {
  beforeEach(() => {
    firestore.reset();
    vi.setSystemTime(new Date('2026-06-13T12:00:00Z'));
  });

  it('migrates the legacy top-level portfolio into the user portfolio subcollection', async () => {
    firestore.seed('users/user_1', { id: 'user_1', portfolioName: 'Original Portfolio' });
    firestore.seed('portfolios/user_1', {
      cashBalance: 10000,
      totalValue: 10000,
      holdings: [],
      createdAt: 100,
    });

    const portfolios = await ensureUserPortfolioDocuments('user_1');

    expect(portfolios).toHaveLength(1);
    expect(portfolios[0]).toMatchObject({
      id: 'primary',
      ownerId: 'user_1',
      name: 'Original Portfolio',
      migratedFrom: 'portfolios/user_1',
    });
    expect(firestore.read('users/user_1/portfolios/primary')).toMatchObject({
      id: 'primary',
      ownerId: 'user_1',
      cashBalance: 10000,
    });
    expect(firestore.read('users/user_1')).toMatchObject({
      activePortfolioId: 'primary',
      portfolioCount: 1,
      availablePortfolioCredits: 0,
    });
  });

  it('grants exactly one consumable credit per unique transaction id', async () => {
    firestore.seed('users/user_1', { id: 'user_1', availablePortfolioCredits: 0 });

    const firstGrant = await grantPortfolioCreditFromPurchase('user_1', {
      transactionId: 'tx_1',
      productId: 'com.rookiemarkets.portfolio.unlock.v1',
      store: 'app_store',
      purchasedAt: 1770811200000,
    });
    const duplicateGrant = await grantPortfolioCreditFromPurchase('user_1', {
      transactionId: 'tx_1',
      productId: 'com.rookiemarkets.portfolio.unlock.v1',
      store: 'app_store',
      purchasedAt: 1770811200000,
    });

    expect(firstGrant).toBe(true);
    expect(duplicateGrant).toBe(false);
    expect(firestore.read('users/user_1')).toMatchObject({ availablePortfolioCredits: 1 });
    expect(firestore.read('users/user_1/iapTransactions/tx_1')).toMatchObject({
      productId: 'com.rookiemarkets.portfolio.unlock.v1',
      type: 'consumable',
      status: 'verified',
      createdPortfolioId: null,
    });
  });

  it('consumes one credit, creates a user subcollection portfolio, and records the consumed transaction', async () => {
    firestore.seed('users/user_1', {
      id: 'user_1',
      availablePortfolioCredits: 1,
      portfolioCount: 1,
      startingBalance: 10000,
    });
    firestore.seed('users/user_1/iapTransactions/tx_1', {
      id: 'tx_1',
      status: 'verified',
      createdPortfolioId: null,
    });

    const created = await consumePortfolioCreditAndCreatePortfolio('user_1', {
      name: 'Portfolio 2',
      sourceTransactionId: 'tx_1',
      startingBalance: 10000,
    });

    expect(created).toMatchObject({
      id: 'auto_1',
      ownerId: 'user_1',
      name: 'Portfolio 2',
      cashBalance: 10000,
      totalValue: 10000,
    });
    expect(firestore.read('users/user_1/portfolios/auto_1')).toMatchObject(created);
    expect(firestore.read('portfolios/user_1')).toMatchObject({
      id: 'auto_1',
      name: 'Portfolio 2',
    });
    expect(firestore.read('users/user_1')).toMatchObject({
      activePortfolioId: 'auto_1',
      portfolioCount: 2,
      availablePortfolioCredits: 0,
    });
    expect(firestore.read('users/user_1/iapTransactions/tx_1')).toMatchObject({
      createdPortfolioId: 'auto_1',
    });
  });

  it('refuses to create a portfolio when no credit is available', async () => {
    firestore.seed('users/user_1', { id: 'user_1', availablePortfolioCredits: 0 });

    await expect(consumePortfolioCreditAndCreatePortfolio('user_1', {
      name: 'Portfolio 2',
      startingBalance: 10000,
    })).rejects.toThrow('No additional portfolio credit available.');

    expect(firestore.read('users/user_1/portfolios/auto_1')).toBeUndefined();
  });

  it('switches the active portfolio and mirrors it to the legacy top-level portfolio doc', async () => {
    firestore.seed('users/user_1', { id: 'user_1', activePortfolioId: 'primary' });
    firestore.seed('users/user_1/portfolios/portfolio_2', {
      id: 'portfolio_2',
      ownerId: 'user_1',
      name: 'Portfolio 2',
      cashBalance: 12000,
      totalValue: 12000,
      createdAt: 200,
    });

    const active = await switchActivePortfolio('user_1', 'portfolio_2');

    expect(active).toMatchObject({ id: 'portfolio_2', name: 'Portfolio 2' });
    expect(firestore.read('portfolios/user_1')).toMatchObject({
      id: 'portfolio_2',
      name: 'Portfolio 2',
      totalValue: 12000,
    });
    expect(firestore.read('users/user_1')).toMatchObject({
      activePortfolioId: 'portfolio_2',
      portfolioName: 'Portfolio 2',
    });
  });
});
