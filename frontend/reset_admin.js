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
  const adminEmail = "admin@test.com";
  const adminPassword = "password123";

  try {
    try {
      // Try to sign in first
      console.log("Attempting to sign in to reset password...");
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log("Signed in successfully. No need to reset.");
    } catch(err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        console.log("Wrong password or user deleted. We can't update password of another user without Admin SDK unless we know their old one, BUT if they were deleted we can recreate them.");
        // We will try to create them. If auth/email-already-in-use, then they exist and we can't do much without Firebase Admin SDK.
        try {
          const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          console.log("User recreated successfully!");
          
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
          console.log("User data written to RTDB.");
        } catch(createErr: any) {
          console.error("Create failed:", createErr.code);
        }
      } else {
        console.error("Sign in failed with:", err.code);
      }
    }
  } catch (error) {
    console.error("Error setting up admin user:", error);
  } finally {
    process.exit(0);
  }
}

run();
