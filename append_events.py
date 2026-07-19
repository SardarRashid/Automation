import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\core\EventTypes.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_events = '''
  // Notifications / Sales
  ORDER_APPROVED = 'ORDER_APPROVED',
  ORDER_REJECTED = 'ORDER_REJECTED',
  PAYMENT_APPROVED = 'PAYMENT_APPROVED',
  PRICE_UPDATED = 'PRICE_UPDATED',
  
  // Notifications / Inventory
  ROOM_ASSIGNED = 'ROOM_ASSIGNED',
  SHIPMENT_ASSIGNED = 'SHIPMENT_ASSIGNED',
  COUNT_SUBMITTED = 'COUNT_SUBMITTED',
  COUNT_APPROVED = 'COUNT_APPROVED',
  COUNT_REJECTED = 'COUNT_REJECTED',
  LOW_STOCK = 'LOW_STOCK',
  
  // Notifications / Admin
  FAILED_SYNC = 'FAILED_SYNC',
  SECURITY_WARNING = 'SECURITY_WARNING',
  USER_LOGIN = 'USER_LOGIN',
}
'''
content = content.replace("}", new_events)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
