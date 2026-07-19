import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

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
const auth = getAuth(app);
const database = getDatabase(app);

async function run() {
  const email = "storekeeper@test.com";
  const password = "password123";
  
  try {
    console.log("Creating user...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created:", userCredential.user.uid);
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      console.log("User already exists, updating role in DB instead.");
    } else {
      console.error("Error creating user:", e);
      process.exit(1);
    }
  }

  try {
    const userKey = email.toLowerCase().replace(/[.#$\[\]]/g, '_');
    console.log("Setting role in database for key:", userKey);
    await set(ref(database, `users/${userKey}`), {
      email: email,
      role: 'storekeeper',
      name: 'Test Storekeeper',
      assignedStoreNum: 'All',
      permissions: {
        canEditInventory: true
      }
    });
    
    const adminKey = "admin_test_com";
    await set(ref(database, `users/${adminKey}`), {
      email: "admin@test.com",
      role: 'admin',
      name: 'Test Admin',
      assignedStoreNum: 'All',
      permissions: {}
    });
    
    console.log("Successfully created test users!");
    process.exit(0);
  } catch (dbErr) {
    console.error("DB Error:", dbErr);
    process.exit(1);
  }
}

run();
