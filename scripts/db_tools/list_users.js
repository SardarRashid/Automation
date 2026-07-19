import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import * as fs from "fs";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://automation-suit-cece7-default-rtdb.firebaseio.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function listUsers() {
  const usersRef = ref(database, 'users');
  const snap = await get(usersRef);
  if (snap.exists()) {
    console.log(snap.val());
  } else {
    console.log("No users found");
  }
  process.exit(0);
}

listUsers();
