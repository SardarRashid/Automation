import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

transfer_methods = '''
  // ==========================================
  // TRANSFERS
  // ==========================================
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
        throw new Error(Insufficient stock for lot . Available: , Requested: );
      }
    }

    await eventBus.dispatch(BusinessEventType.STOCK_TRANSFERRED, { transfer, items }, userId);
  },
'''

content = content.replace("  // ==========================================\n  // MOVEMENTS & STOCK", transfer_methods + "\n  // ==========================================\n  // MOVEMENTS & STOCK")

transfer_listener = '''
eventBus.subscribe(BusinessEventType.STOCK_TRANSFERRED, async (event: BusinessEvent) => {
  const { transfer, items } = event.payload;
  const updates: Record<string, any> = {};
  
  updates[	ransfers//status] = 'Completed';
  updates[	ransfers//completedDate] = new Date().toISOString();

  for (const item of items) {
    const movOutRef = push(ref(database, 'inventory_movements'));
    updates[inventory_movements/] = {
      id: movOutRef.key,
      roomId: transfer.sourceRoomId,
      stockLotId: item.stockLotId,
      quantity: -item.quantity,
      type: 'TRANSFER_OUT',
      referenceId: transfer.id,
      notes: Transfer out to ,
      createdBy: event.userId,
      timestamp: new Date().toISOString()
    };
    
    const movInRef = push(ref(database, 'inventory_movements'));
    updates[inventory_movements/] = {
      id: movInRef.key,
      roomId: transfer.destinationRoomId,
      stockLotId: item.stockLotId,
      quantity: item.quantity,
      type: 'TRANSFER_IN',
      referenceId: transfer.id,
      notes: Transfer in from ,
      createdBy: event.userId,
      timestamp: new Date().toISOString()
    };
  }

  return updates;
});
'''

content += "\n" + transfer_listener

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
