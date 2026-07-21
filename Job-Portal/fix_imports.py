import os
import re

components_dir = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\components'

for root, dirs, files in os.walk(components_dir):
    for f in files:
        if not f.endswith('.tsx'): continue
        filepath = os.path.join(root, f)
        
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
            
        original_content = content
        
        # Replace multiple adjacent imports of API
        # E.g., 
        # import { API } from '../lib/apiClient';
        # import { API } from '../lib/apiClient';
        # Becomes just one.
        pattern = r"(import \{ API \} from '\.\./lib/apiClient';\s*){2,}"
        content = re.sub(pattern, "import { API } from '../lib/apiClient';\n", content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Fixed {f}")
