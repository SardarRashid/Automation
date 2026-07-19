import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("LogOut, FileText, Database, Settings", "LogOut, FileText, Database, Settings, LayoutDashboard")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added LayoutDashboard to App.tsx")
