/**
 * CapitalQuest — Legacy Club Cleanup
 *
 * Deletes every document in the Firestore `clubs` collection whose name does
 * NOT match the keeper club (default: "Smales family club").
 *
 * Required env var:
 *   FIREBASE_SERVICE_ACCOUNT — JSON string of your Firebase service account key
 *
 * Optional flags:
 *   --apply         actually delete (otherwise dry run)
 *   --keep "Name"   override keeper club name
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const keepIdx = args.indexOf('--keep');
const KEEPER = (keepIdx >= 0 ? args[keepIdx + 1] : 'Smales family club').trim().toLowerCase();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT env var is required.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

(async () => {
  console.log(`Mode: ${APPLY ? 'APPLY (will delete)' : 'DRY RUN (no changes)'}`);
  console.log(`Keeper club name: "${KEEPER}"`);
  console.log('');

  const snap = await db.collection('clubs').get();
  console.log(`Found ${snap.size} total club(s) in Firestore.\n`);

  const toDelete = [];
  const toKeep = [];

  snap.forEach(doc => {
    const data = doc.data() || {};
    const name = (data.name || '').trim();
    const matches = name.toLowerCase() === KEEPER;
    (matches ? toKeep : toDelete).push({ id: doc.id, name });
  });

  console.log(`Keeping ${toKeep.length} club(s):`);
  toKeep.forEach(c => console.log(`  + ${c.id}  "${c.name}"`));
  console.log('');

  console.log(`${APPLY ? 'Deleting' : 'Would delete'} ${toDelete.length} club(s):`);
  toDelete.forEach(c => console.log(`  - ${c.id}  "${c.name}"`));
  console.log('');

  if (toKeep.length === 0) {
    console.error('ABORT: No clubs match the keeper name.');
    process.exit(1);
  }

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to delete the listed clubs.');
    return;
  }

  let batch = db.batch();
  let opsInBatch = 0;
  let totalDeleted = 0;
  for (const c of toDelete) {
    batch.delete(db.collection('clubs').doc(c.id));
    opsInBatch++;
    totalDeleted++;
    if (opsInBatch === 450) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) await batch.commit();

  console.log(`Deleted ${totalDeleted} club(s).`);
})().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
