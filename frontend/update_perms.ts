import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC5Q2u1afhxzkaJyUbBVfSncBDajCW-Jb8",
  authDomain: "automation-suit-cece7.firebaseapp.com",
  databaseURL: "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "automation-suit-cece7",
  storageBucket: "automation-suit-cece7.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function run() {
  try {
    const storekeeperKey = "storekeeper@test_com";
    await update(ref(database, `users/${storekeeperKey}`), {
      role: 'inventory_taking',
      password: 'password123',
      permissions: {
        inventory_mobile: true,
        canEditInventory: true
      }
    });

    const adminKey = "admin@test_com";
    await update(ref(database, `users/${adminKey}`), {
      role: 'admin',
      password: 'password123',
      permissions: {
        inventory_admin: true
      }
    });

    // We used admin_test_com instead of admin@test_com earlier? Let's check what userKey actually was generated.
    // wait, replace(/[.#$\[\]]/g, '_') turns storekeeper@test.com into storekeeper@test_com!
    // But wait, my script manually used "storekeeper@test_com" and "admin_test_com".
    const adminKey2 = "admin_test_com";
    await update(ref(database, `users/${adminKey2}`), {
      role: 'admin',
      password: 'password123',
      permissions: {
        inventory_admin: true
      }
    });

    console.log("Updated roles and permissions successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
