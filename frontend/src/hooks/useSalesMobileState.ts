import { useState, useEffect, useMemo } from 'react';
import { database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import type {  Customer, Product, Order, PaymentHistoryItem, CustomerLedgerEntry  } from '../types/SalesmanAdmin';
import { ledgerService } from '../services/ledger';

export type TabType = 'customers' | 'products' | 'cart' | 'collections';

export interface CartItem {
  product: Product;
  qty: number;
}

export function useSalesMobileState() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderCustomer, setOrderCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Database state
  const [products, setProducts] = useState<Product[]>([]);
  const [rawCustomers, setRawCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [ledgers, setLedgers] = useState<Record<string, Record<string, CustomerLedgerEntry>>>({});

  // Sync Listeners
  useEffect(() => {
    setLoading(true);
    const unsubProd = onValue(ref(database, 'products'), snap => {
      setProducts(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubCust = onValue(ref(database, 'customers'), snap => {
      setRawCustomers(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubOrd = onValue(ref(database, 'sales_orders'), snap => {
      setOrders(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubPay = onValue(ref(database, 'sales_payments'), snap => {
      setPayments(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubLedgers = onValue(ref(database, 'customer_ledgers'), snap => {
      setLedgers(snap.exists() ? snap.val() : {});
      setLoading(false);
    });

    return () => {
      unsubProd(); unsubCust(); unsubOrd(); unsubPay(); unsubLedgers();
    };
  }, []);

  // Compute live balances
  const customers = useMemo(() => {
    return ledgerService.applyDynamicBalances(rawCustomers, ledgers);
  }, [rawCustomers, ledgers]);

  // Keep selected customers in sync with live data
  useEffect(() => {
    if (selectedCustomer) {
      const updated = customers.find(c => c.id === selectedCustomer.id);
      if (updated && updated.remainingBalance !== selectedCustomer.remainingBalance) {
        setSelectedCustomer(updated);
      }
    }
    if (orderCustomer) {
      const updated = customers.find(c => c.id === orderCustomer.id);
      if (updated && updated.remainingBalance !== orderCustomer.remainingBalance) {
        setOrderCustomer(updated);
      }
    }
  }, [customers]);

  return {
    loading,
    activeTab, setActiveTab,
    selectedCustomer, setSelectedCustomer,
    orderCustomer, setOrderCustomer,
    cart, setCart,
    customers,
    products,
    orders,
    payments
  };
}
