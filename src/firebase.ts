import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  writeBatch,
  onSnapshot,
  orderBy
} from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  projectId: "organic-reason-4ln7n",
  appId: "1:51257411933:web:f6e1aacbac75c1390600b4",
  apiKey: "AIzaSyASv9xsYOCEvXWVXQBIg7_9FMjqyl-jayk",
  authDomain: "organic-reason-4ln7n.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-d79e9548-836a-4942-9303-48c1f0459e1d",
  storageBucket: "organic-reason-4ln7n.firebasestorage.app",
  messagingSenderId: "51257411933",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

export { 
  db, 
  auth,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  writeBatch,
  onSnapshot,
  orderBy
};
