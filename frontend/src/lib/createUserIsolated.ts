import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "./firebase";

export async function createUserWithoutSwitchingSession(email: string, pass: string) {
  const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
  const tempAuth = getAuth(tempApp);
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, pass);
    return cred.user;
  } finally {
    await deleteApp(tempApp);
  }
}
