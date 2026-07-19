import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updatePassword, createUserWithEmailAndPassword } from "firebase/auth";
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
  const adminEmail = "superadmin@test.com";
  const adminPassword = "password123";

  try {
      try {
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log("SuperAdmin User created successfully!");
        
        await set(ref(database, `users/${cred.user.uid}`), {
          email: adminEmail,
          role: "it_admin",
          password: adminPassword, // Legacy requirement
          permissions: {
              "inventory_view": true,
              "inventory_edit": true,
              "users_manage": true,
              "roles_manage": true,
              "system_config": true,
              "logs_view": true,
              "apps_manage": true,
              "sales_orders": true,
              "sales_payments": true,
              "scanner_tracking": true,
              "app_hub": true
          }
        });
        console.log("SuperAdmin User data written to RTDB.");
      } catch(createErr: any) {
        console.error("Create failed:", createErr.code);
        if (createErr.code === 'auth/email-already-in-use') {
           const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
           console.log("Signed in to superadmin successfully.");
        }
      }
  } catch (error) {
    console.error("Error setting up admin user:", error);
  } finally {
    process.exit(0);
  }
}

run();
