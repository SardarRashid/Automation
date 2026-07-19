import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add routing for salesman_mobile
if "activeTab === 'salesman_mobile'" not in content:
    route = """
                {activeTab === 'salesman_mobile' && permissions.salesman_admin && (
                  <SalesmanMobileApp onBack={() => setActiveTab('app_hub')} />
                )}
"""
    content = re.sub(r'(<SalesmanAdmin />\s*\)\})', rf'\1{route}', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added salesman_mobile routing to App.tsx")
else:
    print("App.tsx already has salesman_mobile route.")
