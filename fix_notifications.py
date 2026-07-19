import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

listeners = '''
eventBus.subscribe(BusinessEventType.ORDER_APPROVED as any, async (event) => {
  return await notificationService.createNotification({
    type: 'ORDER_APPROVED',
    title: 'Order Approved',
    message: Order  has been approved.,
    priority: 'normal',
    relatedModule: 'sales'
  }, event.userId);
});

eventBus.subscribe(BusinessEventType.ORDER_DELIVERED as any, async (event) => {
  return await notificationService.createNotification({
    type: 'ORDER_DELIVERED',
    title: 'Order Delivered',
    message: Order  has been delivered.,
    priority: 'high',
    relatedModule: 'sales'
  }, event.userId);
});

eventBus.subscribe(BusinessEventType.PURCHASE_APPROVED as any, async (event) => {
  return await notificationService.createNotification({
    type: 'PURCHASE_APPROVED',
    title: 'Purchase Approved',
    message: Purchase  has been approved.,
    priority: 'normal',
    relatedModule: 'inventory'
  }, event.userId);
});
'''

if 'BusinessEventType.ORDER_APPROVED' not in content:
    content += "\n" + listeners
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added notification listeners")
else:
    print("Notification listeners already exist")
