import { database } from '../../lib/firebase';
import { ref, push, update, get } from 'firebase/database';
import { eventBus } from '../core/EventBus';
import { BusinessEventType } from '../core/EventTypes';
import type { BusinessEvent } from '../core/EventTypes';
import type { AppNotification, NotificationPriority } from './types';

export const notificationService = {
  /**
   * Helper to generate a notification object and get a new key for a specific user
   */
  createNotificationUpdate(
    userId: string,
    payload: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): Record<string, any> {
    const newRef = push(ref(database, `user_notifications/${userId}`));
    const notification: AppNotification = {
      ...payload,
      id: newRef.key as string,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    return {
      [`user_notifications/${userId}/${newRef.key}`]: notification
    };
  },

  /**
   * Helper to fetch all users with a specific role from the database.
   * This allows mass fan-out of notifications to all admins or supervisors.
   */
  async getUsersWithRole(roleOrPermission: string): Promise<string[]> {
    const snap = await get(ref(database, 'users'));
    if (!snap.exists()) return [];
    
    const userIds: string[] = [];
    snap.forEach(child => {
      const user = child.val();
      // Check if they have the direct role or a specific permission
      if (
        user.role === roleOrPermission || 
        user.role === 'admin' ||
        (user.permissions && user.permissions[roleOrPermission])
      ) {
        userIds.push(child.key as string);
      }
    });
    return userIds;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await update(ref(database, `user_notifications/${userId}/${notificationId}`), {
      read: true
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const snap = await get(ref(database, `user_notifications/${userId}`));
    if (!snap.exists()) return;
    
    const updates: Record<string, any> = {};
    snap.forEach(child => {
      if (!child.val().read) {
        updates[`${child.key}/read`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database, `user_notifications/${userId}`), updates);
    }
  }
};

// ==========================================
// EVENT LISTENERS FOR NOTIFICATIONS
// ==========================================

eventBus.subscribe(BusinessEventType.ORDER_CREATED, async (event: BusinessEvent) => {
  const order = event.payload;
  // Notify Admins about a new order pending verification
  const adminIds = await notificationService.getUsersWithRole('admin');
  
  let updates = {};
  for (const adminId of adminIds) {
    updates = {
      ...updates,
      ...notificationService.createNotificationUpdate(adminId, {
        type: 'ORDER_CREATED',
        title: 'New Sales Order',
        message: `Order #${order.id.substring(order.id.length-6)} created by ${order.salespersonName}`,
        priority: 'normal',
        relatedModule: 'sales'
      })
    };
  }
  return updates;
});

eventBus.subscribe(BusinessEventType.SHIPMENT_RECEIVED, async (event: BusinessEvent) => {
  const { shipment } = event.payload;
  // Notify Admins/Supervisors about a shipment receipt
  const adminIds = await notificationService.getUsersWithRole('inventory_admin');
  
  let updates = {};
  for (const adminId of adminIds) {
    updates = {
      ...updates,
      ...notificationService.createNotificationUpdate(adminId, {
        type: 'SHIPMENT_RECEIVED',
        title: 'Shipment Received',
        message: `Shipment from ${shipment.originName} has been received by ${event.userId}`,
        priority: 'normal',
        relatedModule: 'inventory'
      })
    };
  }
  return updates;
});

eventBus.subscribe(BusinessEventType.USER_UPDATED, async (event: BusinessEvent) => {
  const { userKey, updatedUserData } = event.payload;
  
  // Notify the user that their permissions changed
  return notificationService.createNotificationUpdate(userKey, {
    type: 'PERMISSION_CHANGED',
    title: 'Account Updated',
    message: `Your account roles or permissions have been updated by an Administrator.`,
    priority: 'high',
    relatedModule: 'admin'
  });
});

eventBus.subscribe(BusinessEventType.INVENTORY_ADJUSTED, async (event: BusinessEvent) => {
  const movement = event.payload;
  if (movement.quantity < 0) {
    // Notify Inventory Admins of negative adjustments (Damage/Spoilage/Manual Reduction)
    const adminIds = await notificationService.getUsersWithRole('inventory_admin');
    
    let updates = {};
    for (const adminId of adminIds) {
      updates = {
        ...updates,
        ...notificationService.createNotificationUpdate(adminId, {
          type: 'DAMAGE_REPORT',
          title: 'Negative Stock Adjustment',
          message: `Stock lot ${movement.stockLotId} was reduced by ${Math.abs(movement.quantity)}. Reason: ${movement.notes}`,
          priority: 'high',
          relatedModule: 'inventory'
        })
      };
    }
    return updates;
  }
});


// Salesman Notifications
eventBus.subscribe(BusinessEventType.ORDER_APPROVED, async (event: BusinessEvent) => {
  const { salesmanId, orderId } = event.payload;
  return notificationService.createNotificationUpdate(salesmanId, {
    type: 'ORDER_APPROVED',
    title: 'Order Approved',
    message: `Your order #${orderId} has been approved.`,
    priority: 'normal',
    relatedModule: 'sales'
  });
});

eventBus.subscribe(BusinessEventType.ORDER_REJECTED, async (event: BusinessEvent) => {
  const { salesmanId, orderId, reason } = event.payload;
  return notificationService.createNotificationUpdate(salesmanId, {
    type: 'ORDER_REJECTED',
    title: 'Order Rejected',
    message: `Your order #${orderId} was rejected: ${reason}`,
    priority: 'high',
    relatedModule: 'sales'
  });
});

eventBus.subscribe(BusinessEventType.PAYMENT_APPROVED, async (event: BusinessEvent) => {
  const { salesmanId, paymentId } = event.payload;
  return notificationService.createNotificationUpdate(salesmanId, {
    type: 'PAYMENT_APPROVED',
    title: 'Payment Received',
    message: `Payment #${paymentId} has been fully verified and approved.`,
    priority: 'normal',
    relatedModule: 'ledger'
  });
});

eventBus.subscribe(BusinessEventType.PRICE_UPDATED, async (event: BusinessEvent) => {
  const { item, newPrice } = event.payload;
  const salesmenIds = await notificationService.getUsersWithRole('salesman');
  let updates = {};
  for (const sid of salesmenIds) {
    updates = { ...updates, ...notificationService.createNotificationUpdate(sid, {
      type: 'PRICE_UPDATED',
      title: 'Price Update',
      message: `The price for ${item} is now ${newPrice}.`,
      priority: 'low',
      relatedModule: 'catalog'
    }) };
  }
  return updates;
});

// Storekeeper Notifications
eventBus.subscribe(BusinessEventType.ROOM_ASSIGNED, async (event: BusinessEvent) => {
  const { storekeeperId, roomName } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'ROOM_ASSIGNED',
    title: 'New Room Assignment',
    message: `You have been assigned to manage room: ${roomName}.`,
    priority: 'high',
    relatedModule: 'inventory'
  });
});

eventBus.subscribe(BusinessEventType.SHIPMENT_ASSIGNED, async (event: BusinessEvent) => {
  const { storekeeperId, shipmentId, originName } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'SHIPMENT_ASSIGNED',
    title: 'Shipment Assigned',
    message: `You have been assigned to receive shipment #${shipmentId} from ${originName}.`,
    priority: 'normal',
    relatedModule: 'inventory'
  });
});

eventBus.subscribe(BusinessEventType.COUNT_APPROVED, async (event: BusinessEvent) => {
  const { storekeeperId, date } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'COUNT_APPROVED',
    title: 'Daily Count Approved',
    message: `Your daily count for ${date} was approved.`,
    priority: 'normal',
    relatedModule: 'inventory'
  });
});

eventBus.subscribe(BusinessEventType.COUNT_REJECTED, async (event: BusinessEvent) => {
  const { storekeeperId, date, reason } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'COUNT_REJECTED',
    title: 'Daily Count Rejected',
    message: `Your daily count for ${date} was rejected: ${reason}`,
    priority: 'high',
    relatedModule: 'inventory'
  });
});

// Supervisor Notifications
eventBus.subscribe(BusinessEventType.COUNT_SUBMITTED, async (event: BusinessEvent) => {
  const { storekeeperName, roomName } = event.payload;
  const superIds = await notificationService.getUsersWithRole('inventory_admin');
  let updates = {};
  for (const sid of superIds) {
    updates = { ...updates, ...notificationService.createNotificationUpdate(sid, {
      type: 'COUNT_SUBMITTED',
      title: 'Daily Count Submitted',
      message: `${storekeeperName} submitted the daily count for ${roomName}.`,
      priority: 'normal',
      relatedModule: 'inventory'
    }) };
  }
  return updates;
});

eventBus.subscribe(BusinessEventType.LOW_STOCK, async (event: BusinessEvent) => {
  const { item, currentLevel, threshold } = event.payload;
  const superIds = await notificationService.getUsersWithRole('inventory_admin');
  let updates = {};
  for (const sid of superIds) {
    updates = { ...updates, ...notificationService.createNotificationUpdate(sid, {
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${item} has dropped to ${currentLevel} (Below threshold: ${threshold}).`,
      priority: 'urgent',
      relatedModule: 'inventory'
    }) };
  }
  return updates;
});

// Admin Notifications
eventBus.subscribe(BusinessEventType.FAILED_SYNC, async (event: BusinessEvent) => {
  const { appName, errorMsg } = event.payload;
  const adminIds = await notificationService.getUsersWithRole('admin');
  let updates = {};
  for (const sid of adminIds) {
    updates = { ...updates, ...notificationService.createNotificationUpdate(sid, {
      type: 'FAILED_SYNC',
      title: 'Offline Sync Failure',
      message: `${appName} encountered a critical sync failure: ${errorMsg}.`,
      priority: 'urgent',
      relatedModule: 'system'
    }) };
  }
  return updates;
});

eventBus.subscribe(BusinessEventType.SECURITY_WARNING, async (event: BusinessEvent) => {
  const { action, details } = event.payload;
  const adminIds = await notificationService.getUsersWithRole('admin');
  let updates = {};
  for (const sid of adminIds) {
    updates = { ...updates, ...notificationService.createNotificationUpdate(sid, {
      type: 'SECURITY_WARNING',
      title: 'Security Alert',
      message: `Suspicious action detected: ${action}. Details: ${details}.`,
      priority: 'urgent',
      relatedModule: 'system'
    }) };
  }
  return updates;
});

eventBus.subscribe(BusinessEventType.USER_LOGIN, async (event: BusinessEvent) => {
  const { email, ip } = event.payload;
  const adminIds = await notificationService.getUsersWithRole('admin');
  let updates = {};
  for (const sid of adminIds) {
    updates = { ...updates, ...notificationService.createNotificationUpdate(sid, {
      type: 'USER_LOGIN',
      title: 'User Login',
      message: `${email} logged in from IP ${ip}.`,
      priority: 'low',
      relatedModule: 'system'
    }) };
  }
  return updates;
});
