import glob
import re

filepath = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\components\PerformanceAnalytics.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("profile?.preferredSalary", "(profile as any)?.preferredSalary")
content = content.replace("profile.preferredSalary", "(profile as any).preferredSalary")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed PerformanceAnalytics.tsx")
