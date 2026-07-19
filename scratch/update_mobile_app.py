import re
import os

path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add ledgers state to SalesmanMobileApp
state_imports = r"import type { Customer, Order, PaymentHistoryItem, Product, CustomerLedgerEntry } from './SalesmanAdmin';"
# Fix import
content = content.replace(r"import type { Customer, Order, PaymentHistoryItem, Product } from './SalesmanAdmin';", 
                          r"import type { Customer, Order, PaymentHistoryItem, Product, CustomerLedgerEntry } from '../types/SalesmanAdmin';")
content = content.replace(r"import type { Customer, Order, PaymentHistoryItem, Product } from '../types/SalesmanAdmin';", 
                          r"import type { Customer, Order, PaymentHistoryItem, Product, CustomerLedgerEntry } from '../types/SalesmanAdmin';")

# 2. Add rawCustomers and ledgers
state_decl = """  const [activeTab, setActiveTab] = useState<'customers' | 'new_order' | 'collections'>('customers');
  const [rawCustomers, setRawCustomers] = useState<Customer[]>([]);
  const [ledgers, setLedgers] = useState<Record<string, Record<string, CustomerLedgerEntry>>>({});
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);"""

content = re.sub(
    r"  const \[activeTab, setActiveTab\] = useState.*?\n.*?const \[customers, setCustomers\] = useState<Customer\[\]>\(\[\]\);\n.*?const \[payments, setPayments\] = useState<PaymentHistoryItem\[\]>\(\[\]\);",
    state_decl,
    content,
    flags=re.DOTALL
)

# 3. Add derived customers
use_effect_code = """  useEffect(() => {
    const unsubCust = onValue(ref(database, 'customers'), (snap) => {
      setRawCustomers(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubLedgers = onValue(ref(database, 'customer_ledgers'), (snap) => {
      setLedgers(snap.exists() ? snap.val() : {});
    });
    const unsubPay = onValue(ref(database, 'sales_payments'), (snap) => {
      setPayments(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubOrd = onValue(ref(database, 'sales_orders'), (snap) => {
      setOrders(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubProd = onValue(ref(database, 'sales_products'), (snap) => {
      setProducts(snap.exists() ? Object.values(snap.val()) : []);
    });

    return () => {
      unsubCust();
      unsubLedgers();
      unsubPay();
      unsubOrd();
      unsubProd();
    };
  }, []);

  const customers = React.useMemo(() => {
    return rawCustomers.map(c => {
      const cLedgers = ledgers[c.id] ? Object.values(ledgers[c.id]) : [];
      if (cLedgers.length > 0) {
        const dynamicBalance = cLedgers.reduce((sum, entry) => sum + Number(entry.amount), 0);
        return { ...c, remainingBalance: dynamicBalance };
      }
      return c;
    });
  }, [rawCustomers, ledgers]);"""

content = re.sub(
    r"  useEffect\(\(\) => \{.*?unsubProd\(\);\n    \};\n  \}, \[\]\);",
    use_effect_code,
    content,
    flags=re.DOTALL
)

# 4. Handle collect payment (replace mutating remainingBalance with pushing ledger)
collect_payment_orig = """    // Deduct immediately so the salesman sees the updated balance instantly
    const newBalance = Math.max(0, Number(selectedCustomer.remainingBalance || 0) - amount);
    await set(ref(database, `customers/${selectedCustomer.id}/remainingBalance`), newBalance);"""

collect_payment_new = """    // Push a ledger entry so the salesman sees the updated balance instantly
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

content = content.replace(collect_payment_orig, collect_payment_new)

# 5. Handle submit order
submit_order_orig = """    // 3. Update customer's ledger
    // Deduct the upfront payment immediately so the salesman sees the true remaining balance
    const newDebt = orderTotal;
    const newBalance = Math.max(0, Number(orderCustomer.remainingBalance || 0) + newDebt - upf);
    await set(ref(database, `customers/${orderCustomer.id}/remainingBalance`), newBalance);"""

submit_order_new = """    // 3. Append to customer's transactional ledger
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

content = content.replace(submit_order_orig, submit_order_new)


with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SalesmanMobileApp.tsx")
