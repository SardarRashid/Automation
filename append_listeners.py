import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_listeners = '''
// Salesman Notifications
eventBus.subscribe(BusinessEventType.ORDER_APPROVED, async (event: BusinessEvent) => {
  const { salesmanId, orderId } = event.payload;
  return notificationService.createNotificationUpdate(salesmanId, {
    type: 'ORDER_APPROVED',
    title: 'Order Approved',
    message: Your order # has been approved.,
    priority: 'normal',
    relatedModule: 'sales'
  });
});

eventBus.subscribe(BusinessEventType.ORDER_REJECTED, async (event: BusinessEvent) => {
  const { salesmanId, orderId, reason } = event.payload;
  return notificationService.createNotificationUpdate(salesmanId, {
    type: 'ORDER_REJECTED',
    title: 'Order Rejected',
    message: Your order # was rejected: ,
    priority: 'high',
    relatedModule: 'sales'
  });
});

eventBus.subscribe(BusinessEventType.PAYMENT_APPROVED, async (event: BusinessEvent) => {
  const { salesmanId, paymentId } = event.payload;
  return notificationService.createNotificationUpdate(salesmanId, {
    type: 'PAYMENT_APPROVED',
    title: 'Payment Received',
    message: Payment # has been fully verified and approved.,
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
      message: The price for  is now {newPrice}.,
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
    message: You have been assigned to manage room: .,
    priority: 'high',
    relatedModule: 'inventory'
  });
});

eventBus.subscribe(BusinessEventType.SHIPMENT_ASSIGNED, async (event: BusinessEvent) => {
  const { storekeeperId, shipmentId, originName } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'SHIPMENT_ASSIGNED',
    title: 'Shipment Assigned',
    message: You have been assigned to receive shipment # from .,
    priority: 'normal',
    relatedModule: 'inventory'
  });
});

eventBus.subscribe(BusinessEventType.COUNT_APPROVED, async (event: BusinessEvent) => {
  const { storekeeperId, date } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'COUNT_APPROVED',
    title: 'Daily Count Approved',
    message: Your daily count for  was approved.,
    priority: 'normal',
    relatedModule: 'inventory'
  });
});

eventBus.subscribe(BusinessEventType.COUNT_REJECTED, async (event: BusinessEvent) => {
  const { storekeeperId, date, reason } = event.payload;
  return notificationService.createNotificationUpdate(storekeeperId, {
    type: 'COUNT_REJECTED',
    title: 'Daily Count Rejected',
    message: Your daily count for  was rejected: ,
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
      message: ${storekeeperName} submitted the daily count for .,
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
      message: ${item} has dropped to  (Below threshold: ).,
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
      message: ${appName} encountered a critical sync failure: .,
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
      message: Suspicious action detected: . Details: .,
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
      message: ${email} logged in from IP .,
      priority: 'low',
      relatedModule: 'system'
    }) };
  }
  return updates;
});
'''

content += "\n" + new_listeners

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
