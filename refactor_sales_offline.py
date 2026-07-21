import re

# Fix WorkflowEngine.ts
wf_path = "frontend/src/services/workflow/WorkflowEngine.ts"
with open(wf_path, "r", encoding="utf-8") as f:
    wf_content = f.read()

old_wf_register = """offlineSyncEngine.registerHandler(async (action: string, payload: any) => {
  switch (action) {
    case 'recordPayment':
      await workflowEngine.recordPayment(payload.order, payload.amount, payload.method, payload.userId, payload.customers, true);
      break;
    case 'transitionOrder':
      await workflowEngine.transitionOrder(payload.orderId, payload.status, payload.userId, true);
      break;
  }
});"""

new_wf_register = """offlineSyncEngine.registerHandler('recordPayment', async (payload: any) => {
  await workflowEngine.recordPayment(payload.order, payload.amount, payload.method, payload.userId, payload.customers, true);
});

offlineSyncEngine.registerHandler('transitionOrder', async (payload: any) => {
  await workflowEngine.transitionOrder(payload.orderId, payload.status, payload.userId, true);
});"""

wf_content = wf_content.replace(old_wf_register, new_wf_register)
with open(wf_path, "w", encoding="utf-8") as f:
    f.write(wf_content)

# Fix sales/index.ts
sales_path = "frontend/src/services/sales/index.ts"
with open(sales_path, "r", encoding="utf-8") as f:
    sales_content = f.read()

sales_content = sales_content.replace(
    "import { offlineSyncService, type SyncTransaction } from '../offlineSyncService';",
    "import { offlineSyncEngine } from '../OfflineSyncEngine';"
)

old_init = """  initOfflineSync() {
    offlineSyncService.init(async (tx: SyncTransaction) => {
      if (tx.payload.type === 'ORDER') {
        await this.executeSubmitOrder(tx.payload.data);
      } else if (tx.payload.type === 'PAYMENT') {
        await this.executeSubmitPayment(tx.payload.data);
      }
    });
  },"""

new_init = """  initOfflineSync() {
    offlineSyncEngine.registerHandler('sales_submitOrder', async (payload: any) => {
      await this.executeSubmitOrder(payload);
    });
    offlineSyncEngine.registerHandler('sales_submitPayment', async (payload: any) => {
      await this.executeSubmitPayment(payload);
    });
  },"""
sales_content = sales_content.replace(old_init, new_init)

old_enqueue_payment = """    offlineSyncService.enqueueTransaction({
      type: 'PAYMENT',
      data: payload
    });"""
new_enqueue_payment = "    offlineSyncEngine.queueAction('sales_submitPayment', payload);"
sales_content = sales_content.replace(old_enqueue_payment, new_enqueue_payment)

old_enqueue_order = """    offlineSyncService.enqueueTransaction({
      type: 'ORDER',
      data: payload
    });"""
new_enqueue_order = "    offlineSyncEngine.queueAction('sales_submitOrder', payload);"
sales_content = sales_content.replace(old_enqueue_order, new_enqueue_order)

with open(sales_path, "w", encoding="utf-8") as f:
    f.write(sales_content)

print("Offline sync dependencies refactored.")
