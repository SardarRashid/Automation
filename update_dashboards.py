import re
import os

folder = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\dashboards"

for file in os.listdir(folder):
    if file.endswith(".tsx"):
        path = os.path.join(folder, file)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Mass replace for Dark Mode support
        replacements = {
            "bg-slate-50": "bg-slate-50 dark:bg-slate-900",
            "bg-white": "bg-white dark:bg-slate-800",
            "border-slate-200": "border-slate-200 dark:border-slate-700",
            "text-slate-800": "text-slate-800 dark:text-slate-100",
            "text-slate-700": "text-slate-700 dark:text-slate-200",
            "text-slate-600": "text-slate-600 dark:text-slate-300",
            "text-slate-500": "text-slate-500 dark:text-slate-400",
            "divide-slate-200": "divide-slate-200 dark:divide-slate-700",
            "bg-slate-100": "bg-slate-100 dark:bg-slate-700/50"
        }

        for old, new in replacements.items():
            content = content.replace(old, new)
            
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {file}")
