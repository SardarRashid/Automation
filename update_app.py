import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "CentralReportsHub" not in content:
    content = content.replace("import AppHub from './pages/AppHub';", "import AppHub from './pages/AppHub';\nimport CentralReportsHub from './pages/CentralReportsHub';\nimport { SalesmanAdminProvider } from './pages/salesman-admin/SalesmanAdminContext';")
    
    route = """
                {activeTab === 'central_reports' && permissions.salesman_admin && (
                  <SalesmanAdminProvider>
                    <CentralReportsHub />
                  </SalesmanAdminProvider>
                )}
"""
    content = re.sub(r'(<SalesmanAdmin />\s*\)\})', rf'\1{route}', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added central_reports to App.tsx")
else:
    print("Already in App.tsx")
