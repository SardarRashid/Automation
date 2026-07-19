import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
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
    try {
        const email = "salesman@test.com";
        const password = "password123";
        let uid;
        try {
            console.log("Creating salesman user...");
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            uid = cred.user.uid;
            console.log("Salesman User created:", uid);
        }
        catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                console.log("Salesman already exists in Auth, signing in to get UID...");
                const cred = await signInWithEmailAndPassword(auth, email, password);
                uid = cred.user.uid;
            }
            else {
                throw err;
            }
        }
        const userKey = email.toLowerCase().replace(/[.#$\[\]]/g, '_');
        await set(ref(database, `users/${userKey}`), {
            email: email,
            role: 'SALESPERSON',
            password: password,
            allowedApps: {
                salesman: true
            },
            permissions: {
                canEditOrders: true
            }
        });
        console.log("Successfully created test salesman!");
        process.exit(0);
    }
    catch (err) {
        console.error("Error creating salesman:", err);
        process.exit(1);
    }
}
run();
