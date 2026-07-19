import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\workflow\WorkflowEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("`sales_orders/`", "`sales_orders/${orderId}`")
content = content.replace("`Order  not found.`", "`Order ${orderId} not found.`")
content = content.replace("`sales_orders//status`", "`sales_orders/${orderId}/status`")

content = content.replace("`purchase_orders/`", "`purchase_orders/${purchaseId}`")
content = content.replace("`Purchase Order  not found.`", "`Purchase Order ${purchaseId} not found.`")
content = content.replace("`purchase_orders//status`", "`purchase_orders/${purchaseId}/status`")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed WorkflowEngine string interpolations.")
