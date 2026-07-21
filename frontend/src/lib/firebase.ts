import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyC5Q2u1afhxzkaJyUbBVfSncBDajCW-Jb8",
  authDomain: "automation-suit-cece7.firebaseapp.com",
  databaseURL: "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "automation-suit-cece7",
  storageBucket: "automation-suit-cece7.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export const signInUser = async (email: string, pass: string) => {
  const userKey = email.toLowerCase().replace('.', '_');
  const userRef = ref(database, `users/${userKey}`);
  
  let userCredential;
  try {
    // 1. Authenticate FIRST so Firebase Security Rules allow the database read
    userCredential = await signInWithEmailAndPassword(auth, email, pass);
  } catch (error: any) {
    throw error;
  }
  
  // 2. Fetch the user's document
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // 3. Check for owner override FIRST (Emergency Recovery)
      const isOwner = email.toLowerCase() === 'sardarrashid121@gmail.com';
      
      if (!isOwner) {
        if (data.disabled) {
          await signOut(auth);
          throw new Error("Account disabled by administrator.");
        }
        if (data.locked) {
          await signOut(auth);
          throw new Error("Account locked. Please contact support.");
        }
      }
      
      // Reset login attempts on success
      await update(userRef, { loginAttempts: 0 });
    }
    
    return userCredential.user;
  } catch (dbError: any) {
    // If we threw a specific error above, re-throw it
    if (dbError.message.includes("Account disabled") || dbError.message.includes("Account locked")) {
      throw dbError;
    }
    
    // For other DB read errors, if it's the owner, allow them through
    if (email.toLowerCase() === 'sardarrashid121@gmail.com') {
      console.warn("Database read failed for owner, engaging Recovery Mode.", dbError);
      return userCredential.user;
    }
    
    // For normal users, sign them out and show professional error
    await signOut(auth);
    throw new Error("Unable to retrieve profile data. Please contact support.");
  }
};

export const registerUser = async (email: string, pass: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};
