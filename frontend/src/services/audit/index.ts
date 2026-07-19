import { database } from '../../lib/firebase';
import { ref, push, get, query, limitToLast, orderByChild } from 'firebase/database';
import { eventBus } from '../core/EventBus';
import { BusinessEventType } from '../core/EventTypes';
import type { BusinessEvent } from '../core/EventTypes';
import type { AuditLog } from './types';

export const auditService = {
  /**
   * Helper to format an audit log entry
   */
  createAuditLogUpdate(
    userId: string,
    payload: Omit<AuditLog, 'id' | 'timestamp' | 'userId'>
  ): Record<string, any> {
    const newRef = push(ref(database, 'audit_logs'));
    const logEntry: AuditLog = {
      ...payload,
      id: newRef.key as string,
      userId,
      timestamp: new Date().toISOString()
    };
    
    return {
      [`audit_logs/${newRef.key}`]: logEntry
    };
  },

  /**
   * Fetch recent audit logs for the viewer
   */
  async getRecentLogs(limit: number = 500): Promise<AuditLog[]> {
    // Note: To use orderByChild('timestamp'), Firebase rules should index it.
    // Assuming simple retrieval for now, limiting to last N entries.
    const logsQuery = query(ref(database, 'audit_logs'), limitToLast(limit));
    const snap = await get(logsQuery);
    
    if (!snap.exists()) return [];
    
    const logs: AuditLog[] = [];
    snap.forEach(child => {
      logs.push(child.val());
    });
    
    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// ==========================================
// EVENT LISTENERS FOR AUDITING
// ==========================================

// 1. Sales & Ledger
eventBus.subscribe(BusinessEventType.ORDER_CREATED, async (event: BusinessEvent) => {
  const order = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'sales',
    action: BusinessEventType.ORDER_CREATED,
    newValue: `Order #${order.id} for $${order.totalAmount}`,
    device: 'mobile',
    status: 'success'
  });
});

eventBus.subscribe(BusinessEventType.PAYMENT_APPROVED, async (event: BusinessEvent) => {
  const { paymentId, amount, customerId } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'ledger',
    action: BusinessEventType.PAYMENT_APPROVED,
    newValue: `Payment #${paymentId} for $${amount} (Customer: ${customerId})`,
    device: 'web',
    status: 'success'
  });
});

eventBus.subscribe(BusinessEventType.PRICE_UPDATED, async (event: BusinessEvent) => {
  const { item, newPrice, oldPrice } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'catalog',
    action: BusinessEventType.PRICE_UPDATED,
    previousValue: `$${oldPrice}`,
    newValue: `$${newPrice}`,
    device: 'web',
    status: 'success'
  });
});

// 2. Inventory
eventBus.subscribe(BusinessEventType.SHIPMENT_RECEIVED, async (event: BusinessEvent) => {
  const { shipment } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'inventory',
    action: BusinessEventType.SHIPMENT_RECEIVED,
    newValue: `Received ${shipment.items?.length || 0} items from ${shipment.originName}`,
    device: 'mobile',
    status: 'success'
  });
});

eventBus.subscribe(BusinessEventType.STOCK_TRANSFERRED, async (event: BusinessEvent) => {
  const { transfer } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'inventory',
    action: BusinessEventType.STOCK_TRANSFERRED,
    newValue: `Transferred from ${transfer.sourceRoomId} to ${transfer.destinationRoomId}`,
    device: 'mobile',
    status: 'success'
  });
});

eventBus.subscribe(BusinessEventType.COUNT_APPROVED, async (event: BusinessEvent) => {
  const { date, roomName } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'inventory',
    action: BusinessEventType.COUNT_APPROVED,
    newValue: `Approved count for ${roomName} on ${date}`,
    device: 'web',
    status: 'success'
  });
});

eventBus.subscribe(BusinessEventType.ROOM_ASSIGNED, async (event: BusinessEvent) => {
  const { storekeeperId, roomName } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'inventory',
    action: BusinessEventType.ROOM_ASSIGNED,
    newValue: `Assigned room ${roomName} to user ${storekeeperId}`,
    device: 'web',
    status: 'success'
  });
});

// 3. Admin & Security
eventBus.subscribe(BusinessEventType.USER_UPDATED, async (event: BusinessEvent) => {
  const { userKey, updatedUserData } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'admin',
    action: 'ROLE_CHANGED',
    newValue: `Updated roles/permissions for ${userKey} to ${updatedUserData.role}`,
    device: 'web',
    status: 'success'
  });
});

eventBus.subscribe(BusinessEventType.USER_LOGIN, async (event: BusinessEvent) => {
  const { email, ip, device } = event.payload;
  return auditService.createAuditLogUpdate(event.userId, {
    module: 'auth',
    action: BusinessEventType.USER_LOGIN,
    newValue: `Login from ${ip}`,
    device: device || 'unknown',
    status: 'success'
  });
});


eventBus.subscribe(BusinessEventType.ORDER_APPROVED as any, async (event) => {
  return await auditService.logEvent('ORDER_APPROVED', event.userId, `Order ${event.payload.order?.id} was approved.`);
});

eventBus.subscribe(BusinessEventType.ORDER_DISPATCHED as any, async (event) => {
  return await auditService.logEvent('ORDER_DISPATCHED', event.userId, `Order ${event.payload.order?.id} was dispatched.`);
});

eventBus.subscribe(BusinessEventType.ORDER_DELIVERED as any, async (event) => {
  return await auditService.logEvent('ORDER_DELIVERED', event.userId, `Order ${event.payload.order?.id} was delivered.`);
});

eventBus.subscribe(BusinessEventType.PURCHASE_APPROVED as any, async (event) => {
  return await auditService.logEvent('PURCHASE_APPROVED', event.userId, `Purchase ${event.payload.po?.id} was approved.`);
});
