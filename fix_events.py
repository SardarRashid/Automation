import os

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\core\EventTypes.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing events
events_to_add = '''
  // Workflow Engine Events
  PURCHASE_CREATED = 'PURCHASE_CREATED',
  PURCHASE_APPROVED = 'PURCHASE_APPROVED',
  ORDER_DISPATCHED = 'ORDER_DISPATCHED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  STOCK_RESERVED = 'STOCK_RESERVED',
  STOCK_DEDUCTED = 'STOCK_DEDUCTED',
'''

if 'ORDER_DELIVERED' not in content:
    content = content.replace("ORDER_CANCELLED = 'ORDER_CANCELLED',", "ORDER_CANCELLED = 'ORDER_CANCELLED',\n" + events_to_add)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added events to EventTypes.ts")
else:
    print("Events already exist")
