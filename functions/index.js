const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Allowed admin emails
const ADMIN_EMAILS = ['theosmales1@gmail.com', 'cq.admin.mod@capitalquest.app'];

/**
 * deleteUserAccount — callable function
 * Fully removes a user from Firebase Auth AND all Firestore collections
 * so the username can be immediately re-registered.
 *
 * Called with: { uid: string }
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
  }

  // Must be an admin
  const callerEmail = (context.auth.token.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(callerEmail)) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorised. Caller: ' + callerEmail);
  }

  const uid = data.uid;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid is required.');
  }

  console.log(`deleteUserAccount called for uid=${uid} by ${callerEmail}`);

  const db = admin.firestore();
  const auth = admin.auth();

  // 1. Delete Firebase Auth account (frees the username@capitalquest.app email)
  try {
    await auth.deleteUser(uid);
    console.log(`Auth user deleted: ${uid}`);
  } catch (e) {
    console.warn('Auth delete skipped:', e.message);
  }

  // 2. Delete notifications subcollection
  try {
    const notifs = await db.collection('users').doc(uid).collection('notifications').get();
    const notifDeletes = notifs.docs.map(d => d.ref.delete());
    await Promise.all(notifDeletes);
    console.log(`Deleted ${notifDeletes.length} notifications`);
  } catch (e) {
    console.warn('Notifications delete skipped:', e.message);
  }

  // 3. Delete transactions
  try {
    const txns = await db.collection('transactions').where('userId', '==', uid).get();
    const txnDeletes = txns.docs.map(d => d.ref.delete());
    await Promise.all(txnDeletes);
    console.log(`Deleted ${txnDeletes.length} transactions`);
  } catch (e) {
    console.warn('Transactions delete skipped:', e.message);
  }

  // 4. Delete top-level docs individually (safer than batch for error isolation)
  try { await db.collection('users').doc(uid).delete(); } catch (e) { console.warn('users doc delete skipped:', e.message); }
  try { await db.collection('portfolios').doc(uid).delete(); } catch (e) { console.warn('portfolios doc delete skipped:', e.message); }
  try { await db.collection('leaderboard').doc(uid).delete(); } catch (e) { console.warn('leaderboard doc delete skipped:', e.message); }

  console.log(`deleteUserAccount: fully deleted uid=${uid}`);
  return { success: true };
});

/**
 * adminSetTempPassword — callable function
 * Saves a temporary password to the user's Firestore doc.
 * Called with: { uid: string, password: string }
 */
exports.adminSetTempPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerEmail = (context.auth.token.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(callerEmail)) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorised.');
  }

  const { uid, password } = data;
  if (!uid || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and password are required.');
  }
  if (password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  try {
    await admin.firestore().collection('users').doc(uid).update({
      adminTempPassword: password,
      adminTempPasswordSetAt: Date.now()
    });
  } catch (e) {
    throw new functions.https.HttpsError('internal', 'Failed to save password: ' + e.message);
  }

  console.log(`adminSetTempPassword: set temp password for uid=${uid}`);
  return { success: true };
});
