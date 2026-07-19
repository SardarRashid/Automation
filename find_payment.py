import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components\Orders.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "handleProcessPayment" in line:
        start_line = max(0, i - 2)
        end_line = min(len(lines), i + 20)
        print("--- Match around line {} ---".format(i))
        print("".join(lines[start_line:end_line]))
        break
