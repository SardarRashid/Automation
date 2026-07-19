import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\SalesmanAdminContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update imports
content = content.replace(
    "import { ref, onValue } from 'firebase/database';",
    "import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';\nimport { cacheUtils } from '../../lib/cacheUtils';"
)

# Replace the state initialization with cache checks
content = content.replace(
    "const [users, setUsers] = useState<User[]>([]);",
    "const [users, setUsers] = useState<User[]>(cacheUtils.get('sales_users') || []);"
)
content = content.replace(
    "const [products, setProducts] = useState<Product[]>([]);",
    "const [products, setProducts] = useState<Product[]>(cacheUtils.get('products') || []);"
)
content = content.replace(
    "const [rawCustomers, setRawCustomers] = useState<Customer[]>([]);",
    "const [rawCustomers, setRawCustomers] = useState<Customer[]>(cacheUtils.get('customers') || []);"
)
content = content.replace(
    "const [orders, setOrders] = useState<Order[]>([]);",
    "const [orders, setOrders] = useState<Order[]>(cacheUtils.get('sales_orders') || []);"
)
content = content.replace(
    "const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);",
    "const [payments, setPayments] = useState<PaymentHistoryItem[]>(cacheUtils.get('sales_payments') || []);"
)
content = content.replace(
    "const [ledgers, setLedgers] = useState<Record<string, Record<string, CustomerLedgerEntry>>>({});",
    "const [ledgers, setLedgers] = useState<Record<string, Record<string, CustomerLedgerEntry>>>(cacheUtils.get('customer_ledgers') || {});"
)

# Update useEffect
old_effect = """  useEffect(() => {
    setLoading(true);
    const unsubUsers = onValue(ref(database, 'sales_users'), (snap) => {
      try { setUsers(snap.exists() ? Object.values(snap.val() || {}) : []); } catch (e) { setUsers([]); }
    });
    const unsubProd = onValue(ref(database, 'products'), (snap) => {
      try { setProducts(snap.exists() ? Object.values(snap.val() || {}) : []); } catch (e) { setProducts([]); }
    });
    const unsubCust = onValue(ref(database, 'customers'), (snap) => {
      try { setRawCustomers(snap.exists() ? Object.values(snap.val() || {}) : []); } catch (e) { setRawCustomers([]); }
    });
    const unsubLedgers = onValue(ref(database, 'customer_ledgers'), (snap) => {
      try { setLedgers(snap.exists() ? (snap.val() || {}) : {}); } catch (e) { setLedgers({}); }
    });
    const unsubOrd = onValue(ref(database, 'sales_orders'), (snap) => {
      try { setOrders(snap.exists() ? Object.values(snap.val() || {}) : []); } catch (e) { setOrders([]); }
    });
    const unsubPay = onValue(ref(database, 'sales_payments'), (snap) => {
      try { setPayments(snap.exists() ? Object.values(snap.val() || {}) : []); } catch (e) { setPayments([]); }
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubProd();
      unsubCust();
      unsubLedgers();
      unsubOrd();
      unsubPay();
    };
  }, []);"""

new_effect = """  useEffect(() => {
    // If we have cached data, we can stop loading immediately
    if (users.length && products.length && rawCustomers.length) {
      setLoading(false);
    } else {
      setLoading(true);
    }

    const unsubUsers = onValue(ref(database, 'sales_users'), (snap) => {
      try { 
        const data = snap.exists() ? Object.values(snap.val() || {}) as User[] : [];
        setUsers(data);
        cacheUtils.set('sales_users', data);
      } catch (e) { setUsers([]); }
    });

    const unsubProd = onValue(ref(database, 'products'), (snap) => {
      try { 
        const data = snap.exists() ? Object.values(snap.val() || {}) as Product[] : [];
        setProducts(data);
        cacheUtils.set('products', data);
      } catch (e) { setProducts([]); }
    });

    const unsubCust = onValue(ref(database, 'customers'), (snap) => {
      try { 
        const data = snap.exists() ? Object.values(snap.val() || {}) as Customer[] : [];
        setRawCustomers(data);
        cacheUtils.set('customers', data);
      } catch (e) { setRawCustomers([]); }
    });

    const unsubLedgers = onValue(ref(database, 'customer_ledgers'), (snap) => {
      try { 
        const data = snap.exists() ? (snap.val() || {}) : {};
        setLedgers(data);
        cacheUtils.set('customer_ledgers', data);
      } catch (e) { setLedgers({}); }
    });

    // OPTIMIZATION: Query limit applied to massive collections
    const ordQuery = query(ref(database, 'sales_orders'), orderByChild('date'), limitToLast(500));
    const unsubOrd = onValue(ordQuery, (snap) => {
      try { 
        const data = snap.exists() ? Object.values(snap.val() || {}) as Order[] : [];
        setOrders(data);
        cacheUtils.set('sales_orders', data);
      } catch (e) { setOrders([]); }
    });

    const payQuery = query(ref(database, 'sales_payments'), orderByChild('date'), limitToLast(500));
    const unsubPay = onValue(payQuery, (snap) => {
      try { 
        const data = snap.exists() ? Object.values(snap.val() || {}) as PaymentHistoryItem[] : [];
        setPayments(data);
        cacheUtils.set('sales_payments', data);
        setLoading(false);
      } catch (e) { setPayments([]); setLoading(false); }
    });

    return () => {
      unsubUsers();
      unsubProd();
      unsubCust();
      unsubLedgers();
      unsubOrd();
      unsubPay();
    };
  }, []);"""

content = content.replace(old_effect, new_effect)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SalesmanAdminContext.tsx successfully.")
