import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

services_imports = '''
import './services/workflow/WorkflowEngine';
import './services/inventory';
import './services/ledger';
import './services/sales';
import './services/audit';
import './services/notifications';
'''

if "import './services/workflow/WorkflowEngine';" not in content:
    content = content.replace("import { auth", services_imports + "\nimport { auth")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added service imports to App.tsx")
else:
    print("Already imported")
