
import re

filepath = "frontend/src/lib/firebase.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add get, ref, update to firebase/database imports
if "from \"firebase/database\"" in content:
    content = content.replace("import { getDatabase } from \"firebase/database\";", "import { getDatabase, ref, get, update } from \"firebase/database\";")

# Rewrite signInUser to track attempts
old_sign_in = """export const signInUser = async (email: string, pass: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
};"""

new_sign_in = """export const signInUser = async (email: string, pass: string) => {
  const userKey = email.toLowerCase().replace(/[.#$\\[\\]]/g, "_");
  const userRef = ref(database, `users/${userKey}`);
  
  // Check if locked before attempting
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    if (data.disabled) throw new Error("Account disabled by administrator.");
    if (data.locked) throw new Error("Account locked. Please contact support.");
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    // Reset login attempts on success
    if (snapshot.exists()) {
      await update(userRef, { loginAttempts: 0 });
    }
    
    return userCredential.user;
  } catch (error: any) {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const currentAttempts = (data.loginAttempts || 0) + 1;
      const maxAttempts = data.maxLoginAttempts || 5; // Default to 5
      
      const updates: any = { loginAttempts: currentAttempts };
      if (currentAttempts >= maxAttempts) {
        updates.locked = true;
      }
      
      await update(userRef, updates);
      
      if (currentAttempts >= maxAttempts) {
        throw new Error("Account locked due to too many failed attempts.");
      }
    }
    throw error;
  }
};"""

content = content.replace(old_sign_in, new_sign_in)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("firebase.ts refactored.")

