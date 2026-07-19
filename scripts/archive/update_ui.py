import os

# 1. Update RequestForms.tsx
req_file = "frontend/src/pages/RequestForms.tsx"
with open(req_file, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('print:pt-[100px]', 'print:pt-[200px]')
content = content.replace('print:h-[120px]', 'print:h-[200px]')

with open(req_file, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Update DailySheetView.tsx fonts
ds_file = "frontend/src/inventory/components/DailySheetView.tsx"
with open(ds_file, "r", encoding="utf-8") as f:
    content = f.read()

# Make columns headers larger
content = content.replace('text-[10px]', 'text-xs')
# Make tiny labels larger
content = content.replace('text-[9px]', 'text-[11px]')
content = content.replace('text-[8.5px]', 'text-[10px]')
content = content.replace('text-[8px]', 'text-[10px]')
# Make specific table contents larger
content = content.replace('text-xs border-collapse', 'text-sm border-collapse')
content = content.replace('w-14', 'w-16') # inputs a bit wider
content = content.replace('text-[11px] w-24', 'text-xs w-28')

with open(ds_file, "w", encoding="utf-8") as f:
    f.write(content)

print("UI enhancements applied")
