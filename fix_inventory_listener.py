import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

listener_code = '''
eventBus.subscribe(BusinessEventType.ORDER_DELIVERED, async (event: BusinessEvent) => {
  const { order } = event.payload;
  const updates: Record<string, any> = {};

  // Deduct stock for the order
  updates[sales_orders//isStockDeducted] = true;

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
      const key = ${m.roomId}_;
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
        updates[inventory_movements/] = {
          id: newMovRef.key,
          roomId: roomId,
          stockLotId: lotId,
          quantity: -deductAmount,
          type: 'DISPATCH',
          referenceId: order.id,
          notes: Sales Order  Delivered,
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
'''

if 'BusinessEventType.ORDER_DELIVERED' not in content:
    content += "\n" + listener_code
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added ORDER_DELIVERED listener to inventory/index.ts")
else:
    print("Already exists")
