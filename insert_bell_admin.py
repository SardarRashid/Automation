import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AdminPanel.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { auth, database } from '../lib/firebase';", "import { auth, database } from '../lib/firebase';\nimport { NotificationBell } from '../components/NotificationBell';")

# Find the header right side
# Currently it looks like:
# <div className="flex items-center gap-4">
#   <span className="text-sm font-medium text-slate-600 hidden sm:block">
header_right = '''            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 hidden sm:block">'''
              
header_right_replacement = '''            <div className="flex items-center gap-4">
              {currentUser?.uid && <NotificationBell userId={currentUser.uid} />}
              <span className="text-sm font-medium text-slate-600 hidden sm:block">'''

content = content.replace(header_right, header_right_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
