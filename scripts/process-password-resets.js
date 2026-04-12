/**
 * Process pending password reset requests from Firestore.
 * Uses Firebase Admin SDK to update Firebase Auth passwords.
 *
 * Runs every 2 minutes via GitHub Actions cron.
 */

const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log('No FIREBASE_SERVICE_ACCOUNT — skipping.');
  process.exit(0);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

(async () => {
  // Find pending reset requests
  const snap = await db.collection('passwordResetRequests')
    .where('status', '==', 'pending')
    .get();

  if (snap.empty) {
    console.log('No pending password resets.');
    return;
  }

  console.log(`Processing ${snap.size} password reset(s)...`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const { userId, email, newPassword } = data;

    // Skip if older than 1 hour (expired)
    if (Date.now() - (data.createdAt || 0) > 60 * 60 * 1000) {
      await doc.ref.update({ status: 'expired' });
      console.log(`  Expired: ${userId}`);
      continue;
    }

    try {
      // Look up the Firebase Auth user by their Firestore UID
      const userRecord = await auth.getUser(userId);

      // Update the password
      await auth.updateUser(userId, { password: newPassword });

      // Mark as completed
      await doc.ref.update({ status: 'completed', completedAt: Date.now() });
      console.log(`  Reset password for ${userRecord.email} (${userId})`);
    } catch (err) {
      console.error(`  Failed for ${userId}:`, err.message);
      await doc.ref.update({ status: 'failed', error: err.message });
    }
  }

  console.log('Done.');
})().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
