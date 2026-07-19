import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { salesService } from '../services/sales';", "import { salesService } from '../services/sales';\nimport { NotificationBell } from '../components/NotificationBell';")

# Find the header right side
# Currently it looks like:
# <div className="flex items-center gap-3">
#   <span className="text-sm font-medium text-slate-200">
#     {currentUser?.email?.split('@')[0]}
header_right = '''          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-200">'''
              
header_right_replacement = '''          <div className="flex items-center gap-3">
            {currentUser?.uid && <NotificationBell userId={currentUser.uid} />}
            <span className="text-sm font-medium text-slate-200">'''

content = content.replace(header_right, header_right_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
