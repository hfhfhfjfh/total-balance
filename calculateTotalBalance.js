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

async function processBalancesAndBurn() {
  try {
    // Apne users node ka reference dein. 
    // Agar aapke users direct root par hain, toh 'users' ki jagah '/' use karein.
    const snapshot = await db.ref('users').once('value'); 
    const users = snapshot.val();

    if (!users) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    let totalMined = 0;
    let totalBurned = 0;
    const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
    const currentTime = Date.now();
    
    const updatePromises = []; // Database updates ko handle karne ke liye

    for (const uid in users) {
      const user = users[uid];
      let balance = Number(user.balance || 0);

      // Check karein agar mining aur lastUpdate exist karte hain
      const lastUpdate = user.mining && user.mining.lastUpdate ? Number(user.mining.lastUpdate) : 0;

      // Agar user ne start kiya tha aur usko 7 din se zyada ho gaye hain
      if (lastUpdate > 0 && (currentTime - lastUpdate > SEVEN_DAYS_IN_MS)) {
          
          // 50 STRX cut karein, lekin dhyan rahe balance negative (0 se kam) na ho
          const amountToCut = Math.min(balance, 50); 
          
          if (amountToCut > 0) {
              balance -= amountToCut;
              totalBurned += amountToCut;

              // Database mein user ka naya balance update karne ke liye promise add karein
              const updatePromise = db.ref(`users/${uid}`).update({ balance: balance });
              updatePromises.push(updatePromise);
          }
      }

      // Cut hone ke baad bacha hua balance total mined mein add karein
      totalMined += balance;
    }

    // Saare database updates ek sath run karein
    if (updatePromises.length > 0) {
        console.log(`⏳ Updating ${updatePromises.length} inactive users in database...`);
        await Promise.all(updatePromises);
    }

    console.log("-------------------------------------------------");
    console.log("✅ Total STRX mined (After Cuts):", totalMined);
    console.log("🔥 Total STRX Burned (Inactive Penalty):", totalBurned);
    console.log("-------------------------------------------------");
    
    process.exit(0); // Script ko successfully close karne ke liye

  } catch (err) {
    console.error("❌ Error processing balances:", err);
    process.exit(1);
  }
}

// Run the script
processBalancesAndBurn();
