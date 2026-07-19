import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\workflow\WorkflowEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

in_func = False
for i, line in enumerate(lines):
    if "async recordPayment(" in line:
        start_line = i
        in_func = True
        
    if in_func and i > start_line:
        if "}" in line and line.startswith("  }"):
            end_line = i
            print("".join(lines[start_line:end_line+1]))
            break
