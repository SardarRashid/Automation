import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\services\firebaseService.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ledgerService import
content = content.replace("import { ledgerService } from '../../../services/ledgerService';", 
                          "import { eventBus } from '../../../services/core/EventBus';\nimport { BusinessEventType } from '../../../services/core/EventTypes';")

# Replace appendLedgerEntry calls
content = re.sub(
    r"await ledgerService\.issueCreditNote\([\s\S]*?\);",
    r"// EventBus handles credit note on ORDER_CANCELLED now",
    content
)

content = re.sub(
    r"await ledgerService\.appendLedgerEntry\(\s*c\.id,\s*'INITIAL_BALANCE'[\s\S]*?\);",
    r"// Legacy initial balance migration removed for EventBus",
    content
)

content = re.sub(
    r"await ledgerService\.appendLedgerEntry\([\s\S]*?'INVOICE'[\s\S]*?\);",
    r"// EventBus handles invoice on ORDER_CREATED",
    content
)

content = re.sub(
    r"await ledgerService\.appendLedgerEntry\([\s\S]*?'PAYMENT'[\s\S]*?\);",
    r"// EventBus handles payment on PAYMENT_VERIFIED",
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
