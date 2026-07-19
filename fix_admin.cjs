const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');

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
const db = getDatabase(app);

// Update user in DB
update(ref(db, 'users/sardarrashid121_gmail_com'), {
  role: 'it_admin',
  email: 'sardarrashid121@gmail.com'
}).then(() => {
  console.log("SUCCESS");
  process.exit(0);
}).catch(err => {
  console.error("FAIL", err);
  process.exit(1);
});
