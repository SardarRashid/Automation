import { database } from '../lib/firebase';
import { ref, get, set, remove, push } from 'firebase/database';
import type { InventoryRecord, StockLot, InventoryMovement } from '../inventory/types';

export async function migrateToLedger() {
  console.log("Starting migration to Room-Centric Ledger...");
  
  const recordsRef = ref(database, 'inventory_records');
  const snap = await get(recordsRef);
  
  if (!snap.exists()) {
    console.log("No inventory_records found to migrate.");
    return;
  }
  
  const records = snap.val();
  let migratedCount = 0;
  
  const movementsRef = ref(database, 'inventory_movements');
  const stockLotsRef = ref(database, 'stock_lots');
  
  for (const key of Object.keys(records)) {
    const r: InventoryRecord = records[key];
    
    // Create a StockLot for this product
    const lotRef = push(stockLotsRef);
    const lotId = lotRef.key as string;
    
    const now = new Date().toISOString();
    const stockLot: StockLot = {
      id: lotId,
      categoryId: r.category || 'Unknown',
      variety: r.variety || 'Standard',
      size: r.size || 'Standard',
      originCountry: r.originCountry || 'Unknown',
      grade: r.grade || 'Standard',
      status: 'Stored',
      createdAt: now,
      updatedAt: now
    };
    
    await set(lotRef, stockLot);
    
    // Create an initial InventoryMovement based on available stock
    if (r.available > 0) {
      const movRef = push(movementsRef);
      const movId = movRef.key as string;
      
      const movement: InventoryMovement = {
        id: movId,
        timestamp: now,
        roomId: r.location || 'Store 1',
        stockLotId: lotId,
        quantity: r.available,
        type: 'ADJUSTMENT',
        notes: 'Initial migration from legacy records',
        createdBy: 'system_migration'
      };
      
      await set(movRef, movement);
    }
    
    migratedCount++;
  }
  
  console.log(`Successfully migrated ${migratedCount} legacy records to StockLots and InventoryMovements.`);
  // Note: Not deleting old records immediately for safety.
}
