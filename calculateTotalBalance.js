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

async function getTopWinterPointsAndReset() {
  try {
    // Apne users node ka reference dein. 
    // Agar aapke users direct root par hain, toh 'users' ki jagah '/' use karein.
    const snapshot = await db.ref('users').once('value'); 
    const users = snapshot.val();

    if (!users) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    const usersList = [];
    const updatePromises = []; // Database updates ko handle karne ke liye

    for (const uid in users) {
      const user = users[uid];
      
      // Points ko number mein convert karein, agar nahi hain toh 0
      const points = Number(user.winterPoints || 0);
      const email = user.email || "Email not found";

      // Top 20 ke liye list mein add karein
      usersList.push({ uid, email, points });

      // Agar points 0 se zyada hain, tabhi reset karne ke liye promise add karein 
      // (Is se Firebase par unnecessary write operations bach jayenge)
      if (points > 0) {
          const updatePromise = db.ref(`users/${uid}`).update({ winterPoints: 0 });
          updatePromises.push(updatePromise);
      }
    }

    // List ko points ke hisaab se descending order (sabse zyada pehle) mein sort karein
    usersList.sort((a, b) => b.points - a.points);

    // Top 20 users extract karein
    const top20Users = usersList.slice(0, 20);

    console.log("-------------------------------------------------");
    console.log("🏆 TOP 20 USERS (WINTER POINTS) 🏆");
    console.log("-------------------------------------------------");
    
    top20Users.forEach((u, index) => {
        console.log(`${index + 1}. UID: ${u.uid} | Email: ${u.email} | Points: ${u.points}`);
    });

    console.log("-------------------------------------------------");

    // Saare database updates ek sath run karein
    if (updatePromises.length > 0) {
        console.log(`⏳ Resetting winterPoints to 0 for ${updatePromises.length} users in database...`);
        await Promise.all(updatePromises);
        console.log("✅ Sab users ke winterPoints successfully 0 ho gaye hain!");
    } else {
        console.log("✅ Sab users ke winterPoints pehle se hi 0 hain (Koi update nahi hua).");
    }
    
    console.log("-------------------------------------------------");
    
    process.exit(0); // Script ko successfully close karne ke liye

  } catch (err) {
    console.error("❌ Error processing winter points:", err);
    process.exit(1);
  }
}

// Run the script
getTopWinterPointsAndReset();
