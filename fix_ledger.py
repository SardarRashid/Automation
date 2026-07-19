import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\ledger\index.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ORDER_CREATED with ORDER_DELIVERED for the invoice entry
content = content.replace("BusinessEventType.ORDER_CREATED", "BusinessEventType.ORDER_DELIVERED")

# Remove PAYMENT_PENDING listener and replace with PAYMENT_VERIFIED
if "BusinessEventType.PAYMENT_PENDING" in content:
    content = content.replace("BusinessEventType.PAYMENT_PENDING", "BusinessEventType.PAYMENT_VERIFIED")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ledger service listeners")
