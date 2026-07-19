import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\audit\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

listeners = '''
eventBus.subscribe(BusinessEventType.ORDER_APPROVED as any, async (event) => {
  return await auditService.logEvent('ORDER_APPROVED', event.userId, Order  was approved.);
});

eventBus.subscribe(BusinessEventType.ORDER_DISPATCHED as any, async (event) => {
  return await auditService.logEvent('ORDER_DISPATCHED', event.userId, Order  was dispatched.);
});

eventBus.subscribe(BusinessEventType.ORDER_DELIVERED as any, async (event) => {
  return await auditService.logEvent('ORDER_DELIVERED', event.userId, Order  was delivered.);
});

eventBus.subscribe(BusinessEventType.PURCHASE_APPROVED as any, async (event) => {
  return await auditService.logEvent('PURCHASE_APPROVED', event.userId, Purchase  was approved.);
});
'''

if 'BusinessEventType.ORDER_APPROVED' not in content:
    content += "\n" + listeners
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added audit listeners")
else:
    print("Audit listeners already exist")
