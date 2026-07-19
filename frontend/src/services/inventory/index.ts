import { database } from '../../lib/firebase';
import { ref, get, set, push, child, query, orderByChild, equalTo } from 'firebase/database';
import { eventBus } from '../core/EventBus';
import { BusinessEventType } from '../core/EventTypes';
import type { BusinessEvent } from '../core/EventTypes';
import type { Shipment, StockLot, InventoryMovement } from '@/inventory/types';

export const inventoryService = {

  // ==========================================
  // SHIPMENTS
  // ==========================================

  async createShipment(shipment: Omit<Shipment, 'id'>): Promise<Shipment> {
    const shipRef = push(ref(database, 'shipments'));
    const id = shipRef.key as string;
    
    const newShipment: Shipment = {
      ...shipment,
      id,
      status: 'Pending'
    };
    
    await set(shipRef, newShipment);
    return newShipment;
  },

  async getShipments(): Promise<Shipment[]> {
    const snap = await get(ref(database, 'shipments'));
    if (!snap.exists()) return [];
    
    const shipments: Shipment[] = [];
    snap.forEach(child => {
      shipments.push(child.val() as Shipment);
    });
    return shipments;
  },

  async receiveShipment(
    shipmentId: string, 
    items: { lot: Omit<StockLot, 'id'|'createdAt'|'updatedAt'|'status'>, quantity: number }[], 
    userId: string
  ): Promise<void> {
    const shipRef = child(ref(database, 'shipments'), shipmentId);
    const snap = await get(shipRef);
    if (!snap.exists()) throw new Error("Shipment not found");
    
    const shipment = snap.val() as Shipment;
    if (shipment.status === 'Received' || shipment.status === 'Verified' || shipment.status === 'Closed') {
      throw new Error("Shipment has already been received or processed.");
    }

    // Instead of doing multiple DB calls, dispatch a single Business Event!
    await eventBus.dispatch(BusinessEventType.SHIPMENT_RECEIVED, { shipment, items }, userId);
  },


  // ==========================================
  // TRANSFERS
  // ==========================================
  async createTransfer(transfer: any): Promise<any> {
    const transRef = push(ref(database, 'transfers'));
    const id = transRef.key as string;
    
    const newTransfer = {
      ...transfer,
      id,
      status: 'Pending'
    };
    
    await set(transRef, newTransfer);
    return newTransfer;
  },

  async getTransfers(): Promise<any[]> {
    const snap = await get(ref(database, 'transfers'));
    if (!snap.exists()) return [];
    
    const transfers: any[] = [];
    snap.forEach(child => {
      transfers.push(child.val());
    });
    return transfers;
  },

  async executeTransfer(transferId: string, items: { stockLotId: string, quantity: number }[], userId: string): Promise<void> {
    const transRef = child(ref(database, 'transfers'), transferId);
    const snap = await get(transRef);
    if (!snap.exists()) throw new Error("Transfer not found");
    
    const transfer = snap.val();
    if (transfer.status === 'Completed' || transfer.status === 'Cancelled') {
      throw new Error("Transfer has already been processed or cancelled.");
    }

    // Pre-validate
    for (const item of items) {
      const currentStock = await this.calculateCurrentStock(transfer.sourceRoomId, item.stockLotId);
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for lot ${item.stockLotId}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
    }

    await eventBus.dispatch(BusinessEventType.STOCK_TRANSFERRED, { transfer, items }, userId);
  },

  // ==========================================
  // MOVEMENTS & STOCK
  // ==========================================

  async logMovement(movement: any): Promise<void> {
    await eventBus.dispatch(BusinessEventType.INVENTORY_ADJUSTED, movement, movement.createdBy || 'unknown');
  },

  async getMovementsByRoom(roomId: string): Promise<InventoryMovement[]> {
    const q = query(ref(database, 'inventory_movements'), orderByChild('roomId'), equalTo(roomId));
    const snap = await get(q);
    if (!snap.exists()) return [];
    
    const movements: InventoryMovement[] = [];
    snap.forEach(child => {
      movements.push(child.val() as InventoryMovement);
    });
    return movements;
  },

  async calculateCurrentStock(roomId: string, stockLotId?: string): Promise<number> {
    const q = query(ref(database, 'inventory_movements'), orderByChild('roomId'), equalTo(roomId));
    const snap = await get(q);
    if (!snap.exists()) return 0;
    
    let total = 0;
    snap.forEach(child => {
      const mov = child.val() as InventoryMovement;
      if (!stockLotId || mov.stockLotId === stockLotId) {
        total += mov.quantity;
      }
    });
    return total;
  },

  async getStockLots(status?: string): Promise<StockLot[]> {
    const snap = await get(ref(database, 'stock_lots'));
    if (!snap.exists()) return [];
    
    let lots: StockLot[] = [];
    snap.forEach(child => {
      lots.push(child.val() as StockLot);
    });
    
    if (status) {
      lots = lots.filter(l => l.status === status);
    }
    
    return lots;
  }
};

// ==========================================
// EVENT LISTENERS
// ==========================================

eventBus.subscribe(BusinessEventType.SHIPMENT_RECEIVED, async (event: BusinessEvent) => {
  const { shipment, items } = event.payload;
  const updates: Record<string, any> = {};
  
  // 1. Update Shipment Status
  updates[`shipments/${shipment.id}/status`] = 'Received';
  updates[`shipments/${shipment.id}/receivedDate`] = new Date().toISOString();

  // 2. Generate new Stock Lots and Receipt Movements
  for (const item of items) {
    const newLotRef = push(ref(database, 'stock_lots'));
    const lotId = newLotRef.key as string;
    const now = new Date().toISOString();
    
    const newLot: StockLot = {
      ...item.lot,
      id: lotId,
      status: 'Received',
      createdAt: now,
      updatedAt: now
    };
    updates[`stock_lots/${lotId}`] = newLot;
    
    const movRef = push(ref(database, 'inventory_movements'));
    const movId = movRef.key as string;
    
    const movement: InventoryMovement = {
      id: movId,
      roomId: shipment.destinationRoomId,
      stockLotId: lotId,
      quantity: item.quantity,
      type: 'RECEIPT',
      referenceId: shipment.id,
      notes: `Received via shipment ${shipment.id}`,
      createdBy: event.userId,
      timestamp: now
    };
    updates[`inventory_movements/${movId}`] = movement;
  }

  return updates;
});


eventBus.subscribe(BusinessEventType.STOCK_TRANSFERRED, async (event: BusinessEvent) => {
  const { transfer, items } = event.payload;
  const updates: Record<string, any> = {};
  
  updates[`transfers/${transfer.id}/status`] = 'Completed';
  updates[`transfers/${transfer.id}/completedDate`] = new Date().toISOString();

  for (const item of items) {
    const movOutRef = push(ref(database, 'inventory_movements'));
    updates[`inventory_movements/${movOutRef.key}`] = {
      id: movOutRef.key,
      roomId: transfer.sourceRoomId,
      stockLotId: item.stockLotId,
      quantity: -item.quantity,
      type: 'TRANSFER_OUT',
      referenceId: transfer.id,
      notes: `Transfer out to ${transfer.destinationRoomId}`,
      createdBy: event.userId,
      timestamp: new Date().toISOString()
    };
    
    const movInRef = push(ref(database, 'inventory_movements'));
    updates[`inventory_movements/${movInRef.key}`] = {
      id: movInRef.key,
      roomId: transfer.destinationRoomId,
      stockLotId: item.stockLotId,
      quantity: item.quantity,
      type: 'TRANSFER_IN',
      referenceId: transfer.id,
      notes: `Transfer in from ${transfer.sourceRoomId}`,
      createdBy: event.userId,
      timestamp: new Date().toISOString()
    };
  }

  return updates;
});


eventBus.subscribe(BusinessEventType.INVENTORY_ADJUSTED, async (event: BusinessEvent) => {
  const movement = event.payload;
  const updates: Record<string, any> = {};
  
  const movRef = push(ref(database, 'inventory_movements'));
  updates[`inventory_movements/${movRef.key}`] = {
    ...movement,
    id: movRef.key,
    timestamp: new Date().toISOString()
  };

  return updates;
});


eventBus.subscribe(BusinessEventType.ORDER_DELIVERED, async (event: BusinessEvent) => {
  const { order } = event.payload;
  const updates: Record<string, any> = {};

  // Deduct stock for the order
  updates[`sales_orders/${order.id}/isStockDeducted`] = true;

  // 1. Fetch products
  const productsSnap = await get(ref(database, 'sales_products'));
  const products: any[] = [];
  if (productsSnap.exists()) {
    productsSnap.forEach(p => { products.push(p.val()); });
  }

  // 2. Fetch warehouse stock lots and movements
  const lotsSnap = await get(ref(database, 'stock_lots'));
  const lotsMap: Record<string, any> = {};
  if (lotsSnap.exists()) {
    lotsSnap.forEach(c => { lotsMap[c.key as string] = c.val(); });
  }

  const movSnap = await get(ref(database, 'inventory_movements'));
  const stockMap: Record<string, number> = {};
  if (movSnap.exists()) {
    movSnap.forEach(c => {
      const m = c.val();
      const key = `${m.roomId}_${m.stockLotId}`;
      stockMap[key] = (stockMap[key] || 0) + Number(m.quantity);
    });
  }

  // 3. FIFO Deduction
  for (const item of order.items) {
    const product = products.find(p => p.id === item.productId);
    let qtyToDeduct = Number(item.qty);

    if (product) {
      const matchingKeys = Object.keys(stockMap).filter(key => {
        if (stockMap[key] <= 0) return false;
        const lotId = key.split('_')[1];
        const lot = lotsMap[lotId];
        if (!lot) return false;
        return lot.categoryId === product.category || lot.categoryId === product.name;
      });

      matchingKeys.sort((a, b) => {
        const lotA = lotsMap[a.split('_')[1]];
        const lotB = lotsMap[b.split('_')[1]];
        const timeA = lotA?.createdAt ? new Date(lotA.createdAt).getTime() : 0;
        const timeB = lotB?.createdAt ? new Date(lotB.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      for (const key of matchingKeys) {
        if (qtyToDeduct <= 0) break;
        const available = stockMap[key];
        const deductAmount = Math.min(available, qtyToDeduct);
        
        const [roomId, lotId] = key.split('_');
        
        const newMovRef = push(ref(database, 'inventory_movements'));
        updates[`inventory_movements/${newMovRef.key}`] = {
          id: newMovRef.key,
          roomId: roomId,
          stockLotId: lotId,
          quantity: -deductAmount,
          type: 'DISPATCH',
          referenceId: order.id,
          notes: `Sales Order ${order.id} Delivered`,
          createdBy: event.userId,
          timestamp: new Date().toISOString()
        };

        stockMap[key] -= deductAmount;
        qtyToDeduct -= deductAmount;
      }
    }
  }

  return updates;
});
