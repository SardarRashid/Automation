import re

file_path = "D:/AntiGravity/inventory-web-workspace/frontend/src/inventory/services/dbService.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace imports
content = content.replace(
    'import {\n  db, \n  auth\n} from "../../lib/firebase";',
    'import { database as db, auth } from "../../lib/firebase";'
)

content = content.replace(
    'import { \n  db, \n  auth\n} from "../../lib/firebase";',
    'import { database as db, auth } from "../../lib/firebase";'
)

# Remove firestore imports
content = re.sub(r'import\s*\{[^}]*\}\s*from\s*"firebase/firestore";', 'import { ref, get, set, update, remove, query, orderByChild, equalTo, onValue, off, push } from "firebase/database";', content)

# Replace handles
# colRef = collection(db, CATEGORIES_COLLECTION);
content = re.sub(r'const\s+(\w+)\s*=\s*collection\(db,\s*([^)]+)\);', r'const \1 = ref(db, \2);', content)

# getDocs(colRef)
# snapshot.empty -> !snapshot.exists()
# snapshot.forEach -> snapshot.forEach((child) => { const doc = { id: child.key, data: () => child.val() }; ... })
# docRef = doc(db, COLLECTION, id); -> ref(db, COLLECTION + "/" + id)
# setDoc(docRef, data) -> set(docRef, data)

# A better way is to provide a shim for Firestore at the top of the file!
shim = """
import { ref, get, set, update, remove, query as dbQuery, orderByChild, equalTo, onValue, off, push } from "firebase/database";

const collection = (db, path) => ref(db, path);
const doc = (db, path, id) => {
    if (id) return ref(db, `${path}/${id}`);
    return push(ref(db, path));
};
const getDocs = async (qRef) => {
    const snap = await get(qRef);
    const docs = [];
    if (snap.exists()) {
        snap.forEach(child => {
            docs.push({ id: child.key, data: () => child.val() });
        });
    }
    return {
        empty: !snap.exists(),
        forEach: (cb) => docs.forEach(cb),
        docs: docs
    };
};
const setDoc = async (docRef, data) => await set(docRef, data);
const addDoc = async (colRef, data) => {
    const newRef = push(colRef);
    await set(newRef, data);
    return { id: newRef.key };
};
const deleteDoc = async (docRef) => await remove(docRef);
const query = (colRef, ...conditions) => {
    let q = colRef;
    conditions.forEach(cond => {
        if (cond.type === 'where') {
            q = dbQuery(colRef, orderByChild(cond.field), equalTo(cond.value));
        }
    });
    return q;
};
const where = (field, op, value) => ({ type: 'where', field, op, value });
const writeBatch = (db) => {
    const updates = {};
    return {
        set: (docRef, data) => {
            // docRef is a Reference, we need its path relative to root
            const path = docRef.toString().substring(docRef.root.toString().length);
            updates[path] = data;
        },
        delete: (docRef) => {
            const path = docRef.toString().substring(docRef.root.toString().length);
            updates[path] = null;
        },
        commit: async () => {
            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
            }
        }
    };
};
const onSnapshot = (qRef, callback) => {
    const listener = onValue(qRef, (snap) => {
        const docs = [];
        if (snap.exists()) {
            snap.forEach(child => {
                docs.push({ id: child.key, data: () => child.val() });
            });
        }
        callback({
            empty: !snap.exists(),
            forEach: (cb) => docs.forEach(cb),
            docs: docs
        });
    });
    return () => off(qRef, 'value', listener);
};
"""

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('import {\n  collection, \n  doc, \n  setDoc, \n    getDocs, \n  query, \n  where, \n  deleteDoc, \n    addDoc, \n  writeBatch,\n  \n} from "firebase/firestore";', shim)
content = content.replace('import {\n  collection, \n  doc, \n  setDoc, \n  getDocs, \n  query, \n  where, \n  deleteDoc, \n  addDoc, \n  writeBatch,\n  onSnapshot\n} from "firebase/firestore";', shim)

# Catch any generic firestore import
content = re.sub(r'import\s*\{[^}]*\}\s*from\s*"firebase/firestore";', shim, content)

# Fix the db import
content = re.sub(
    r'import\s*\{\s*db,\s*auth\s*\}\s*from\s*"../../lib/firebase";',
    'import { database as db, auth } from "../../lib/firebase";',
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("dbService.ts patched successfully.")
