import os

# Update SalesmanMobileApp.tsx
path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "import { ledgerService }" not in content:
    content = content.replace("import type { Customer, Order", "import { ledgerService } from '../services/ledgerService';\nimport type { Customer, Order")

# Replace payment ledger push
payment_push_orig = """    // Push a ledger entry so the salesman sees the updated balance instantly
    const ledgerEntryRef = push(ref(database, `customer_ledgers/${selectedCustomer.id}`));
    const entry: CustomerLedgerEntry = {
      id: ledgerEntryRef.key!,
      customerId: selectedCustomer.id,
      date: new Date().toISOString(),
      type: 'PAYMENT',
      amount: -amount,
      description: `Field payment collection via ${paymentMethod}`
    };
    await set(ledgerEntryRef, entry);"""

payment_push_new = """    // Push a ledger entry so the salesman sees the updated balance instantly
    await ledgerService.appendLedgerEntry(selectedCustomer.id, 'PAYMENT', -amount, `Field payment collection via ${paymentMethod}`);"""

content = content.replace(payment_push_orig, payment_push_new)

# Replace order ledger push
order_push_orig = """    // 3. Append to customer's transactional ledger
    const invoiceLedgerRef = push(ref(database, `customer_ledgers/${orderCustomer.id}`));
    await set(invoiceLedgerRef, {
      id: invoiceLedgerRef.key!,
      customerId: orderCustomer.id,
      date: new Date().toISOString(),
      type: 'INVOICE',
      amount: orderTotal,
      description: `Invoice for Order #${orderId.substring(orderId.length-6)}`,
      referenceId: orderId
    } as CustomerLedgerEntry);

    if (upf > 0) {
      const paymentLedgerRef = push(ref(database, `customer_ledgers/${orderCustomer.id}`));
      await set(paymentLedgerRef, {
        id: paymentLedgerRef.key!,
        customerId: orderCustomer.id,
        date: new Date().toISOString(),
        type: 'PAYMENT',
        amount: -upf,
        description: `Upfront payment for Order #${orderId.substring(orderId.length-6)}`,
        referenceId: orderId
      } as CustomerLedgerEntry);
    }"""

order_push_new = """    // 3. Append to customer's transactional ledger
    await ledgerService.appendLedgerEntry(
      orderCustomer.id,
      'INVOICE',
      orderTotal,
      `Invoice for Order #${orderId.substring(orderId.length-6)}`,
      orderId
    );

    if (upf > 0) {
      await ledgerService.appendLedgerEntry(
        orderCustomer.id,
        'PAYMENT',
        -upf,
        `Upfront payment for Order #${orderId.substring(orderId.length-6)}`,
        orderId
      );
    }"""

content = content.replace(order_push_orig, order_push_new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)


# Update firebaseService.ts
path2 = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\services\firebaseService.ts"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

if "import { ledgerService }" not in content2:
    content2 = content2.replace("import { User, Product,", "import { ledgerService } from '../../../services/ledgerService';\nimport { User, Product,")

add_customer_orig = """    if (balance && balance !== 0) {
      const ledgerEntryRef = push(ref(database, `customer_ledgers/${c.id}`));
      const entry: CustomerLedgerEntry = {
        id: ledgerEntryRef.key!,
        customerId: c.id,
        date: new Date().toISOString(),
        type: 'INITIAL_BALANCE',
        amount: balance,
        description: 'Opening Balance'
      };
      await set(ledgerEntryRef, entry);
    }"""
add_customer_new = """    if (balance && balance !== 0) {
      await ledgerService.appendLedgerEntry(c.id, 'INITIAL_BALANCE', balance, 'Opening Balance');
    }"""
content2 = content2.replace(add_customer_orig, add_customer_new)

process_payment_orig = """    if (order.customerId) {
      // Append ledger entry for payment
      const ledgerEntryRef = push(ref(database, `customer_ledgers/${order.customerId}`));
      const entry: CustomerLedgerEntry = {
        id: ledgerEntryRef.key!,
        customerId: order.customerId,
        date: new Date().toISOString(),
        type: 'PAYMENT',
        amount: -amount,
        description: `HQ Payment for Order ${order.id}`,
        referenceId: order.id
      };
      await set(ledgerEntryRef, entry);
    }"""
process_payment_new = """    if (order.customerId) {
      // Append ledger entry for payment
      await ledgerService.appendLedgerEntry(
        order.customerId,
        'PAYMENT',
        -amount,
        `HQ Payment for Order ${order.id}`,
        order.id
      );
    }"""
content2 = content2.replace(process_payment_orig, process_payment_new)

with open(path2, "w", encoding="utf-8") as f:
    f.write(content2)

print("Updated both files to use ledgerService!")
