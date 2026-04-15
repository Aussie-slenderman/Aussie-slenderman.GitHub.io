const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('users').get();
  console.log(`Total users: ${snap.size}\n`);

  let withReal = 0, withoutReal = 0;

  for (const doc of snap.docs) {
    const u = doc.data();
    const notif = u.notificationEmail || '';
    const user = u.userEmail || '';
    const auth = u.email || '';
    const verified = u.emailVerified || false;
    const hasReal = (notif && !notif.endsWith('@capitalquest.app')) ||
                    (user && !user.endsWith('@capitalquest.app'));

    if (hasReal) {
      withReal++;
      console.log(`✅ ${u.username || u.displayName || doc.id}`);
      console.log(`   notificationEmail: ${notif || '(empty)'}`);
      console.log(`   userEmail:         ${user || '(empty)'}`);
      console.log(`   email (auth):      ${auth}`);
      console.log(`   emailVerified:     ${verified}`);
      console.log('');
    } else {
      withoutReal++;
    }
  }

  console.log(`\n${withReal} users with real email, ${withoutReal} without`);
}

main().catch(console.error);
