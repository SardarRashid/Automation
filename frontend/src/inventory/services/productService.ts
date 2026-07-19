import { inventoryService } from '../../services/inventory';
import { database } from '../../lib/firebase';
import { ref, update, child, push, set } from 'firebase/database';
export const { getStockLots } = inventoryService;

export async function updateStockLotStatus(lotId: string, status: string): Promise<void> {
  const lotRef = child(ref(database, 'stock_lots'), lotId);
  await update(lotRef, {
    status,
    updatedAt: new Date().toISOString()
  });
}

export async function createStockLot(lotData: any): Promise<any> {
  const newRef = push(ref(database, 'stock_lots'));
  const lot = {
    ...lotData,
    id: newRef.key,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await set(newRef, lot);
  return lot;
}
