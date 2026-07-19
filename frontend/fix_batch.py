import re

file_path = "D:/AntiGravity/inventory-web-workspace/frontend/src/inventory/services/dbService.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

bad_batch = """const writeBatch = (db) => {
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
};"""

good_batch = """const writeBatch = (db) => {
    const operations = [];
    return {
        set: (docRef, data) => {
            operations.push(() => set(docRef, data));
        },
        delete: (docRef) => {
            operations.push(() => remove(docRef));
        },
        commit: async () => {
            for (const op of operations) {
                await op();
            }
        }
    };
};"""

content = content.replace(bad_batch, good_batch)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("dbService.ts fixed.")
