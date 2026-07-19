import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\InventoryApp.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "import { AIAssistant }" not in content:
    content = content.replace("import { auth } from '../lib/firebase';", "import { auth } from '../lib/firebase';\nimport { AIAssistant } from '../components/ui/AIAssistant';")

    content = re.sub(r'(</div>\s*)$', r'  <AIAssistant context="inventory" />\n\1', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added AIAssistant to InventoryApp.tsx")
else:
    print("Already added to InventoryApp.tsx")
