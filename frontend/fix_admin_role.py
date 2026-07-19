import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\App.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the permission override check
content = content.replace(
    "if (data.role === 'it_admin') {",
    "if (data.role === 'it_admin' || data.role === 'admin') {"
)

# 2. Update the Access Restricted check
content = content.replace(
    "{(appAccess === false && Object.keys(permissions).length === 0) && userRole !== 'it_admin' ? (",
    "{(appAccess === false && Object.keys(permissions).length === 0) && (userRole !== 'it_admin' && userRole !== 'admin') ? ("
)

# 3. Update the sidebar button rendering
content = content.replace(
    "{userRole === 'it_admin' && (\n              <button\n                onClick={() => setActiveTab('admin')}",
    "{(userRole === 'it_admin' || userRole === 'admin') && (\n              <button\n                onClick={() => setActiveTab('admin')}"
)

# 4. Update the component rendering
content = content.replace(
    "{activeTab === 'admin' && userRole === 'it_admin' && <AdminPanel />}",
    "{activeTab === 'admin' && (userRole === 'it_admin' || userRole === 'admin') && <AdminPanel />}"
)

# Also fix the hasAppAccess logic just in case
content = content.replace(
    "const hasAppAccess = data.allowedApps?.app === true || data.role === 'app' || data.role === 'it_admin';",
    "const hasAppAccess = data.allowedApps?.app === true || data.role === 'app' || data.role === 'it_admin' || data.role === 'admin';"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx successfully.")
