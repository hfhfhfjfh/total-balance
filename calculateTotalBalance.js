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

async function analyzehangvuReferrals() {
  try {
    console.log("⏳ Fetching database for 'hangvu' referral analysis...");
    const snapshot = await db.ref('users').once('value'); 
    const users = snapshot.val();

    if (!users) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    let referralCount = 0;
    let activeMiners = 0;
    let inactiveMiners = 0;
    let referredUsersData = [];

    const TARGET_CODE = "hasib9";

    for (const uid in users) {
      const user = users[uid];

      // Check karein agar user 'hangvu' se refer hua hai
      if (user.referredBy === TARGET_CODE) {
        referralCount++;

        const isMining = user.mining && user.mining.isMining === true;
        const balance = Number(user.balance || 0);
        const email = user.email || "No Email";

        if (isMining) {
          activeMiners++;
        } else {
          inactiveMiners++;
        }

        referredUsersData.push({
          uid: uid,
          email: email,
          isMining: isMining ? "✅ YES" : "❌ NO",
          balance: balance.toFixed(2)
        });
      }
    }

    console.log("\n-------------------------------------------------");
    console.log(`📊 ANALYSIS FOR REFERRAL CODE: "${TARGET_CODE}"`);
    console.log("-------------------------------------------------");
    console.log(`👥 Total Users Referred: ${referralCount}`);
    console.log(`⛏️  Currently Mining:    ${activeMiners}`);
    console.log(`😴 Inactive Users:      ${inactiveMiners}`);
    console.log("-------------------------------------------------\n");

    if (referredUsersData.length > 0) {
      console.log("LIST OF REFERRED USERS:");
      referredUsersData.forEach((u, i) => {
        console.log(`${i + 1}. Email: ${u.email} | Mining: ${u.isMining} | Balance: ${u.balance} STRX`);
      });
    } else {
      console.log("Is code se koi user refer nahi hua.");
    }

    console.log("\n-------------------------------------------------");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error during analysis:", err);
    process.exit(1);
  }
}

analyzehangvuReferrals();
