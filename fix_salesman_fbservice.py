import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\services\firebaseService.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove updateOrderStatus, deductStock, processPayment
# They start from: async updateOrderStatus(orderId: string, status: string) { ...
# Ends with the end of processPayment ... }

pattern = re.compile(r'async updateOrderStatus.*?async processPayment.*?\}\,?\n', re.DOTALL | re.MULTILINE)
new_content = pattern.sub('', content)

if len(new_content) < len(content):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Removed duplicated logic from firebaseService.ts")
else:
    print("Pattern not found or already removed")
