import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\components\Header.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { Menu, User, Bell, Search, ScanLine, X } from 'lucide-react';", "import { Menu, User, Bell, Search, ScanLine, X } from 'lucide-react';\nimport { NotificationBell } from '../../components/NotificationBell';")
content = content.replace("import { Menu, User, Search, ScanLine, X } from 'lucide-react';", "import { Menu, User, Search, ScanLine, X } from 'lucide-react';\nimport { NotificationBell } from '../../components/NotificationBell';")

# Find the header right side
# Currently it might have:
# <div className="flex items-center space-x-3">
header_right = '''      <div className="flex items-center space-x-3">'''
              
header_right_replacement = '''      <div className="flex items-center space-x-3">
        {currentUser?.id && <NotificationBell userId={currentUser.id} />}'''

content = content.replace(header_right, header_right_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
