import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("updates[sales_orders//isStockDeducted] = true;", "updates[`sales_orders/${order.id}/isStockDeducted`] = true;")
content = content.replace("updates[inventory_movements//] = {", "updates[`inventory_movements/${newMovRef.key}`] = {")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed interpolation errors")
