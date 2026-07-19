import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { database } from '../../lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { cacheUtils } from '../../lib/cacheUtils';
import type {  User, Product, Customer, Order, PaymentHistoryItem, CustomerLedgerEntry  } from '../../types/SalesmanAdmin';
import { ledgerService } from '../../services/ledger';

interface SalesmanAdminState {
  loading: boolean;
  users: User[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  payments: PaymentHistoryItem[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setPayments: React.Dispatch<React.SetStateAction<PaymentHistoryItem[]>>;
}

const SalesmanAdminContext = createContext<SalesmanAdminState | undefined>(undefined);

export function SalesmanAdminProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(cacheUtils.get('sales_users') || []);
  const [products, setProducts] = useState<Product[]>(cacheUtils.get('products') || []);
  const [rawCustomers, setRawCustomers] = useState<Customer[]>(cacheUtils.get('customers') || []);
  const [orders, setOrders] = useState<Order[]>(cacheUtils.get('sales_orders') || []);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>(cacheUtils.get('sales_payments') || []);
  const [ledgers, setLedgers] = useState<Record<string, Record<string, CustomerLedgerEntry>>>(cacheUtils.get('customer_ledgers') || {});

  useEffect(() => {
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
  }, []);

  const customers = useMemo(() => {
    return ledgerService.applyDynamicBalances(rawCustomers, ledgers);
  }, [rawCustomers, ledgers]);

  return (
    <SalesmanAdminContext.Provider value={{
      loading, users, products, customers, orders, payments,
      setUsers, setProducts, setCustomers: setRawCustomers, setOrders, setPayments
    }}>
      {children}
    </SalesmanAdminContext.Provider>
  );
}

export function useSalesmanAdmin() {
  const context = useContext(SalesmanAdminContext);
  if (!context) {
    throw new Error("useSalesmanAdmin must be used within a SalesmanAdminProvider");
  }
  return context;
}
