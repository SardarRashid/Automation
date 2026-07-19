import re

filepath = "frontend/src/pages/SalesmanMobileApp_V2.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 2: Add code to the Returns map
content = content.replace("sku: originalItem.productId.substring(0,6),", "sku: originalItem.code || originalItem.productId.substring(0,6),\n        code: originalItem.code,")

# Fix 3: In cart view, Order Confirmation view, Order details view
content = content.replace(
    "<h3 className=\"font-bold text-slate-800 text-sm leading-tight pr-4\">{item.productName}</h3>",
    "<h3 className=\"font-bold text-slate-800 text-sm leading-tight pr-4\">[{item.code || item.productId.substring(0,8)}] {item.productName}</h3>"
)

# In Product listing
content = content.replace(
    "<h3 className=\"font-bold text-slate-800 text-sm leading-tight pr-4\">{p.name}</h3>",
    "<h3 className=\"font-bold text-slate-800 text-sm leading-tight pr-4\">[{p.code || ''}] {p.name}</h3>"
)

content = content.replace(
    "{p.sku || 'NO SKU'}",
    "{p.code || 'NO SKU'}"
)

# Also cart items list view (where it shows item.product.name)
content = content.replace(
    "<h3 className=\"font-bold text-slate-800 text-sm leading-tight pr-4\">{item.product.name}</h3>",
    "<h3 className=\"font-bold text-slate-800 text-sm leading-tight pr-4\">[{item.product.code || ''}] {item.product.name}</h3>"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Mobile app fixed")
