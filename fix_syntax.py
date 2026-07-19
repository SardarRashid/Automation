import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\audit\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'Order  was approved\.', '`Order ${event.payload.order?.id} was approved.`', content)
content = re.sub(r'Order  was dispatched\.', '`Order ${event.payload.order?.id} was dispatched.`', content)
content = re.sub(r'Order  was delivered\.', '`Order ${event.payload.order?.id} was delivered.`', content)
content = re.sub(r'Purchase  was approved\.', '`Purchase ${event.payload.po?.id} was approved.`', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\notifications\index.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'Order  has been approved\.', '`Order ${event.payload.order?.id} has been approved.`', content)
content = re.sub(r'Order  has been delivered\.', '`Order ${event.payload.order?.id} has been delivered.`', content)
content = re.sub(r'Purchase  has been approved\.', '`Purchase ${event.payload.po?.id} has been approved.`', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors")
