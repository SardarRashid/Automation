import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AdminPanel.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r"\{activeView === 'dashboard' && \(\s*(.*?)\s*\)\}", content, re.DOTALL)
if match:
    print(match.group(1)[:500])
else:
    print("Not found")
