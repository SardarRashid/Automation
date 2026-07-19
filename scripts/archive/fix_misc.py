import os

# 1. Fix RequestForms.tsx top margin
req_file = "frontend/src/pages/RequestForms.tsx"
with open(req_file, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('print:p-0 print:m-0 print:pt-32', 'print:p-0 print:m-0 print:pt-[100px]')
# Add a hidden div spacer just in case tailwind overrides pt-[100px]
if '<div className="hidden print:block print:h-32"></div>' not in content:
    content = content.replace(
        '<div className="flex justify-between items-start mb-6">',
        '<div className="hidden print:block print:h-[120px]"></div>\n            <div className="flex justify-between items-start mb-6">'
    )

with open(req_file, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Fix SalesmanAdmin.tsx full width
sa_file = "frontend/src/pages/SalesmanAdmin.tsx"
with open(sa_file, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('max-w-7xl mx-auto px-4 py-4', 'w-full px-4 py-4')
content = content.replace('max-w-7xl mx-auto px-4', 'w-full px-4')
content = content.replace('max-w-7xl w-full mx-auto p-4 md:p-6', 'w-full h-full p-4 md:p-6')

with open(sa_file, "w", encoding="utf-8") as f:
    f.write(content)


# 3. Fix InventoryApp.tsx full width & Suite Toggle
ia_file = "frontend/src/inventory/InventoryApp.tsx"
with open(ia_file, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('max-w-7xl mx-auto px-4 sm:px-6', 'w-full px-4 sm:px-6')
content = content.replace('max-w-7xl mx-auto p-4 sm:p-6', 'w-full h-full p-4 sm:p-6')
content = content.replace('showSuiteToggle={inventorySession.role !== \'storekeeper\'}', 'showSuiteToggle={true}')

with open(ia_file, "w", encoding="utf-8") as f:
    f.write(content)


# 4. Fix AppHub.tsx Link
ah_file = "frontend/src/pages/AppHub.tsx"
with open(ah_file, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("downloadUrl: '/?app=inventory_mobile'", "downloadUrl: 'https://automation-suit-inventory.web.app'")

with open(ah_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Files updated successfully!")
