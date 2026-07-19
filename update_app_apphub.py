import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("<AppHub />", "<AppHub onNavigate={setActiveTab} />")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.tsx")
