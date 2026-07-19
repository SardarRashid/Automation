import re
with open('frontend/src/pages/salesman-admin/services/firebaseService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_deduct = '''  async deductStock(order: Order, products: Product[]) {
    const updates: Record<string, any> = {};
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updates[\products/\/stock\] = Math.max(0, Number(product.stock) - Number(item.qty));
      }
    }
    updates[\sales_orders/\/isStockDeducted\] = true;
    await update(ref(database, '/'), updates);
  },'''

new_deduct = '''  async deductStock(order: Order, products: Product[]) {
    const updates: Record<string, any> = {};
    updates[\sales_orders/\/isStockDeducted\] = true;
    await update(ref(database, '/'), updates);

    // 1. Fetch warehouse stock lots and movements
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
        const key = \\_\\;
        stockMap[key] = (stockMap[key] || 0) + Number(m.quantity);
      });
    }

    // 2. FIFO Deduction
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
          
          const movRef = push(ref(database, 'inventory_movements'));
          await set(movRef, {
            id: movRef.key as string,
            timestamp: new Date().toISOString(),
            roomId,
            stockLotId: lotId,
            quantity: -deductAmount,
            type: 'SALE',
            referenceId: order.id,
            notes: \Dispatched for Sales Order #\\,
            createdBy: 'System (Sales Auto-Dispatch)'
          });

          qtyToDeduct -= deductAmount;
          stockMap[key] -= deductAmount;
        }

        // Fallback for missing physical stock
        if (qtyToDeduct > 0) {
          const movRef = push(ref(database, 'inventory_movements'));
          await set(movRef, {
            id: movRef.key as string,
            timestamp: new Date().toISOString(),
            roomId: 'virtual-sales-bay',
            stockLotId: \legacy-\\,
            quantity: -qtyToDeduct,
            type: 'SALE',
            referenceId: order.id,
            notes: \Dispatched missing physical stock for Sales Order #\\,
            createdBy: 'System (Sales Auto-Dispatch)'
          });
        }
      }
    }
  },'''

if old_deduct in content:
    content = content.replace(old_deduct, new_deduct)
    with open('frontend/src/pages/salesman-admin/services/firebaseService.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Old deduct not found!")
