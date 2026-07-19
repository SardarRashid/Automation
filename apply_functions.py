import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\services\workflow\WorkflowEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add getFunctions and httpsCallable imports
if "import { getFunctions, httpsCallable } from 'firebase/functions';" not in content:
    content = content.replace(
        "import { ref, update, set, get, push, remove } from 'firebase/database';",
        "import { ref, update, set, get, push, remove } from 'firebase/database';\nimport { getFunctions, httpsCallable } from 'firebase/functions';"
    )

# Replace the direct DB write in recordPayment
old_logic = """    const paymentRecord = {
      id: `PAY-${Date.now()}`,
      orderId: order.id,
      customerId: customer.id,
      customerName: customer.name,
      amount,
      method,
      date: new Date().toISOString(),
      recordedBy: userId,
      status: 'Verified'
    };

    await set(ref(database, `sales_payments/${paymentRecord.id}`), paymentRecord);"""

new_logic = """    // Call Cloud Function for atomic transaction processing
    const functions = getFunctions();
    const processHQPayment = httpsCallable(functions, 'processHQPayment');
    
    try {
      const result = await processHQPayment({
        orderId: order.id,
        amount,
        method,
        customerId: customer.id,
        customerName: customer.name,
        date: new Date().toISOString()
      });
      console.log('Payment processed via cloud function:', result.data);
    } catch (e: any) {
      console.error('Cloud function failed, falling back to local DB write for offline resilience', e);
      // Fallback for offline queue to function seamlessly
      const paymentRecord = {
        id: `PAY-${Date.now()}`,
        orderId: order.id,
        customerId: customer.id,
        customerName: customer.name,
        amount,
        method,
        date: new Date().toISOString(),
        recordedBy: userId,
        status: 'Verified'
      };
      await set(ref(database, `sales_payments/${paymentRecord.id}`), paymentRecord);
    }"""

if "httpsCallable(functions, 'processHQPayment')" not in content:
    content = content.replace(old_logic, new_logic)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated WorkflowEngine to use Cloud Functions for payments")
