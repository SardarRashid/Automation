import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\workflow\WorkflowEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "offlineSyncEngine" not in content:
    content = content.replace(
        "import { BusinessEventType } from './EventBus';",
        "import { BusinessEventType } from './EventBus';\nimport { offlineSyncEngine } from '../OfflineSyncEngine';"
    )
    
    # We need to register the handler at the bottom of the file
    registration_code = """

// Register offline sync handler
offlineSyncEngine.registerHandler(async (action: string, payload: any) => {
  switch (action) {
    case 'recordPayment':
      await workflowEngine.recordPayment(payload.order, payload.amount, payload.method, payload.userId, payload.customers, true);
      break;
    case 'transitionOrder':
      await workflowEngine.transitionOrder(payload.orderId, payload.status, payload.userId, true);
      break;
  }
});
"""
    content += registration_code
    
    # Update transitionOrder to support offline mode
    content = content.replace(
        "async transitionOrder(orderId: string, status: 'Draft' | 'Pending' | 'Approved' | 'Delivered' | 'Cancelled', userId: string) {",
        "async transitionOrder(orderId: string, status: 'Draft' | 'Pending' | 'Approved' | 'Delivered' | 'Cancelled', userId: string, isFromSync = false) {"
    )
    content = content.replace(
        """    await update(ref(database, `sales_orders/${orderId}`), {
      status,
      updatedAt: new Date().toISOString()
    });""",
        """    if (!navigator.onLine && !isFromSync) {
      await offlineSyncEngine.queueAction('transitionOrder', { orderId, status, userId });
      return;
    }
    await update(ref(database, `sales_orders/${orderId}`), {
      status,
      updatedAt: new Date().toISOString()
    });"""
    )
    
    # Update recordPayment to support offline mode
    content = content.replace(
        "async recordPayment(order: any, amount: number, method: string, userId: string, customers: any[]) {",
        "async recordPayment(order: any, amount: number, method: string, userId: string, customers: any[], isFromSync = false) {"
    )
    content = content.replace(
        """    const customer = customers.find((c: any) => c.id === order.customerId);
    if (!customer) throw new Error("Customer not found for payment.");""",
        """    const customer = customers.find((c: any) => c.id === order.customerId);
    if (!customer) throw new Error("Customer not found for payment.");
    
    if (!navigator.onLine && !isFromSync) {
      await offlineSyncEngine.queueAction('recordPayment', { order, amount, method, userId, customers });
      return;
    }"""
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated WorkflowEngine with offline sync")
