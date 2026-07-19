import os
import re

files_to_fix = [
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\core\EventBus.ts',
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\audit\index.ts',
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\ledger\index.ts',
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\sales\index.ts',
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts',
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\inventory\index.ts'
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace import { BusinessEventType, BusinessEvent } from 
    # with import { BusinessEventType } from ... \n import type { BusinessEvent } from ...
    
    # Pattern to find imports containing BusinessEvent
    # Sometimes it's import { BusinessEvent } 
    # Sometimes it's import { BusinessEventType, BusinessEvent }
    
    content = re.sub(r'import\s+\{\s*BusinessEvent\s*\}\s+from\s+([^;]+);', r'import type { BusinessEvent } from \1;', content)
    
    content = re.sub(r'import\s+\{\s*BusinessEventType\s*,\s*BusinessEvent\s*\}\s+from\s+([^;]+);', 
                     r'import { BusinessEventType } from \1;\nimport type { BusinessEvent } from \1;', content)

    content = re.sub(r'import\s+\{\s*BusinessEvent\s*,\s*BusinessEventType\s*\}\s+from\s+([^;]+);', 
                     r'import { BusinessEventType } from \1;\nimport type { BusinessEvent } from \1;', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed type imports")
