const admin = require('firebase-admin');
const fs = require('fs');

// Load service account from JSON file
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function calculateTotalBalance() {
  try {
    // Fetch all users
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val();

    let total = 0;

    for (const uid in users) {
      const balance = Number(users[uid].balance || 0);
      total += balance;
    }

    console.log("✅ Total balance mined till now:", total);
  } catch (err) {
    console.error("❌ Error fetching balances:", err);
  }
}

// Run the script
calculateTotalBalance();
