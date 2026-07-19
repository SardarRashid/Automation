import { eventBus } from '../core/EventBus';
import { BusinessEventType } from '../core/EventTypes';
import { database } from '../../lib/firebase';
import { ref, get, update, set } from 'firebase/database';
import { offlineSyncEngine } from '../OfflineSyncEngine';

export class WorkflowEngine {
  
  /**
   * Transitions an Order through its lifecycle.
   * Pending -> Approved -> Dispatched -> Delivered -> Cancelled
   */
  async transitionOrder(orderId: string, newStatus: 'Approved' | 'Dispatched' | 'Delivered' | 'Cancelled', userId: string) {
    const orderSnap = await get(ref(database, `sales_orders/${orderId}`));
    if (!orderSnap.exists()) {
      throw new Error(`Order ${orderId} not found.`);
    }
    
    const order = orderSnap.val();
    const currentStatus = order.status;

    if (currentStatus === 'Cancelled') throw new Error("Cannot transition a cancelled order.");
    if (currentStatus === 'Delivered' && newStatus !== 'Cancelled') throw new Error("Order is already delivered.");

    await set(ref(database, `sales_orders/${orderId}/status`), newStatus);
    
    switch (newStatus) {
      case 'Approved':
        await eventBus.dispatch(BusinessEventType.ORDER_APPROVED, { order }, userId);
        break;
      case 'Dispatched':
        await eventBus.dispatch(BusinessEventType.ORDER_DISPATCHED, { order }, userId);
        break;
      case 'Delivered':
        await eventBus.dispatch(BusinessEventType.ORDER_DELIVERED, { order }, userId);
        break;
      case 'Cancelled':
        await eventBus.dispatch(BusinessEventType.ORDER_CANCELLED, { order }, userId);
        break;
    }
  }

  async transitionPurchase(purchaseId: string, newStatus: 'Approved' | 'Received' | 'Cancelled', userId: string) {
    const poSnap = await get(ref(database, `purchase_orders/${purchaseId}`));
    if (!poSnap.exists()) {
      throw new Error(`Purchase Order ${purchaseId} not found.`);
    }

    const po = poSnap.val();
    await set(ref(database, `purchase_orders/${purchaseId}/status`), newStatus);

    switch (newStatus) {
      case 'Approved':
        await eventBus.dispatch(BusinessEventType.PURCHASE_APPROVED, { po }, userId);
        break;
    }
  }

  async recordPayment(order: any, amount: number, method: string, userId: string, customers: any[], isFromSync = false) {
    const customer = customers.find((c: any) => c.id === order.customerId);
    if (!customer) throw new Error("Customer not found for payment.");
    
    if (!navigator.onLine && !isFromSync) {
      await offlineSyncEngine.queueAction('recordPayment', { order, amount, method, userId, customers });
      return;
    }

    const paymentRecord = {
      id: `PAY-${Date.now()}`,
      orderId: order.id,
      customerId: customer.id,
      customerName: customer.name,
      amount,
      method,
      date: new Date().toISOString(),
      recordedBy: userId,
      status: 'Verified'
    };

    await eventBus.dispatch(BusinessEventType.PAYMENT_VERIFIED, paymentRecord, userId);
    
    const currentPaid = (order.amountPaid || 0) + amount;
    const paymentStatus = currentPaid >= order.total ? 'Paid' : 'Partial';
    
    await update(ref(database, `sales_orders/${order.id}`), {
      amountPaid: currentPaid,
      paymentStatus: paymentStatus
    });
  }
}

export const workflowEngine = new WorkflowEngine();


// Register offline sync handler
offlineSyncEngine.registerHandler(async (action: string, payload: any) => {
  switch (action) {
    case 'recordPayment':
      await workflowEngine.recordPayment(payload.order, payload.amount, payload.method, payload.userId, payload.customers, true);
      break;
    case 'transitionOrder':
      await workflowEngine.transitionOrder(payload.orderId, payload.status, payload.userId, true);
      break;
  }
});
