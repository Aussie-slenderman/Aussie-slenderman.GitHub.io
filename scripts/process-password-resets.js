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
      // The login flow uses the Firestore 'email' field to sign in.
      // We need to find the Firebase Auth account that matches that email
      // and reset THAT account's password.
      // First try looking up by email (the one login actually uses)
      let targetUid = userId;
      if (email && !email.endsWith('@capitalquest.app')) {
        // Real email — find the Firebase Auth user by email
        try {
          const byEmail = await auth.getUserByEmail(email);
          targetUid = byEmail.uid;
        } catch {
          // Email not found in Firebase Auth, fall back to userId
        }
      }

      const userRecord = await auth.getUser(targetUid);
      await auth.updateUser(targetUid, { password: newPassword });

      await doc.ref.update({ status: 'completed', completedAt: Date.now(), processedUid: targetUid });
      console.log(`  Reset password for ${userRecord.email} (${targetUid})`);
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
