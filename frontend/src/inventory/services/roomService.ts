import { database } from '../../lib/firebase';
import { ref, get, set, update, child } from 'firebase/database';
import type { StoreRoom, StoreRoomMetrics } from '../types';
import { calculateCurrentStock } from './movementService';

const STOREROOMS_COLLECTION = 'store_rooms';

export async function getStoreRooms(): Promise<StoreRoom[]> {
  const snap = await get(ref(database, STOREROOMS_COLLECTION));
  if (!snap.exists()) return [];
  
  const rooms: StoreRoom[] = [];
  snap.forEach(child => {
    rooms.push({ id: child.key, ...child.val() } as StoreRoom);
  });
  return rooms;
}

export async function getRoomMetrics(roomId: string): Promise<StoreRoomMetrics> {
  const snap = await get(child(ref(database, STOREROOMS_COLLECTION), roomId));
  if (!snap.exists()) return { capacity: 0, currentUtilization: 0 };
  
  const room = snap.val() as StoreRoom;
  const capacity = (room as any).capacity || 1000; // Default capacity
  
  const currentStock = await calculateCurrentStock(roomId);
  const utilization = capacity > 0 ? (currentStock / capacity) * 100 : 0;
  
  return {
    capacity,
    currentUtilization: Math.min(100, Math.round(utilization * 10) / 10)
  };
}

export async function saveStoreRoom(room: StoreRoom): Promise<void> {
  await set(child(ref(database, STOREROOMS_COLLECTION), room.id), room);
}
