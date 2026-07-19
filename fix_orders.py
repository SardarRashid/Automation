import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components\Orders.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { workflowEngine }' not in content:
    content = content.replace("import { fbService } from '../services/firebaseService';", "import { fbService } from '../services/firebaseService';\nimport { workflowEngine } from '../../../services/workflow/WorkflowEngine';\nimport { auth } from '../../../lib/firebase';")

# Update handleUpdateOrderStatus
content = re.sub(r'await fbService\.updateOrderStatus\(orderId,\s*status\);', r"await workflowEngine.transitionOrder(orderId, status as any, auth.currentUser?.uid || 'system');", content)

# Update handleConfirmDelivery
content = re.sub(r'await fbService\.deductStock\(deliverConfirmOrder,\s*products\);\s*await fbService\.updateOrderStatus\(deliverConfirmOrder\.id,\s*\'Delivered\'\);', r"await workflowEngine.transitionOrder(deliverConfirmOrder.id, 'Delivered', auth.currentUser?.uid || 'system');", content)

# Update handleProcessPayment
content = re.sub(r'await fbService\.processPayment\(paymentModalOrder,\s*Number\(paymentModalAmount\),\s*paymentModalMethod,\s*customers\);', r"await workflowEngine.recordPayment(paymentModalOrder, Number(paymentModalAmount), paymentModalMethod, auth.currentUser?.uid || 'system', customers);", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Orders.tsx to use workflowEngine")
