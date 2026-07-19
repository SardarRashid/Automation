import os

files_to_fix = [
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\hooks\useSalesMobileState.ts',
    r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\SalesmanAdminContext.tsx'
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace("from '../services/ledgerService'", "from '../services/ledger'")
        content = content.replace("from '../../services/ledgerService'", "from '../../services/ledger'")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
