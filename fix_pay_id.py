import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\workflow\WorkflowEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("id: `PAY-`,", "id: `PAY-${Date.now()}`,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed PAY id")
