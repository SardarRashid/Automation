import { database as db, auth } from "../../lib/firebase";

import { ref, get, set, update, remove, query as dbQuery, orderByChild, equalTo, onValue, off, push, child } from "firebase/database";

const collection = (db, path) => ref(db, path);
const doc = (dbOrRef, pathOrId, optionalId) => {
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

import type { CategoryTemplate, InventoryRecord, ActivityLog, StoreRoom, Storekeeper } from "../types";

const RECORDS_COLLECTION = "inventory_records";
const CATEGORIES_COLLECTION = "category_templates";
const LOGS_COLLECTION = "activity_logs";
const STOREROOMS_COLLECTION = "store_rooms";

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;
export type OperationTypeEnum = typeof OperationType[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationTypeEnum;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function isPermissionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return msg.includes("permission") || msg.includes("insufficient");
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default Category Templates to seed if Firestore is empty
const DEFAULT_CATEGORIES: CategoryTemplate[] = [
  {
    id: "apple",
    name: "Apple",
    varieties: ["Golden Apple", "Green Apple", "Red Apple", "Fuji Apple", "Gala Apple"],
    sizes: ["100", "113", "125", "138", "Standard"],
    origins: ["Spain", "SA", "USA", "Egypt", "Chile", "South Africa"],
    grades: ["Class 1", "Extra Fancy", "Fancy"],
    subVarieties: ["Gala", "Golden", "Red Delicious", "Fuji", "Granny Smith"]
  },
  {
    id: "carrot",
    name: "Carrots",
    varieties: ["Baby Carrots", "Nantes Carrots", "Imperator Carrots", "Chantenay Carrots"],
    sizes: ["Standard", "Large", "Jumbo", "N/A"],
    origins: ["Spain", "Egypt", "SA"],
    grades: ["Premium Grade", "Class 1"],
    subVarieties: ["Organic Baby", "Raw Whole"]
  },
  {
    id: "lemon",
    name: "Lemon",
    varieties: ["Eureka Lemon", "Meyer Lemon", "Lisbon Lemon", "Organic Lemon"],
    sizes: ["115", "140", "165", "200", "Standard"],
    origins: ["Spain", "SA", "South Africa", "Chile"],
    grades: ["Choice", "Standard Grade"],
    subVarieties: ["Meyer", "Eureka"]
  }
];

// Helper to seed categories if they don't exist
export async function seedCategoriesIfNeeded(): Promise<CategoryTemplate[]> {
  try {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    let snapshot;
    try {
      snapshot = await getDocs(colRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, CATEGORIES_COLLECTION);
      }
      throw err;
    }
    
    if (snapshot.empty) {
      console.log("Seeding default categories in Firestore...");
      const batch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        const docRef = doc(colRef, cat.id);
        batch.set(docRef, cat);
      }
      try {
        await batch.commit();
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.WRITE, CATEGORIES_COLLECTION);
        }
        throw err;
      }
      return DEFAULT_CATEGORIES;
    } else {
      const categories: CategoryTemplate[] = [];
      snapshot.forEach((doc) => {
        categories.push(doc.data() as CategoryTemplate);
      });
      return categories;
    }
  } catch (err) {
    console.error("Error seeding categories:", err);
    // Fallback to local storage or defaults if offline/firebase fails
    const local = localStorage.getItem("local_categories");
    if (local) {
      return JSON.parse(local);
    }
    localStorage.setItem("local_categories", JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
}

// Get all Category Templates
export async function getCategoryTemplates(): Promise<CategoryTemplate[]> {
  return await seedCategoriesIfNeeded();
}

// Save/Update Category Template
export async function saveCategoryTemplate(template: CategoryTemplate): Promise<void> {
  updateSyncStatus("saving");
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, template.id);
    try {
      await setDoc(docRef, template);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `${CATEGORIES_COLLECTION}/${template.id}`);
      }
      throw err;
    }
    
    // Update local storage representation as fallback
    const currentList = await getCategoryTemplates();
    const index = currentList.findIndex(c => c.id === template.id);
    if (index >= 0) {
      currentList[index] = template;
    } else {
      currentList.push(template);
    }
    localStorage.setItem("local_categories", JSON.stringify(currentList));
    await logActivity("update", `Updated category configuration for ${template.name}`);
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Error saving category template:", err);
    updateSyncStatus("pending_offline");
    // Fallback
    const local = localStorage.getItem("local_categories");
    const list: CategoryTemplate[] = local ? JSON.parse(local) : [...DEFAULT_CATEGORIES];
    const index = list.findIndex(c => c.id === template.id);
    if (index >= 0) {
      list[index] = template;
    } else {
      list.push(template);
    }
    localStorage.setItem("local_categories", JSON.stringify(list));
  }
}

// Get inventory records for a specific date (YYYY-MM-DD)
export async function getRecordsByDate(dateStr: string): Promise<InventoryRecord[]> {
  try {
    const colRef = collection(db, RECORDS_COLLECTION);
    const q = query(colRef, where("date", "==", dateStr));
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, RECORDS_COLLECTION);
      }
      throw err;
    }
    
    const records: InventoryRecord[] = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as InventoryRecord);
    });
    
    // Sort by Category then Variety then Size
    return records.sort((a, b) => {
      const catComp = a.category.localeCompare(b.category);
      if (catComp !== 0) return catComp;
      const varComp = a.variety.localeCompare(b.variety);
      if (varComp !== 0) return varComp;
      return a.size.localeCompare(b.size);
    });
  } catch (err) {
    console.error(`Error loading records for ${dateStr}:`, err);
    // Fallback to local storage mock/cache
    const localRecords = localStorage.getItem(`local_records_${dateStr}`);
    if (localRecords) {
      return JSON.parse(localRecords);
    }
    
    // If it's the current date and we have empty local, let's pre-populate some elegant mock records
    // so the app has working examples immediately.
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      const sampleRecords = seedSampleRecords(dateStr);
      localStorage.setItem(`local_records_${dateStr}`, JSON.stringify(sampleRecords));
      return sampleRecords;
    }
    return [];
  }
}

// Seed sample records for today
function seedSampleRecords(dateStr: string): InventoryRecord[] {
  return [
    {
      id: `sample_gala_${dateStr}`,
      date: dateStr,
      category: "Apple",
      variety: "Gala Apple",
      size: "100",
      location: "Container-A1",
      arrivalDate: "2026-06-15",
      openingStock: 120,
      incoming: 50,
      sold: 40,
      available: 130, // 120 + 50 - 40
      notes: "Slightly soft Gala apples. Move fast.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `sample_green_${dateStr}`,
      date: dateStr,
      category: "Apple",
      variety: "Green Apple",
      size: "113",
      location: "Cold-Warehouse-1",
      arrivalDate: "2026-06-16",
      openingStock: 80,
      incoming: 100,
      sold: 30,
      available: 150, // 80 + 100 - 30
      updatedAt: new Date().toISOString(),
    },
    {
      id: `sample_fuji_${dateStr}`,
      date: dateStr,
      category: "Apple",
      variety: "Fuji Apple",
      size: "100",
      location: "Container-A2",
      arrivalDate: "2026-06-14",
      openingStock: 60,
      incoming: 0,
      sold: 15,
      available: 45, // 60 + 0 - 15
      notes: "Premium size, selling well.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `sample_carrot_${dateStr}`,
      date: dateStr,
      category: "Carrots",
      variety: "Baby Carrots",
      size: "Standard",
      location: "Container-C1",
      arrivalDate: "2026-06-16",
      openingStock: 200,
      incoming: 150,
      sold: 180,
      available: 170, // 200 + 150 - 180
      updatedAt: new Date().toISOString(),
    },
    {
      id: `sample_lemon_${dateStr}`,
      date: dateStr,
      category: "Lemon",
      variety: "Meyer Lemon",
      size: "140",
      location: "Warehouse-B",
      arrivalDate: "2026-06-15",
      openingStock: 95,
      incoming: 40,
      sold: 25,
      available: 110, // 95 + 40 - 25
      updatedAt: new Date().toISOString(),
    }
  ];
}

// Save/Update an Inventory Record
export async function saveRecord(record: InventoryRecord): Promise<string> {
  const updatedAt = new Date().toISOString();
  const dataToSave = { ...record, updatedAt };
  updateSyncStatus("saving");
  
  try {
    let docId = record.id;
    try {
      if (docId) {
        const docRef = doc(db, RECORDS_COLLECTION, docId);
        await setDoc(docRef, dataToSave);
      } else {
        const colRef = collection(db, RECORDS_COLLECTION);
        const docRef = await addDoc(colRef, dataToSave);
        docId = docRef.id;
      }
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, record.id ? OperationType.UPDATE : OperationType.CREATE, RECORDS_COLLECTION);
      }
      throw err;
    }
    
    await logActivity(
      record.id ? "update" : "create", 
      `Saved ${record.variety} (${record.size}) count for ${record.date}`
    );
    
    // Sync local cache as cache
    await syncLocalCache(record.date);
    updateSyncStatus("synced");
    return docId || "saved_id";
  } catch (err) {
    console.error("Error saving record to Firestore:", err);
    updateSyncStatus("pending_offline");
    // Fallback to local storage
    const localKey = `local_records_${record.date}`;
    const local = localStorage.getItem(localKey);
    const records: InventoryRecord[] = local ? JSON.parse(local) : [];
    
    let targetId = record.id;
    if (targetId) {
      const index = records.findIndex(r => r.id === targetId);
      if (index >= 0) {
        records[index] = { ...dataToSave, id: targetId };
      }
    } else {
      targetId = "lcl_" + Math.random().toString(36).substring(2, 9);
      records.push({ ...dataToSave, id: targetId });
    }
    
    localStorage.setItem(localKey, JSON.stringify(records));
    return targetId || "local_id";
  }
}

// Bulk Save Records (for sheets)
export async function saveBulkRecords(records: InventoryRecord[]): Promise<void> {
  if (records.length === 0) return;
  const dateStr = records[0].date;
  updateSyncStatus("saving");
  
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, RECORDS_COLLECTION);
    
    for (const record of records) {
      const updatedAt = new Date().toISOString();
      if (record.id) {
        const docRef = doc(db, RECORDS_COLLECTION, record.id);
        batch.set(docRef, { ...record, updatedAt });
      } else {
        const docRef = doc(colRef);
        batch.set(docRef, { ...record, id: docRef.id, updatedAt });
      }
    }
    try {
      await batch.commit();
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, RECORDS_COLLECTION);
      }
      throw err;
    }
    await logActivity("bulk_add", `Bulk logged counts for ${dateStr} (${records.length} items)`);
    await syncLocalCache(dateStr);
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Error bulk saving records to Firestore:", err);
    updateSyncStatus("pending_offline");
    // Fallback
    localStorage.setItem(`local_records_${dateStr}`, JSON.stringify(records));
  }
}

// Delete an Inventory Record
export async function deleteRecord(id: string, dateStr: string): Promise<void> {
  updateSyncStatus("saving");
  try {
    const docRef = doc(db, RECORDS_COLLECTION, id);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.DELETE, `${RECORDS_COLLECTION}/${id}`);
      }
      throw err;
    }
    await logActivity("delete", `Deleted inventory row from ${dateStr}`);
    await syncLocalCache(dateStr);
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Error deleting record:", err);
    updateSyncStatus("pending_offline");
    // Fallback
    const localKey = `local_records_${dateStr}`;
    const local = localStorage.getItem(localKey);
    if (local) {
      const records: InventoryRecord[] = JSON.parse(local);
      const filtered = records.filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  }
}

// Carry forward ending counts from source date to target date as opening stock
export async function carryForwardRecords(sourceDate: string, targetDate: string): Promise<InventoryRecord[]> {
  const sourceRecords = await getRecordsByDate(sourceDate);
  const targetRecords: InventoryRecord[] = sourceRecords.map((rec) => {
    // Current physical available count becomes today's morning opening stock!
    const newOpening = rec.available;
    const docRef = doc(collection(db, RECORDS_COLLECTION));
    return {
      id: docRef.id,
      date: targetDate,
      category: rec.category,
      variety: rec.variety,
      size: rec.size,
      location: rec.location,
      arrivalDate: rec.arrivalDate,
      openingStock: newOpening,
      incoming: 0,
      sold: 0,
      available: newOpening, // Initial available is the same as opening stock until changes occur
      notes: rec.notes ? `Carried forward: ${rec.notes}` : "",
      updatedAt: new Date().toISOString()
    };
  });
  
  if (targetRecords.length > 0) {
    await saveBulkRecords(targetRecords);
    await logActivity("carry_forward", `Carried forward ${targetRecords.length} items from ${sourceDate} to ${targetDate}`);
  }
  return targetRecords;
}

// Helper to keep local cache sync with Firestore
async function syncLocalCache(dateStr: string) {
  try {
    const colRef = collection(db, RECORDS_COLLECTION);
    const q = query(colRef, where("date", "==", dateStr));
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, RECORDS_COLLECTION);
      }
      throw err;
    }
    const records: InventoryRecord[] = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as InventoryRecord);
    });
    localStorage.setItem(`local_records_${dateStr}`, JSON.stringify(records));
  } catch (e) {
    console.error("Local sync warning:", e);
  }
}

// Get all records in a month (YYYY-MM)
export async function getRecordsByMonth(yearMonthStr: string): Promise<InventoryRecord[]> {
  // e.g., yearMonthStr = "2026-06"
  try {
    const colRef = collection(db, RECORDS_COLLECTION);
    // query dates that start with YYYY-MM
    const start = `${yearMonthStr}-01`;
    const end = `${yearMonthStr}-31`; // Firestore can capture this by lexicographical comparison
    
    const q = query(
      colRef, 
      where("date", ">=", start),
      where("date", "<=", end)
    );
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, RECORDS_COLLECTION);
      }
      throw err;
    }
    const records: InventoryRecord[] = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as InventoryRecord);
    });
    return records.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error("General error carrying monthly records:", err);
    // fallback searching localStorage keys
    const matchedRecords: InventoryRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`local_records_${yearMonthStr}`)) {
        const val = localStorage.getItem(key);
        if (val) {
          matchedRecords.push(...JSON.parse(val));
        }
      }
    }
    return matchedRecords.sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Log an action to activity log
export async function logActivity(action: ActivityLog['action'], description: string): Promise<void> {
  const log: ActivityLog = {
    id: "log_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    action,
    description
  };
  
  try {
    const colRef = collection(db, LOGS_COLLECTION);
    try {
      await addDoc(colRef, log);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.CREATE, LOGS_COLLECTION);
      }
      throw err;
    }
  } catch (err) {
    // Silent fail or write locally
    const existingLogs = JSON.parse(localStorage.getItem("activity_logs") || "[]");
    existingLogs.unshift(log);
    localStorage.setItem("activity_logs", JSON.stringify(existingLogs.slice(0, 50)));
  }
}

// Get standard logs
export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    const colRef = collection(db, LOGS_COLLECTION);
    let snapshot;
    try {
      snapshot = await getDocs(colRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, LOGS_COLLECTION);
      }
      throw err;
    }
    const logs: ActivityLog[] = [];
    snapshot.forEach((doc) => {
      logs.push(doc.data() as ActivityLog);
    });
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 30);
  } catch (err) {
    return JSON.parse(localStorage.getItem("activity_logs") || "[]");
  }
}

// Storekeeper management
const STOREKEEPERS_COLLECTION = "storekeepers";

export async function getStorekeepers(): Promise<Storekeeper[]> {
  try {
    const colRef = collection(db, STOREKEEPERS_COLLECTION);
    let snapshot;
    try {
      snapshot = await getDocs(colRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, STOREKEEPERS_COLLECTION);
      }
      throw err;
    }
    const storekeepers: Storekeeper[] = [];
    snapshot.forEach((doc) => {
      storekeepers.push({ id: doc.id, ...doc.data() } as Storekeeper);
    });
    return storekeepers;
  } catch (err) {
    console.warn("Error loading storekeepers, falling back to local storage:", err);
    return JSON.parse(localStorage.getItem("local_storekeepers") || "[]");
  }
}

export async function saveStorekeeper(storekeeper: Storekeeper): Promise<void> {
  updateSyncStatus("saving");
  try {
    const docRef = doc(db, STOREKEEPERS_COLLECTION, storekeeper.id);
    try {
      await setDoc(docRef, storekeeper);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `${STOREKEEPERS_COLLECTION}/${storekeeper.id}`);
      }
      throw err;
    }
    // Update local storage cache
    const current = await getStorekeepers();
    const idx = current.findIndex(s => s.id === storekeeper.id);
    if (idx >= 0) {
      current[idx] = storekeeper;
    } else {
      current.push(storekeeper);
    }
    localStorage.setItem("local_storekeepers", JSON.stringify(current));
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Failed to save storekeeper:", err);
    updateSyncStatus("pending_offline");
    throw err;
  }
}

export async function deleteStorekeeper(id: string): Promise<void> {
  updateSyncStatus("saving");
  try {
    const docRef = doc(db, STOREKEEPERS_COLLECTION, id);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.DELETE, `${STOREKEEPERS_COLLECTION}/${id}`);
      }
      throw err;
    }
    // Update local storage cache
    const current = await getStorekeepers();
    const filtered = current.filter(s => s.id !== id);
    localStorage.setItem("local_storekeepers", JSON.stringify(filtered));
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Failed to delete storekeeper:", err);
    updateSyncStatus("pending_offline");
    throw err;
  }
}

// seed admin if none exists
export async function seedDefaultAdminIfNeeded(): Promise<Storekeeper[]> {
  try {
    const list = await getStorekeepers();
    const admins = list.filter(u => u.role === 'it_admin');
    if (admins.length === 0) {
      const defaultIT: Storekeeper = {
        id: "admin_" + Math.random().toString(36).substring(2, 9),
        name: "IT Database Controller",
        email: "admin@sharbatly.com",
        pin: "admin123",
        assignedSection: "All",
        assignedStoreNum: "All",
        role: 'it_admin',
        hasMobileAccess: true
      };
      const defaultManager: Storekeeper = {
        id: "manager_" + Math.random().toString(36).substring(2, 9),
        name: "General Manager (Master)",
        email: "manager@sharbatly.com",
        pin: "manager123",
        assignedSection: "All",
        assignedStoreNum: "All",
        role: 'manager',
        hasMobileAccess: true
      };
      const defaultSupervisor: Storekeeper = {
        id: "super_" + Math.random().toString(36).substring(2, 9),
        name: "Fruit supervisor (Apple + Citrus)",
        email: "supervisor@sharbatly.com",
        pin: "super123",
        assignedSection: "Apple,Citrus",
        assignedStoreNum: "Store 1,Store 3",
        role: 'supervisor',
        hasMobileAccess: true
      };
      const defaultStorekeeper: Storekeeper = {
        id: "keeper_" + Math.random().toString(36).substring(2, 9),
        name: "Abbas (Mobile Auditor)",
        email: "storekeeper@sharbatly.com",
        pin: "1234",
        assignedSection: "Apple",
        assignedStoreNum: "Store 1",
        role: 'storekeeper',
        hasMobileAccess: true
      };
      
      await saveStorekeeper(defaultIT);
      await saveStorekeeper(defaultManager);
      await saveStorekeeper(defaultSupervisor);
      await saveStorekeeper(defaultStorekeeper);
      
      return [defaultIT, defaultManager, defaultSupervisor, defaultStorekeeper];
    }
    return list;
  } catch (e) {
    console.error("Error seeding default users:", e);
    // ensure local storage has at least standard mock backup
    const backupAdmin: Storekeeper = {
      id: "admin_local",
      name: "IT Admin (Offline)",
      email: "admin@sharbatly.com",
      pin: "admin123",
      assignedSection: "All",
      assignedStoreNum: "All",
      role: 'it_admin',
      hasMobileAccess: true
    };
    const backupList = [backupAdmin];
    localStorage.setItem("local_storekeepers", JSON.stringify(backupList));
    return backupList;
  }
}

const DEFAULT_STOREROOMS: StoreRoom[] = [
  { id: "store-1", name: "Store 1", description: "Main fruit room 1" },
  { id: "store-2", name: "Store 2", description: "Main fruit room 2" },
  { id: "store-3", name: "Store 3", description: "Citrus cold room" },
  { id: "store-4", name: "Store 4", description: "Banana cold room" },
  { id: "store-5", name: "Store 5", description: "Vegetable cold room" },
  { id: "store-6", name: "Store 6", description: "Fast delivery corridor" },
  { id: "veg-area", name: "Vegetable Area", description: "Medium-temp cooling zone" },
  { id: "flower-cooler", name: "Flower Cooler", description: "High-humidity floral room" }
];

export async function seedStoreRoomsIfNeeded(): Promise<StoreRoom[]> {
  try {
    const colRef = collection(db, STOREROOMS_COLLECTION);
    let snapshot;
    try {
      snapshot = await getDocs(colRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, STOREROOMS_COLLECTION);
      }
      throw err;
    }
    
    if (snapshot.empty) {
      console.log("Seeding default store rooms in Firestore...");
      const batch = writeBatch(db);
      for (const room of DEFAULT_STOREROOMS) {
        const docRef = doc(colRef, room.id);
        batch.set(docRef, room);
      }
      try {
        await batch.commit();
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.WRITE, STOREROOMS_COLLECTION);
        }
        throw err;
      }
      return DEFAULT_STOREROOMS;
    } else {
      const rooms: StoreRoom[] = [];
      snapshot.forEach((doc) => {
        rooms.push(doc.data() as StoreRoom);
      });
      return rooms;
    }
  } catch (err) {
    console.error("Error seeding store rooms:", err);
    const local = localStorage.getItem("local_store_rooms");
    if (local) {
      return JSON.parse(local);
    }
    localStorage.setItem("local_store_rooms", JSON.stringify(DEFAULT_STOREROOMS));
    return DEFAULT_STOREROOMS;
  }
}

export async function getStoreRooms(): Promise<StoreRoom[]> {
  return await seedStoreRoomsIfNeeded();
}

export async function saveStoreRoom(room: StoreRoom): Promise<void> {
  updateSyncStatus("saving");
  try {
    const docRef = doc(db, STOREROOMS_COLLECTION, room.id);
    try {
      await setDoc(docRef, room);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `${STOREROOMS_COLLECTION}/${room.id}`);
      }
      throw err;
    }
    
    const currentList = await getStoreRooms();
    const index = currentList.findIndex(r => r.id === room.id);
    if (index >= 0) {
      currentList[index] = room;
    } else {
      currentList.push(room);
    }
    localStorage.setItem("local_store_rooms", JSON.stringify(currentList));
    await logActivity("update", `Updated cold room setup for ${room.name}`);
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Error saving store room:", err);
    updateSyncStatus("pending_offline");
    const local = localStorage.getItem("local_store_rooms");
    const list: StoreRoom[] = local ? JSON.parse(local) : [...DEFAULT_STOREROOMS];
    const index = list.findIndex(r => r.id === room.id);
    if (index >= 0) {
      list[index] = room;
    } else {
      list.push(room);
    }
    localStorage.setItem("local_store_rooms", JSON.stringify(list));
  }
}

export async function deleteStoreRoom(id: string): Promise<void> {
  updateSyncStatus("saving");
  try {
    const docRef = doc(db, STOREROOMS_COLLECTION, id);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.DELETE, `${STOREROOMS_COLLECTION}/${id}`);
      }
      throw err;
    }
    
    const currentList = await getStoreRooms();
    const filtered = currentList.filter(r => r.id !== id);
    localStorage.setItem("local_store_rooms", JSON.stringify(filtered));
    await logActivity("delete", `Removed cold room location: ${id}`);
    updateSyncStatus("synced");
  } catch (err) {
    console.error("Error deleting store room:", err);
    updateSyncStatus("pending_offline");
    const local = localStorage.getItem("local_store_rooms");
    if (local) {
      const list: StoreRoom[] = JSON.parse(local);
      const filtered = list.filter(r => r.id !== id);
      localStorage.setItem("local_store_rooms", JSON.stringify(filtered));
    }
  }
}

// Global Sync Status tracking mechanism for active Firestore saves
export type SyncStatusType = "synced" | "saving" | "pending_offline";

let currentSyncStatus: SyncStatusType = "synced";
const syncStatusListeners = new Set<(status: SyncStatusType) => void>();

export function getSyncStatus(): SyncStatusType {
  return currentSyncStatus;
}

export function subscribeToSyncStatus(listener: (status: SyncStatusType) => void) {
  syncStatusListeners.add(listener);
  // Emit immediately
  listener(currentSyncStatus);
  return () => {
    syncStatusListeners.delete(listener);
  };
}


export function getPendingSyncCount(): number {
  if (typeof window === "undefined") return 0;
  let count = 0;
  try {
    const localLogs = localStorage.getItem("activity_logs");
    if (localLogs) {
      const logs = JSON.parse(localLogs);
      if (Array.isArray(logs)) count += logs.length;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("local_records_")) {
        const val = localStorage.getItem(key);
        if (val) {
          const records = JSON.parse(val);
          if (Array.isArray(records)) {
            count += records.filter((r: any) => r.id && r.id.startsWith("lcl_")).length;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error calculating pending sync count", e);
  }
  return count;
}

export function updateSyncStatus(status: SyncStatusType) {
  currentSyncStatus = status;
  syncStatusListeners.forEach(listener => listener(status));
}

// Global synchronization of offline-cached edits to Cloud Firestore
export async function syncOfflineData(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return;
  }

  updateSyncStatus("saving");
  console.log("Detecting internet restoration: Initiating global offline sync...");
  
  let hadAnyFailure = false;

  // 1. Sync category templates
  try {
    const localCats = localStorage.getItem("local_categories");
    if (localCats) {
      const categories: CategoryTemplate[] = JSON.parse(localCats);
      for (const cat of categories) {
        const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
        await setDoc(docRef, cat);
      }
    }
  } catch (err) {
    console.error("Category synchronization warning:", err);
    hadAnyFailure = true;
  }

  // 2. Sync store rooms
  try {
    const localRooms = localStorage.getItem("local_store_rooms");
    if (localRooms) {
      const rooms: StoreRoom[] = JSON.parse(localRooms);
      for (const r of rooms) {
        const docRef = doc(db, STOREROOMS_COLLECTION, r.id);
        await setDoc(docRef, r);
      }
    }
  } catch (err) {
    console.error("Store rooms synchronization warning:", err);
    hadAnyFailure = true;
  }

  // 3. Sync activity logs
  try {
    const localLogs = localStorage.getItem("activity_logs");
    if (localLogs) {
      const logs: ActivityLog[] = JSON.parse(localLogs);
      const colRef = collection(db, LOGS_COLLECTION);
      for (let i = logs.length - 1; i >= 0; i--) {
        await addDoc(colRef, logs[i]);
      }
      localStorage.removeItem("activity_logs");
    }
  } catch (err) {
    console.error("Activity logs synchronization warning:", err);
    hadAnyFailure = true;
  }

  // 4. Sync inventory records
  try {
    const keysToSync: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("local_records_")) {
        keysToSync.push(key);
      }
    }

    for (const key of keysToSync) {
      const dateStr = key.replace("local_records_", "");
      const val = localStorage.getItem(key);
      if (val) {
        const records: InventoryRecord[] = JSON.parse(val);
        for (const record of records) {
          const sanitized = { ...record };
          const id = sanitized.id;
          
          if (id && id.startsWith("lcl_")) {
            delete sanitized.id;
            const colRef = collection(db, RECORDS_COLLECTION);
            await addDoc(colRef, sanitized);
          } else if (id) {
            const docRef = doc(db, RECORDS_COLLECTION, id);
            await setDoc(docRef, sanitized);
          } else {
            const colRef = collection(db, RECORDS_COLLECTION);
            await addDoc(colRef, sanitized);
          }
        }
        await syncLocalCache(dateStr);
      }
    }
  } catch (err) {
    console.error("Inventory records synchronization error:", err);
    hadAnyFailure = true;
  }

  if (hadAnyFailure) {
    console.warn("Offline data synchronization completed with some errors.");
    updateSyncStatus("pending_offline");
  } else {
    console.log("Sync offline data complete! All records backed up safely to Cloud Firestore.");
    updateSyncStatus("synced");
  }
}





