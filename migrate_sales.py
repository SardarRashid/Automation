import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\salesService.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ledgerService import and firebase imports
content = content.replace("import { database } from '../lib/firebase';\nimport { ref, push, set } from 'firebase/database';", 
                          "import { database } from '@/lib/firebase';\nimport { ref, push } from 'firebase/database';\nimport { eventBus } from './core/EventBus';\nimport { BusinessEventType } from './core/EventTypes';")

content = content.replace("import { ledgerService } from './ledgerService';", "")

# Refactor executeSubmitOrder
execute_order = '''  async executeSubmitOrder(data: any): Promise<void> {
    const { customer, cart, upfrontPayment, paymentMethod, salesmanId, salesmanEmail, orderTotal } = data;
    
    const newOrderRef = push(ref(database, 'sales_orders'));
    const orderId = newOrderRef.key as string;

    const orderRecord = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.name,
      salespersonId: salesmanId,
      salespersonName: salesmanEmail,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items: cart.map((item: any) => ({
        productId: item.product.id,
        productName: item.product.name,
        qty: item.qty,
        price: item.product.price
      })),
      totalAmount: orderTotal,
      status: 'Pending',
      paymentStatus: upfrontPayment > 0 ? 'Pending Verification' : 'Unpaid',
      amountPaid: 0,
      pendingAmountPaid: upfrontPayment,
      paymentMethod: paymentMethod,
      isPaymentPendingApproval: upfrontPayment > 0,
      isStockDeducted: false
    };

    await eventBus.dispatch(BusinessEventType.ORDER_CREATED, orderRecord, salesmanId);
  }'''

content = re.sub(r"async executeSubmitOrder\(data: any\): Promise<void> \{[\s\S]*?(?=\n  \}\n)", execute_order, content)

# Remove the trailing } which was matched or left over? Actually regex is tricky. Let's just write the whole file properly.
