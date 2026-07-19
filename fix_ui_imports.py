import re

def insert_import(file_path, import_stmt):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "import { AIAssistant }" not in content:
        # Insert after the first import statement
        content = re.sub(r'^(import .*?;)', rf'\1\n{import_stmt}', content, count=1, flags=re.MULTILINE)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added import to {file_path}")
    else:
        print(f"Import already present in {file_path}")

insert_import(r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx', "import { AIAssistant } from './components/ui/AIAssistant';")
insert_import(r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\InventoryApp.tsx', "import { AIAssistant } from '../components/ui/AIAssistant';")
insert_import(r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx', "import { AIAssistant } from '../components/ui/AIAssistant';")
