/**
 * Delete all clubs except "Smales family club" using the client Firebase SDK.
 * Signs in as an existing user first to satisfy Firestore rules.
 *
 * Usage:
 *   node scripts/cleanup-clubs-client.mjs           # dry run
 *   node scripts/cleanup-clubs-client.mjs --apply   # actually delete
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCP1AcnDTU2umjR3cGycRxQ5mwOFq4Xjgg',
  authDomain: 'capitalquest-4d20b.firebaseapp.com',
  projectId: 'capitalquest-4d20b',
  storageBucket: 'capitalquest-4d20b.firebasestorage.app',
  messagingSenderId: '407589569541',
  appId: '1:407589569541:web:3b8a543f03ad9f110ec86c',
};

const APPLY = process.argv.includes('--apply');
const KEEPER = 'smales family club';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Look up username → Firebase Auth email, then sign in
const username = 'theosmales';
const password = 'Bondi2025';

console.log(`Looking up Firebase Auth email for "${username}"...`);
const userSnap = await getDocs(query(collection(db, 'users'), where('username', '==', username)));

if (userSnap.empty) {
  // Try direct email sign-in as fallback
  console.log('Username lookup needs auth. Trying direct sign-in...');
}

// The users collection might also need auth. Let's try signing in with possible emails.
// The admin email from CLAUDE.md might work directly.
let signedIn = false;
const emailsToTry = ['theosmales1@gmail.com'];

// Also try looking up in users collection (might work with relaxed read rules)
if (!userSnap.empty) {
  const userData = userSnap.docs[0].data();
  if (userData.email) emailsToTry.unshift(userData.email);
}

for (const email of emailsToTry) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log(`Signed in with ${email}\n`);
    signedIn = true;
    break;
  } catch (e) {
    console.log(`  ${email}: ${e.code || e.message}`);
  }
}

if (!signedIn) {
  console.error('Could not sign in. Exiting.');
  process.exit(1);
}

// Now query clubs
const snap = await getDocs(collection(db, 'clubs'));
console.log(`Mode: ${APPLY ? 'APPLY (will delete)' : 'DRY RUN'}`);
console.log(`Found ${snap.size} total club(s)\n`);

const toDelete = [];
const toKeep = [];

snap.forEach(d => {
  const name = (d.data().name || '').trim();
  const matches = name.toLowerCase() === KEEPER;
  (matches ? toKeep : toDelete).push({ id: d.id, name });
});

console.log(`Keeping ${toKeep.length}:`);
toKeep.forEach(c => console.log(`  + ${c.id}  "${c.name}"`));
console.log(`\n${APPLY ? 'Deleting' : 'Would delete'} ${toDelete.length}:`);
toDelete.forEach(c => console.log(`  - ${c.id}  "${c.name}"`));

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to delete.');
  process.exit(0);
}

if (toKeep.length === 0) {
  console.error('\nABORT: No clubs match keeper name.');
  process.exit(1);
}

for (const c of toDelete) {
  await deleteDoc(doc(db, 'clubs', c.id));
  console.log(`  Deleted: ${c.id}`);
}
console.log(`\nDone. Deleted ${toDelete.length} club(s).`);
process.exit(0);
