const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  databaseURL: "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

get(ref(db, 'users')).then((snapshot) => {
  console.log("USERS:", snapshot.val());
  process.exit(0);
}).catch(console.error);
