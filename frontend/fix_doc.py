import re

file_path = "D:/AntiGravity/inventory-web-workspace/frontend/src/inventory/services/dbService.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the shim's import line to include child
content = content.replace(
    'import { ref, get, set, update, remove, query as dbQuery, orderByChild, equalTo, onValue, off, push } from "firebase/database";',
    'import { ref, get, set, update, remove, query as dbQuery, orderByChild, equalTo, onValue, off, push, child } from "firebase/database";'
)

# Replace the doc function
old_doc = """const doc = (db, path, id) => {
    if (id) return ref(db, `${path}/${id}`);
    return push(ref(db, path));
};"""

new_doc = """const doc = (dbOrRef, pathOrId, optionalId) => {
    if (optionalId !== undefined) {
        return ref(dbOrRef, `${pathOrId}/${optionalId}`);
    }
    if (pathOrId !== undefined) {
        if (dbOrRef && dbOrRef.type === 'database') {
            return ref(dbOrRef, pathOrId);
        } else {
            return child(dbOrRef, pathOrId);
        }
    }
    return push(dbOrRef);
};"""

content = content.replace(old_doc, new_doc)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("doc shim fixed in dbService.ts")
