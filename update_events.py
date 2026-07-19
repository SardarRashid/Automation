import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\core\EventTypes.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("USER_ROLE_UPDATED = 'USER_ROLE_UPDATED',", "USER_UPDATED = 'USER_UPDATED',")
content = content.replace("PERMISSION_CHANGED = 'PERMISSION_CHANGED'", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
