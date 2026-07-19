const { initializeApp } = require('firebase/app');
const { getDatabase, ref, child, push } = require('firebase/database');

const app = initializeApp({ databaseURL: "https://mock.firebaseio.com", projectId: "mock" });
const db = getDatabase(app);

const doc = (dbOrRef, pathOrId, optionalId) => {
    if (optionalId !== undefined) {
        return ref(dbOrRef, `${pathOrId}/${optionalId}`);
    }
    if (pathOrId !== undefined) {
        if (dbOrRef.type === 'database') {
            return ref(dbOrRef, pathOrId);
        } else {
            return child(dbOrRef, pathOrId);
        }
    }
    return push(dbOrRef);
};

const colRef = ref(db, 'categories');

try {
    console.log("doc(db, 'cat', 'id'):", doc(db, 'cat', 'id').toString());
    console.log("doc(colRef, 'id'):", doc(colRef, 'id').toString());
    console.log("doc(db, 'cat/id'):", doc(db, 'cat/id').toString());
    console.log("doc(colRef):", doc(colRef).toString());
} catch(e) {
    console.error(e);
}
