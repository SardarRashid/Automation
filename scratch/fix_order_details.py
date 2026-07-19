import re

filepath = "frontend/src/components/ui/OrderDetailsModal.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("item.productId.substring(0,8)", "item.code || item.productId.substring(0,8)")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("OrderDetailsModal fixed")
