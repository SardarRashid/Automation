import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix syntax error
content = content.replace("message: Your order # has been approved.,", "message: Your order # has been approved.,")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed notifications syntax error")
