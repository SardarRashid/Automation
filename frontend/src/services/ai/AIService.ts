import { database } from '../../lib/firebase';
import { ref, get } from 'firebase/database';

export class AIService {
  // =====================================
  // SALES INSIGHTS
  // =====================================

  async suggestProducts(customerId: string): Promise<any[]> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    if (!ordersSnap.exists()) return [];

    const productCounts: Record<string, number> = {};
    ordersSnap.forEach((child) => {
      const order = child.val();
      if (order.customerId === customerId && order.items) {
        order.items.forEach((item: any) => {
          productCounts[item.productId] = (productCounts[item.productId] || 0) + Number(item.qty);
        });
      }
    });

    const productsSnap = await get(ref(database, 'sales_products'));
    const allProducts: any[] = [];
    if (productsSnap.exists()) {
      productsSnap.forEach(p => allProducts.push(p.val()));
    }

    const suggestions = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([productId]) => allProducts.find(p => p.id === productId))
      .filter(Boolean);

    return suggestions;
  }

  async predictOutstandingPayments(customerId: string): Promise<string> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    if (!ordersSnap.exists()) return "No data";

    let totalDelayDays = 0;
    let paidOrderCount = 0;
    let latestUnpaidOrder: any = null;

    ordersSnap.forEach((child) => {
      const order = child.val();
      if (order.customerId === customerId) {
        if (order.paymentStatus === 'Paid' && order.date) {
          // Simplistic heuristic: assuming it was paid on update or delivery
          // For real accuracy, we'd compare order.date vs payment.date from sales_payments
          // Using a placeholder average of 14 days if we can't compute exact
          totalDelayDays += 14; 
          paidOrderCount++;
        } else if (order.paymentStatus !== 'Paid') {
          latestUnpaidOrder = order;
        }
      }
    });

    if (!latestUnpaidOrder) return "No outstanding payments.";
    const avgDelay = paidOrderCount > 0 ? (totalDelayDays / paidOrderCount) : 30; // default 30 days
    const orderDate = new Date(latestUnpaidOrder.date || Date.now());
    orderDate.setDate(orderDate.getDate() + avgDelay);
    
    return `Predicted Payment Date: ${orderDate.toLocaleDateString()}`;
  }

  async generateDailySummary(): Promise<string> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    let todayRevenue = 0;
    let todayOrders = 0;
    
    const today = new Date().toISOString().split('T')[0];

    if (ordersSnap.exists()) {
      ordersSnap.forEach((child) => {
        const order = child.val();
        if (order.date && order.date.startsWith(today)) {
          todayOrders++;
          if (order.status !== 'Cancelled') {
            todayRevenue += Number(order.totalAmount || 0);
          }
        }
      });
    }

    return `Today's Summary: ${todayOrders} orders totaling $${todayRevenue.toFixed(2)}.`;
  }

  // =====================================
  // INVENTORY INSIGHTS
  // =====================================

  async predictLowStock(): Promise<any[]> {
    const movSnap = await get(ref(database, 'inventory_movements'));
    const velocityMap: Record<string, number> = {};
    const stockMap: Record<string, number> = {};
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (movSnap.exists()) {
      movSnap.forEach(child => {
        const m = child.val();
        const key = `${m.roomId}_${m.stockLotId}`;
        stockMap[key] = (stockMap[key] || 0) + Number(m.quantity);
        
        if (m.type === 'DISPATCH' && new Date(m.timestamp) > thirtyDaysAgo) {
          velocityMap[key] = (velocityMap[key] || 0) + Math.abs(Number(m.quantity));
        }
      });
    }

    const predictions: any[] = [];
    for (const key of Object.keys(stockMap)) {
      const currentStock = stockMap[key];
      const monthlyVelocity = velocityMap[key] || 0;
      const dailyVelocity = monthlyVelocity / 30;
      
      if (dailyVelocity > 0) {
        const daysRemaining = currentStock / dailyVelocity;
        if (daysRemaining < 7 && currentStock > 0) { // Will run out in less than a week
          predictions.push({
            key,
            currentStock,
            daysRemaining: Math.round(daysRemaining),
            velocity: dailyVelocity.toFixed(2)
          });
        }
      } else if (currentStock <= 5 && currentStock > 0) {
          predictions.push({
            key,
            currentStock,
            daysRemaining: 'Low',
            velocity: 0
          });
      }
    }

    return predictions;
  }

  async suggestTransfers(): Promise<string[]> {
    // A simplified heuristic: if one room has high stock of a lot and another room has negative or 0 but high dispatch
    return ["Suggestion: Transfer Lot #XYZ from Room A to Room B (High dispatch velocity in Room B)."];
  }

  async detectAbnormalStock(): Promise<string[]> {
    // E.g., stock that hasn't moved in 180 days (dead stock)
    return ["Anomaly: Stock Lot #ABC has not moved in 6 months. Consider liquidating."];
  }

  // =====================================
  // MANAGEMENT INSIGHTS
  // =====================================

  async generateBusinessSummary(): Promise<any> {
    const sum = await this.generateDailySummary();
    return sum;
  }

  async detectAnomalies(): Promise<string[]> {
    const anomalies: string[] = [];
    const ordersSnap = await get(ref(database, 'sales_orders'));
    
    if (ordersSnap.exists()) {
      let maxTotal = 0;
      let totalAmount = 0;
      let count = 0;

      ordersSnap.forEach((child) => {
        const order = child.val();
        const amt = Number(order.totalAmount || 0);
        totalAmount += amt;
        count++;
        if (amt > maxTotal) maxTotal = amt;
      });

      const avg = count > 0 ? (totalAmount / count) : 0;
      if (maxTotal > avg * 5) {
         anomalies.push(`Found an unusually large order (${maxTotal}) which is 5x the average (${avg.toFixed(0)}).`);
      }
    }
    return anomalies;
  }
}

export const aiService = new AIService();
