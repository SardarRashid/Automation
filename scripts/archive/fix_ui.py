import os

app_path = 'frontend/src/App.tsx'
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make Salesman Admin and Inventory App full page
content = content.replace(
    "`${activeTab === 'admin' ? 'p-0' : 'p-4 sm:p-8'}`",
    "`${['admin', 'salesman_admin', 'inventory_app'].includes(activeTab) ? 'p-0' : 'p-4 sm:p-8'}`"
)
content = content.replace(
    "`${activeTab === 'admin' ? 'w-full h-full' : 'max-w-6xl mx-auto'}`",
    "`${['admin', 'salesman_admin', 'inventory_app'].includes(activeTab) ? 'w-full h-full' : 'max-w-6xl mx-auto'}`"
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)

admin_path = 'frontend/src/pages/AdminPanel.tsx'
with open(admin_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

# Make admin sidebar a top nav on mobile
admin_content = admin_content.replace(
    '<div className="flex h-[calc(100vh-4rem)] w-full bg-slate-50 font-sans overflow-x-auto">',
    '<div className="flex h-[calc(100vh-4rem)] w-full bg-slate-50 font-sans overflow-x-auto flex-col md:flex-row">'
)
admin_content = admin_content.replace(
    '<div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col flex-shrink-0">',
    '<div className="w-full md:w-64 bg-[#0f172a] text-slate-300 flex flex-row md:flex-col flex-shrink-0 overflow-x-auto md:overflow-x-visible overflow-y-hidden md:overflow-y-auto min-h-[64px] md:min-h-0">'
)
admin_content = admin_content.replace(
    '<nav className="flex-1 overflow-y-auto py-4">',
    '<nav className="flex-1 md:overflow-y-auto py-0 md:py-4 flex flex-row md:flex-col">'
)

with open(admin_path, 'w', encoding='utf-8') as f:
    f.write(admin_content)

print("App.tsx and AdminPanel.tsx updated.")
