import os

files_to_fix = {
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\NotificationBell.tsx': [
        ("@/lib/firebase", "../lib/firebase"),
        ("@/services/notifications", "../services/notifications"),
        ("@/services/notifications/types", "../services/notifications/types")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\core\EventBus.ts': [
        ("@/lib/firebase", "../../lib/firebase")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts': [
        ("@/lib/firebase", "../../lib/firebase"),
        ("@/services/core", "../core")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\ledger\index.ts': [
        ("@/lib/firebase", "../../lib/firebase"),
        ("@/services/core", "../core")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts': [
        ("@/lib/firebase", "../../lib/firebase"),
        ("@/services/core", "../core")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\permissions\index.ts': [
        ("@/lib/firebase", "../../lib/firebase")
    ],
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\sales\index.ts': [
        ("@/lib/firebase", "../../lib/firebase"),
        ("@/services/core", "../core")
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
