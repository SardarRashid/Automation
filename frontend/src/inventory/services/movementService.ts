import { inventoryService } from '../../services/inventory';
export const { getMovementsByRoom, calculateCurrentStock, logMovement } = inventoryService;

// Re-export getActiveLotsInRoom for the UI
import { getStockLots } from './productService';
export async function getActiveLotsInRoom(roomId: string): Promise<any[]> {
  const movements = await getMovementsByRoom(roomId);
  const qtyMap: Record<string, number> = {};
  
  for(const mov of movements) {
    qtyMap[mov.stockLotId] = (qtyMap[mov.stockLotId] || 0) + mov.quantity;
  }
  
  const activeLotIds = Object.keys(qtyMap).filter(id => qtyMap[id] > 0);
  if (activeLotIds.length === 0) return [];
  
  const allLots = await getStockLots();
  
  return allLots
    .filter(lot => activeLotIds.includes(lot.id))
    .map(lot => ({
      ...lot,
      expectedQty: qtyMap[lot.id]
    }));
}
