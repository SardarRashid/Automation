import os

files_to_fix = {
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\dashboards\AdminDashboard.tsx': [
        ("@/lib/firebase", "../../lib/firebase"),
        ("@/services/audit", "../../services/audit")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\dashboards\SalesSupervisorDashboard.tsx': [
        ("@/lib/firebase", "../../lib/firebase")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\dashboards\InventorySupervisorDashboard.tsx': [
        ("@/lib/firebase", "../../lib/firebase")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\audit\index.ts': [
        ("@/lib/firebase", "../../lib/firebase")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\AuditLogViewer.tsx': [
        ("@/services/audit", "../services/audit"),
        ("@/services/audit/types", "../services/audit/types")
    ]
}

for path, replacements in files_to_fix.items():
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
