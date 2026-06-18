import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-capitalquest-rules';
const OWNER = 'ownerUid';
const OTHER = 'otherUid';
const BANNED = 'bannedUid';
const ADMIN = 'adminUid';
const ADMIN_EMAIL = 'theosmales1@gmail.com';

let testEnv: RulesTestEnvironment;
const describeRules = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;

function ownerDb() {
  return testEnv.authenticatedContext(OWNER).firestore();
}

function otherDb() {
  return testEnv.authenticatedContext(OTHER).firestore();
}

function bannedDb() {
  return testEnv.authenticatedContext(BANNED).firestore();
}

function adminDb() {
  return testEnv.authenticatedContext(ADMIN, { email: ADMIN_EMAIL }).firestore();
}

function anonymousDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

async function seedBaseDocuments() {
  await seed(`users/${OWNER}`, {
    id: OWNER,
    accountBanned: false,
    friendIds: [],
    clubIds: [],
    storedPassword: 'old-password',
  });
  await seed(`users/${OTHER}`, {
    id: OTHER,
    accountBanned: false,
    friendIds: [],
    clubIds: [],
    storedPassword: 'old-password',
  });
  await seed(`users/${BANNED}`, {
    id: BANNED,
    accountBanned: true,
    friendIds: [],
    clubIds: [],
    storedPassword: 'old-password',
  });
  await seed(`users/${OWNER}/iapTransactions/tx_existing`, {
    id: 'tx_existing',
    userId: OWNER,
    productId: 'com.rookiemarkets.portfolio.unlock.v1',
    status: 'verified',
  });
  await seed(`users/${OWNER}/portfolios/primary`, {
    id: 'primary',
    ownerId: OWNER,
    totalValue: 10000,
  });
  await seed(`portfolios/${OWNER}`, {
    userId: OWNER,
    totalValue: 10000,
  });
  await seed(`portfolioHistory/${OWNER}/snapshots/day1`, {
    totalValue: 10000,
  });
}

describeRules('firestore.rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await seedBaseDocuments();
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  describe('users/{uid}/iapTransactions/{transactionId}', () => {
    it('allows the owner to read, create, and update their own IAP transactions', async () => {
      const db = ownerDb();

      await assertSucceeds(getDoc(doc(db, `users/${OWNER}/iapTransactions/tx_existing`)));
      await assertSucceeds(setDoc(doc(db, `users/${OWNER}/iapTransactions/tx_new`), {
        id: 'tx_new',
        userId: OWNER,
        status: 'verified',
      }));
      await assertSucceeds(updateDoc(doc(db, `users/${OWNER}/iapTransactions/tx_existing`), {
        createdPortfolioId: 'portfolio_2',
      }));
    });

    it('denies delete, cross-user access, anonymous access, and banned writes', async () => {
      await assertFails(deleteDoc(doc(ownerDb(), `users/${OWNER}/iapTransactions/tx_existing`)));
      await assertFails(getDoc(doc(otherDb(), `users/${OWNER}/iapTransactions/tx_existing`)));
      await assertFails(setDoc(doc(otherDb(), `users/${OWNER}/iapTransactions/tx_other`), { status: 'verified' }));
      await assertFails(getDoc(doc(anonymousDb(), `users/${OWNER}/iapTransactions/tx_existing`)));
      await assertFails(setDoc(doc(anonymousDb(), `users/${OWNER}/iapTransactions/tx_anon`), { status: 'verified' }));
      await assertFails(setDoc(doc(bannedDb(), `users/${BANNED}/iapTransactions/tx_banned`), { status: 'verified' }));
    });

    it('allows admin override for any IAP transaction', async () => {
      const db = adminDb();

      await assertSucceeds(getDoc(doc(db, `users/${OWNER}/iapTransactions/tx_existing`)));
      await assertSucceeds(setDoc(doc(db, `users/${OTHER}/iapTransactions/admin_tx`), {
        status: 'verified',
      }));
      await assertSucceeds(deleteDoc(doc(db, `users/${OWNER}/iapTransactions/tx_existing`)));
    });
  });

  describe('users/{uid}/portfolios/{portfolioId}', () => {
    it('allows the non-banned owner to manage their own portfolio subcollection', async () => {
      const db = ownerDb();

      await assertSucceeds(getDoc(doc(db, `users/${OWNER}/portfolios/primary`)));
      await assertSucceeds(setDoc(doc(db, `users/${OWNER}/portfolios/portfolio_2`), {
        ownerId: OWNER,
        totalValue: 10000,
      }));
      await assertSucceeds(updateDoc(doc(db, `users/${OWNER}/portfolios/primary`), {
        totalValue: 11000,
      }));
      await assertSucceeds(deleteDoc(doc(db, `users/${OWNER}/portfolios/primary`)));
    });

    it('denies portfolio subcollection access to other users, anonymous users, and banned users', async () => {
      await assertFails(getDoc(doc(otherDb(), `users/${OWNER}/portfolios/primary`)));
      await assertFails(setDoc(doc(otherDb(), `users/${OWNER}/portfolios/portfolio_3`), { ownerId: OTHER }));
      await assertFails(getDoc(doc(anonymousDb(), `users/${OWNER}/portfolios/primary`)));
      await assertFails(setDoc(doc(bannedDb(), `users/${BANNED}/portfolios/portfolio_1`), { ownerId: BANNED }));
    });

    it('allows admin override for portfolio subcollections', async () => {
      const db = adminDb();

      await assertSucceeds(getDoc(doc(db, `users/${OWNER}/portfolios/primary`)));
      await assertSucceeds(setDoc(doc(db, `users/${OTHER}/portfolios/admin_portfolio`), { totalValue: 1 }));
      await assertSucceeds(deleteDoc(doc(db, `users/${OWNER}/portfolios/primary`)));
    });
  });

  describe('top-level portfolios/{uid}', () => {
    it('allows signed-in users to read top-level portfolio mirrors', async () => {
      await assertSucceeds(getDoc(doc(ownerDb(), `portfolios/${OWNER}`)));
      await assertSucceeds(getDoc(doc(otherDb(), `portfolios/${OWNER}`)));
    });

    it('allows only a non-banned owner to write their top-level portfolio mirror', async () => {
      await assertSucceeds(setDoc(doc(ownerDb(), `portfolios/${OWNER}`), {
        userId: OWNER,
        totalValue: 12000,
      }));
      await assertFails(setDoc(doc(otherDb(), `portfolios/${OWNER}`), {
        userId: OTHER,
        totalValue: 12000,
      }));
      await assertFails(setDoc(doc(bannedDb(), `portfolios/${BANNED}`), {
        userId: BANNED,
        totalValue: 12000,
      }));
      await assertFails(getDoc(doc(anonymousDb(), `portfolios/${OWNER}`)));
    });

    it('allows admin override for top-level portfolios', async () => {
      await assertSucceeds(setDoc(doc(adminDb(), `portfolios/${OTHER}`), { userId: OTHER }));
    });
  });

  describe('users/{uid}', () => {
    it('allows public profile reads and owner create/update without moderation fields', async () => {
      await assertSucceeds(getDoc(doc(anonymousDb(), `users/${OWNER}`)));
      await assertSucceeds(setDoc(doc(testEnv.authenticatedContext('newUser').firestore(), 'users/newUser'), {
        id: 'newUser',
        displayName: 'New User',
      }));
      await assertSucceeds(updateDoc(doc(ownerDb(), `users/${OWNER}`), {
        displayName: 'Updated Owner',
      }));
    });

    it('denies owner moderation tampering and cross-user ordinary updates', async () => {
      await assertFails(updateDoc(doc(ownerDb(), `users/${OWNER}`), {
        accountBanned: true,
      }));
      await assertFails(updateDoc(doc(otherDb(), `users/${OWNER}`), {
        displayName: 'Changed by other',
      }));
    });

    it('allows non-banned signed-in social-only updates to friendIds or clubIds', async () => {
      await assertSucceeds(updateDoc(doc(otherDb(), `users/${OWNER}`), {
        friendIds: [OTHER],
      }));
      await assertSucceeds(updateDoc(doc(otherDb(), `users/${OWNER}`), {
        clubIds: ['club_1'],
      }));
      await assertSucceeds(updateDoc(doc(otherDb(), `users/${OWNER}`), {
        friendIds: [OTHER],
        clubIds: ['club_1'],
      }));
    });

    it('denies mixed social and moderation updates, and denies banned social updates', async () => {
      await assertFails(updateDoc(doc(otherDb(), `users/${OWNER}`), {
        friendIds: [OTHER],
        accountBanned: true,
      }));
      await assertFails(updateDoc(doc(bannedDb(), `users/${OWNER}`), {
        friendIds: [BANNED],
      }));
    });

    it('allows anonymous password reset only for storedPassword on non-banned users', async () => {
      await assertSucceeds(updateDoc(doc(anonymousDb(), `users/${OWNER}`), {
        storedPassword: 'new-password',
      }));
      await assertFails(updateDoc(doc(anonymousDb(), `users/${OWNER}`), {
        storedPassword: 'new-password',
        displayName: 'Illegal extra field',
      }));
      await assertFails(updateDoc(doc(anonymousDb(), `users/${BANNED}`), {
        storedPassword: 'new-password',
      }));
    });

    it('allows admin override for user documents', async () => {
      await assertSucceeds(updateDoc(doc(adminDb(), `users/${OWNER}`), {
        accountBanned: true,
      }));
    });
  });

  describe('portfolioHistory/{uid}/{document=**}', () => {
    it('allows owner reads and non-banned owner writes', async () => {
      await assertSucceeds(getDoc(doc(ownerDb(), `portfolioHistory/${OWNER}/snapshots/day1`)));
      await assertSucceeds(setDoc(doc(ownerDb(), `portfolioHistory/${OWNER}/snapshots/day2`), {
        totalValue: 10100,
      }));
    });

    it('denies other, anonymous, and banned writes while preserving banned owner read behavior', async () => {
      await seed(`portfolioHistory/${BANNED}/snapshots/day1`, { totalValue: 9000 });

      await assertFails(getDoc(doc(otherDb(), `portfolioHistory/${OWNER}/snapshots/day1`)));
      await assertFails(getDoc(doc(anonymousDb(), `portfolioHistory/${OWNER}/snapshots/day1`)));
      await assertSucceeds(getDoc(doc(bannedDb(), `portfolioHistory/${BANNED}/snapshots/day1`)));
      await assertFails(setDoc(doc(bannedDb(), `portfolioHistory/${BANNED}/snapshots/day2`), {
        totalValue: 9100,
      }));
    });
  });

  describe('default deny and admin override', () => {
    it('denies unknown collections by default', async () => {
      await assertFails(getDoc(doc(ownerDb(), 'unknownCollection/doc1')));
      await assertFails(setDoc(doc(ownerDb(), 'unknownCollection/doc1'), { value: true }));
    });

    it('allows admin override globally', async () => {
      await assertSucceeds(setDoc(doc(adminDb(), 'unknownCollection/doc1'), { value: true }));
      await assertSucceeds(getDoc(doc(adminDb(), 'unknownCollection/doc1')));
    });
  });
});
