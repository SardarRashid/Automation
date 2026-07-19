import type { InventoryRecord } from "./types";
import { database } from "../../lib/firebase";
import { ref, push, set, onValue, get } from "firebase/database";

export interface StockCount {
  id?: string;
  date: string;
  storeRoom: string;
  category: string;
  variety: string;
  size: string;
  quantity: number;
  storekeeperId: string;
  storekeeperName: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  timestamp: string;
  notes?: string;
  originCountry?: string;
  grade?: string;
  subVariety?: string;
}

// Service functions for stock counts
export const submitStockCount = async (count: Omit<StockCount, 'id'>) => {
  const countsRef = ref(database, 'stock_counts');
  const newRef = push(countsRef);
  await set(newRef, { ...count, id: newRef.key });
};

export const approveStockCount = async (countId: string) => {
  const countRef = ref(database, `stock_counts/${countId}`);
  const snap = await get(countRef);
  if (!snap.exists()) return;
  
  const countData = snap.val() as StockCount;
  
  // 1. Mark as approved
  await set(ref(database, `stock_counts/${countId}/status`), 'Approved');
  
  // 2. Merge into Complete Master Sheet (inventory_records)
  // Search for an existing record today with the same details
  const recordsRef = ref(database, 'inventory_records');
  const recordsSnap = await get(recordsRef);
  
  let targetRecordId = null;
  
  if (recordsSnap.exists()) {
    const records = recordsSnap.val();
    for (const key in records) {
      const rec = records[key] as InventoryRecord;
      if (
        rec.date === countData.date &&
        rec.location === countData.storeRoom &&
        rec.category === countData.category &&
        rec.variety === countData.variety &&
        rec.size === countData.size &&
        (rec.originCountry || '') === (countData.originCountry || '') &&
        (rec.grade || '') === (countData.grade || '') &&
        (rec.subVariety || '') === (countData.subVariety || '')
      ) {
        targetRecordId = key;
        break;
      }
    }
  }
  
  if (targetRecordId) {
    // Update existing record's available count
    await set(ref(database, `inventory_records/${targetRecordId}/available`), countData.quantity);
  } else {
    // Create new record
    const newRecRef = push(ref(database, 'inventory_records'));
    const newRec: InventoryRecord = {
      id: newRecRef.key as string,
      date: countData.date,
      category: countData.category,
      variety: countData.variety,
      size: countData.size,
      location: countData.storeRoom,
      arrivalDate: countData.date,
      openingStock: 0,
      incoming: 0,
      sold: 0,
      available: countData.quantity,
      updatedAt: new Date().toISOString(),
      originCountry: countData.originCountry,
      grade: countData.grade,
      subVariety: countData.subVariety,
      notes: countData.notes
    };
    await set(newRecRef, newRec);
  }
};

export const rejectStockCount = async (countId: string) => {
  await set(ref(database, `stock_counts/${countId}/status`), 'Rejected');
};


import type { StockCountSession } from '../types';

export const submitStockCountSession = async (session: Omit<StockCountSession, 'id'>) => {
  const countsRef = ref(database, 'stock_count_sessions');
  const newRef = push(countsRef);
  await set(newRef, { ...session, id: newRef.key });
};

export const getPendingCountSessions = async (): Promise<StockCountSession[]> => {
  const countsRef = ref(database, 'stock_count_sessions');
  const snap = await get(countsRef);
  if (!snap.exists()) return [];
  
  const sessions: StockCountSession[] = [];
  const data = snap.val();
  for (const key in data) {
    if (data[key].status === 'Pending Verification') {
      sessions.push(data[key]);
    }
  }
  return sessions;
};

import { logMovement } from './movementService';

export const approveStockCountSession = async (sessionId: string) => {
  const sessionRef = ref(database, `stock_count_sessions/${sessionId}`);
  const snap = await get(sessionRef);
  if (!snap.exists()) return;
  
  const sessionData = snap.val() as StockCountSession;
  if (sessionData.status === 'Approved' || sessionData.status === 'Rejected') {
    throw new Error("Session has already been processed.");
  }
  
  // 1. Mark as approved
  await set(ref(database, `stock_count_sessions/${sessionId}/status`), 'Approved');
  
  // 2. Log InventoryMovement for variances
  for (const item of sessionData.items) {
    if (item.difference !== 0) {
      await logMovement({
        roomId: sessionData.storeRoomId,
        stockLotId: item.stockLotId,
        quantity: item.difference, // Positive means surplus, Negative means shrinkage
        type: 'COUNT_ADJUSTMENT',
        referenceId: sessionData.id,
        notes: `Inventory Count Variance. Reason: ${item.reason || 'None'} - ${item.notes || ''}`,
        createdBy: sessionData.storekeeperName
      });
    }
  }
};

export const rejectStockCountSession = async (sessionId: string) => {
  await set(ref(database, `stock_count_sessions/${sessionId}/status`), 'Rejected');
};

