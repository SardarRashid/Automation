import { safeDateStr } from '../utils/exports/ExportGenerators';
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SpreadsheetGrid, type ColumnDef } from '../components/ui/SpreadsheetGrid';
import ExportCenter from '../components/exports/ExportCenter';
import { OrderDetailsModal } from '../components/ui/OrderDetailsModal';

import { database, firebaseConfig } from '../lib/firebase';
import { ref, get, set, remove, push, onValue } from 'firebase/database';
import { workflowEngine } from '../services/workflow/WorkflowEngine';
import { eventBus } from '../services/core/EventBus';
import { BusinessEventType } from '../services/core/EventTypes';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

import { 
  Users, Package, TrendingUp, ShoppingBag, Plus, Edit2, Trash2, Check, X, FileSpreadsheet, 
  MapPin, Phone, AlertCircle, Database, RefreshCw, BarChart2, ShieldAlert, DollarSign, ArrowRight,
  Printer, FileText, FileDown, Sun, Moon, Eye, Download, LogOut, Globe, Send, ShoppingCart, UserIcon, UploadCloud
} from 'lucide-react';
import { getDefaultPermissions, hasAccess } from '../config/PermissionsRegistry';
import type { UserRole, UserPermissions } from '../config/PermissionsRegistry';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  territory?: string;
  password?: string;
  allowPriceOverride?: boolean;
  permissions?: UserPermissions;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
}

export interface Customer {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  address: string;
  territory?: string;
  remainingBalance: number;
}

export interface PaymentHistoryItem {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  amountPaid: number;
  description: string;
  collectedBy: string;
  status?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  salespersonId: string;
  salespersonName: string;
  date: string;
  time: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Delivered' | 'Cancelled';
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  payments?: { amount: number; method: string; date: string }[];
  paymentMethod?: 'Cash' | 'Bank Cheque' | 'POS Card' | 'Bank Transfer' | 'Other';
  amountPaid: number;
  pendingAmountPaid?: number;
  creditApplied?: number;
  isOffline: boolean;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMsg?: string;
  isStockDeducted?: boolean;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'UPLOAD' | 'DOWNLOAD' | 'CREATE_SHEET';
  status: 'SUCCESS' | 'ERROR';
  details: string;
}

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import { exportDailySalesToExcel } from '../utils/exportExcel';




export default function SalesmanAdmin() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'dashboard'|'spreadsheet'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User>({ id: 'admin', name: 'Admin', email: 'admin@admin', role: 'ADMIN' });
    
  // Set default tab based on role
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Orders Filter State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilterDate, setOrderFilterDate] = useState('');
  const [orderFilterMonth, setOrderFilterMonth] = useState('');
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const isOnline = true;
  const syncPendingCount = 0;
  const isSyncing = false;
  const spreadsheetId = null;
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const onAddUser = async (u: User) => {
    u.id = u.id || Date.now().toString();
    const pass = u.password || 'password123';
    
    // Create the user in Firebase Auth using Secondary SDK so we don't logout
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, u.email, pass);
      u.id = userCredential.user.uid;
    } catch (err: any) {
      console.error("Failed to create auth user:", err);
      console.error(`Failed to create user account: ${err.message}`);
      return; // Stop execution, don't write to database if auth creation fails!
    }

    await set(ref(database, `sales_users/${u.id}`), u);
    
    // Also push to main admin panel's users for pending approval
    if (u.email) {
      const userKey = u.email.toLowerCase().replace(/[.#$\[\]]/g, '_');
      const uRef = ref(database, `users/${userKey}`);
      get(uRef).then((snapshot) => {
        if (!snapshot.exists()) {
          set(uRef, {
            email: u.email,
            password: u.password || 'password123',
            role: 'pending',
            allowedApps: { salesman: true }
          });
        }
      });
    }
    fetchData();
  };
  const onEditUser = async (u: User) => {
    await set(ref(database, `sales_users/${u.id}`), u);
    fetchData();
  };
  const onDeleteUser = async (id: string) => {
    await remove(ref(database, `sales_users/${id}`));
    fetchData();
  };

  const onAddProduct = async (p: Product) => {
    p.id = p.id || Date.now().toString();
    await set(ref(database, `products/${p.id}`), p);
    fetchData();
  };
  const onEditProduct = async (p: Product) => {
    await set(ref(database, `products/${p.id}`), p);
    fetchData();
  };
  const onDeleteProduct = async (id: string) => {
    await remove(ref(database, `products/${id}`));
    fetchData();
  };

  const onAddCustomer = async (c: Customer) => {
    c.id = c.id || Date.now().toString();
    await set(ref(database, `customers/${c.id}`), c);
    fetchData();
  };
  const onEditCustomer = async (c: Customer) => {
    await set(ref(database, `customers/${c.id}`), c);
    fetchData();
  };
  const onDeleteCustomer = async (id: string) => {
    await remove(ref(database, `customers/${id}`));
    fetchData();
  };

  const onProcessPayment = async (order: Order, amount: number, method: string) => {
    // 1. Update Order Status
    const newPayment = { amount, method, date: new Date().toISOString() };
    const currentPayments = order.payments || [];
    const updatedPayments = [...currentPayments, newPayment];
    
    await set(ref(database, `sales_orders/${order.id}/payments`), updatedPayments);
    
    // Fix double-counting: add only the new amount to the current amountPaid
    const totalPaid = Number(order.amountPaid || 0) + Number(amount);
    
    if (totalPaid >= Number(order.totalAmount)) {
      await set(ref(database, `sales_orders/${order.id}/paymentStatus`), 'Paid');
    } else {
      await set(ref(database, `sales_orders/${order.id}/paymentStatus`), 'Partial');
    }
    
    await set(ref(database, `sales_orders/${order.id}/amountPaid`), totalPaid);
    await set(ref(database, `sales_orders/${order.id}/paymentMethod`), method);

    // Auto-approve the order if it was still Pending — payment has been collected
    if (order.status === 'Pending') {
      await set(ref(database, `sales_orders/${order.id}/status`), 'Approved');
    }

    // 2. Deduct from Customer Ledger
    if (order.customerId) {
      const customer = customers.find(c => c.id === order.customerId);
      if (customer) {
        // Guard: collecting cash should reduce debt but never create fake credit.
        // If balance is already 0 (credit was consumed at order creation), don't go negative.
        const newBalance = Math.max(0, Number(customer.remainingBalance || 0) - Number(amount));
        await set(ref(database, `customers/${order.customerId}/remainingBalance`), newBalance);
      }
    }
    fetchData();
  };

  const onConfirmFieldPayment = async (payment: PaymentHistoryItem) => {
    await set(ref(database, `sales_payments/${payment.id}/status`), 'Confirmed');
    
    // Note: We no longer deduct from customer.remainingBalance here because it is deducted 
    // immediately on the SalesmanMobileApp side for real-time accurate UI balances.

    if (payment.orderId) {
      // @ts-ignore
      const order = orders.find(o => o.id === payment.orderId);
      if (order) {
        const newAmountPaid = Number(order.amountPaid || 0) + Number(payment.amountPaid || 0);
        const newPaymentStatus = newAmountPaid >= order.totalAmount ? 'Paid' : 'Partial';
        // @ts-ignore
        await set(ref(database, `sales_orders/${payment.orderId}/amountPaid`), newAmountPaid);
        // @ts-ignore
        await set(ref(database, `sales_orders/${payment.orderId}/paymentStatus`), newPaymentStatus);
        // @ts-ignore
        await set(ref(database, `sales_orders/${payment.orderId}/isPaymentPendingApproval`), false);
        // @ts-ignore
        await set(ref(database, `sales_orders/${payment.orderId}/pendingAmountPaid`), 0);
        // Auto-approve the order if it was still Pending — field collection confirmed by admin
        if (order.status === 'Pending') {
          // @ts-ignore
          await set(ref(database, `sales_orders/${payment.orderId}/status`), 'Approved');
        }
      }
    } else {
      // Auto-distribute general collection to oldest unpaid orders
      let remainingToApply = Number(payment.amountPaid || 0);
      const unpaidOrders = orders
        .filter(o => o.customerId === payment.customerId && o.status !== 'Draft' && o.status !== 'Cancelled' && o.paymentStatus !== 'Paid')
        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

      for (const order of unpaidOrders) {
        if (remainingToApply <= 0) break;
        const balanceDue = Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0) - (order.pendingAmountPaid || 0));
        if (balanceDue > 0) {
          const applyAmt = Math.min(balanceDue, remainingToApply);
          remainingToApply -= applyAmt;
          
          const newAmountPaid = Number(order.amountPaid || 0) + applyAmt;
          const newPaymentStatus = newAmountPaid >= (order.totalAmount || 0) ? 'Paid' : 'Partial';
          
          await set(ref(database, `sales_orders/${order.id}/amountPaid`), newAmountPaid);
          await set(ref(database, `sales_orders/${order.id}/paymentStatus`), newPaymentStatus);
        }
      }
    }
    fetchData();
  };

  const onCollectCustomerPayment = async (customer: Customer, amount: number, method: string, note: string) => {
    const newPaymentRef = push(ref(database, 'sales_payments'));
    const paymentRecord = {
      id: newPaymentRef.key as string,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString(),
      amountPaid: amount,
      description: note || `Manual collection via ${method}`,
      collectedBy: "Supervisor",
      status: 'Confirmed'
    };
    await set(newPaymentRef, paymentRecord);
    
    const newBalance = Number(customer.remainingBalance || 0) - Number(amount);
    await set(ref(database, `customers/${customer.id}/remainingBalance`), newBalance);

    // Auto-distribute this payment across customer's oldest unpaid orders
    let remainingToApply = Number(amount);
    const unpaidOrders = orders
      .filter(o => o.customerId === customer.id && o.status !== 'Draft' && o.status !== 'Cancelled' && o.paymentStatus !== 'Paid')
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

    for (const order of unpaidOrders) {
      if (remainingToApply <= 0) break;
      const balanceDue = Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0) - (order.pendingAmountPaid || 0));
      if (balanceDue > 0) {
        const applyAmt = Math.min(balanceDue, remainingToApply);
        remainingToApply -= applyAmt;
        
        const newAmountPaid = Number(order.amountPaid || 0) + applyAmt;
        const newPaymentStatus = newAmountPaid >= (order.totalAmount || 0) ? 'Paid' : 'Partial';
        
        await set(ref(database, `sales_orders/${order.id}/amountPaid`), newAmountPaid);
        await set(ref(database, `sales_orders/${order.id}/paymentStatus`), newPaymentStatus);
      }
    }

    fetchData();
  };


  const onUpdateOrderStatus = async (orderId: string, status: 'Pending' | 'Approved' | 'Delivered' | 'Cancelled') => {
    try {
      await workflowEngine.transitionOrder(orderId, status as any, "admin");
      fetchData();
    } catch (err: any) {
      console.error("Error updating order: " + err.message);
    }
  };

  const onClearOrders = async () => {
    if (window.confirm("Are you sure you want to permanently delete ALL sales orders history? This cannot be undone.")) {
      await set(ref(database, 'sales_orders'), null);
      fetchData();
    }
  };

  const exportPaymentsToCSV = () => {
    const headers = ['ID', 'Date', 'Customer ID', 'Customer Name', 'Amount (SAR)', 'Method', 'Status', 'Salesman', 'Note'];
    const rows = payments.map(p => [
      p.id,
      new Date(p.date).toLocaleString(),
      p.customerId,
      `"${p.customerName}"`,
      p.amountPaid,
      p.method || 'Cash',
      p.status || 'Confirmed',
      p.collectedBy,
      `"${p.description || ''}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payments_export_.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onManualSync = async () => {};
  const onUpdateSpreadsheetId = () => {};
  const onLogout = () => { window.location.reload(); };
  const onToggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_dark_mode', 'false');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_dark_mode', 'true');
      setIsDarkMode(true);
    }
  };

  const fetchData = async () => {};

  React.useEffect(() => {
    setLoading(true);
    const unsubUsers = onValue(ref(database, 'sales_users'), (snap) => {
      setUsers(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubProd = onValue(ref(database, 'products'), (snap) => {
      setProducts(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubCust = onValue(ref(database, 'customers'), (snap) => {
      setCustomers(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubOrd = onValue(ref(database, 'sales_orders'), (snap) => {
      setOrders(snap.exists() ? Object.values(snap.val()) : []);
    });
    const unsubPay = onValue(ref(database, 'sales_payments'), (snap) => {
      setPayments(snap.exists() ? Object.values(snap.val()) : []);
      setLoading(false);
    });

  
  const handleExportCustomers = () => {
    const headers = ['id', 'name', 'phone', 'address', 'totalDebt', 'remainingBalance', 'creditLimit'];
    exportToCSV('sales_customers', customers, headers);
  };

  const handleImportCustomers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.phone) continue;
        const newRef = push(ref(database, 'sales_customers'));
        const custData = {
          id: row.id || newRef.key as string,
          name: row.name || 'Unknown',
          phone: row.phone || '',
          address: row.address || '',
          totalDebt: Number(row.totalDebt) || 0,
          remainingBalance: Number(row.remainingBalance) || 0,
          creditLimit: Number(row.creditLimit) || 0
        };
        // Use set to overwrite if id exists, or create new
        await set(ref(database, `sales_customers/${custData.id}`), custData);
      }
      console.log('Customers imported successfully!');
    } catch (err) {
      console.error('Failed to import CSV');
      console.error(err);
    }
  };

  const handleExportOrders = () => {
    const headers = ['id', 'customerId', 'date', 'time', 'totalAmount', 'status', 'paymentStatus', 'amountPaid'];
    exportToCSV('sales_orders', orders, headers);
  };
  return () => {
      unsubUsers();
      unsubProd();
      unsubCust();
      unsubOrd();
      unsubPay();
    };
  }, []);


  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'inventory' | 'customers' | 'orders' | 'finance' | 'sheets' | 'firebase' | 'exportCenter' | 'customerLedger' | 'orderHistory'>('dashboard');

  useEffect(() => {
    if (currentUser && currentUser.role === 'INVOICE_CLERK') {
      setActiveSubTab('invoiceWorkspace');
    } else if (currentUser && currentUser.role === 'MANAGER') {
      setActiveSubTab('managerWorkspace');
    }
  }, [currentUser]);

  const [activeTabGroup, setActiveTabGroup] = useState<'overview' | 'network' | 'commerce' | 'system'>('overview');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Custom Modal States
  const [deliverConfirmOrder, setDeliverConfirmOrder] = useState<any>(null);
  const [confirmFieldPayment, setConfirmFieldPayment] = useState<any>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<any>(null);
  const [paymentModalAmount, setPaymentModalAmount] = useState<string>('');
  const [paymentModalMethod, setPaymentModalMethod] = useState<string>('Cash');

  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any>(null);
  const [invoiceOptions, setInvoiceOptions] = useState({
    showSalesman: true,
    showContact: true,
    showDiscount: true,
    themeColor: '#059669', // Emerald 600
  });

  // Daily Summary PDF target date selection state initialized based on latest orders or calendar today
  const [reportDate, setReportDate] = useState<string>(() => {
    if (orders && orders.length > 0) {
      return orders[0].date;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [adminOrderFilter, setAdminOrderFilter] = useState<'All' | 'Pending' | 'Approved' | 'Delivered' | 'Cancelled'>('All');
  const [adminOrderSearchText, setAdminOrderSearchText] = useState('');
  const [adminOrderPaymentFilter, setAdminOrderPaymentFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [adminOrderDateFilter, setAdminOrderDateFilter] = useState('');

  // Local State Editors
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // New Entity States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserTerritory, setNewUserTerritory] = useState('North Territory');
  const [newUserAllowPriceOverride, setNewUserAllowPriceOverride] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('SALESMAN');
  const [newUserPermissions, setNewUserPermissions] = useState<UserPermissions>(getDefaultPermissions('SALESMAN'));

  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Grains');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('Bag');

  const [newCustName, setNewCustName] = useState('');
  const [newCustShop, setNewCustShop] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustBalance, setNewCustBalance] = useState('0');

  // Sheets & Webhook settings
  const [sheetInput, setSheetInput] = useState(spreadsheetId || '');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('daily_orders_webhook') || '');
  const [pushingOrders, setPushingOrders] = useState(false);

  // Static constants
  const territoryOptions = [
    'North Territory',
    'South Territory',
    'East Territory',
    'West Territory'
  ];

  const categoryOptions = [
    'Fruits',
    'Vegetables',
    'Flowers'
  ];

  // 1. CALCULATE TOP-LEVEL KPI METRICS
  const kpis = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'Cancelled');
    const revenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = orders.length;
    const clientCount = customers.length;
    const salesmanCount = users.filter(u => u.role === 'SALESPERSON').length;
    return { revenue, orderCount, clientCount, salesmanCount };
  }, [orders, customers, users]);

  // 2. RECHARTS DATA PREPARATORS
  const chartsData = useMemo(() => {
    // A. Daily Sales Trend
    const dailyMap: { [date: string]: number } = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      dailyMap[o.date] = (dailyMap[o.date] || 0) + o.totalAmount;
    });
    // Sort dates
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, revenue]) => ({
        date,
        Sales: parseFloat(revenue.toFixed(2))
      }))
      .sort((a,b) => a.date.localeCompare(b.date));

    // B. Category Breakdown
    const catMap: { [cat: string]: number } = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      (o.items || []).forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const category = prod ? prod.category : 'General';
        catMap[category] = (catMap[category] || 0) + (it.qty * it.price);
      });
    });
    const categoryBreakdown = Object.entries(catMap).map(([category, amount]) => ({
      name: category,
      Value: parseFloat(amount.toFixed(2))
    }));

    // C. Salesperson Performance Leaderboard
    const performMap: { [name: string]: { rev: number; count: number } } = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      if (!performMap[o.salespersonName]) {
        performMap[o.salespersonName] = { rev: 0, count: 0 };
      }
      performMap[o.salespersonName].rev += o.totalAmount;
      performMap[o.salespersonName].count += 1;
    });
    const leaderboard = Object.entries(performMap).map(([name, stat]) => ({
      name,
      Revenue: parseFloat(stat.rev.toFixed(2)),
      Orders: stat.count
    })).sort((a,b) => b.Revenue - a.Revenue);

    return { dailyTrend, categoryBreakdown, leaderboard };
  }, [orders, products]);

  // FORM CONTROLS: SUBMIT HANDLERS
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    onAddUser({
      id: `u-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: 'SALESPERSON',
      password: newUserPassword,
      territory: newUserTerritory,
      allowPriceOverride: newUserAllowPriceOverride
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('password123');
    setNewUserAllowPriceOverride(false);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdCode || !newProdPrice || !newProdStock) return;

    onAddProduct({
      id: `p-${Date.now()}`,
      name: newProdName,
      code: newProdCode,
      category: newProdCategory,
      price: parseFloat(newProdPrice),
      stock: parseInt(newProdStock),
      unit: newProdUnit
    });

    setNewProdName('');
    setNewProdCode('');
    setNewProdPrice('');
    setNewProdStock('');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustShop) return;

    onAddCustomer({
      id: `c-${Date.now()}`,
      name: newCustName,
      shopName: newCustShop,
      phone: newCustPhone || 'None',
      address: newCustAddress || 'None',
      remainingBalance: parseFloat(newCustBalance) || 0
    });

    setNewCustName('');
    setNewCustShop('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustBalance('0');
  };

  const applySpreadsheetLink = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSpreadsheetId(sheetInput);
    console.log('Spreadsheet ID has been saved & updated!');
  };

  const saveWebhookUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('daily_orders_webhook', webhookUrl);
    console.log('Webhook URL saved!');
  };

  const handlePushDailyOrders = async () => {
    if (!webhookUrl) {
      console.warn('Please configure a Webhook URL first.');
      return;
    }
    setPushingOrders(true);
    try {
      const todayStr = ``;
      const todaysOrders = orders.filter(o => o.date.startsWith(todayStr) && (o.status === 'Approved' || o.status === 'Delivered'));
      
      if (todaysOrders.length === 0) {
         console.warn('No orders found for today to push.');
         setPushingOrders(false);
         return;
      }

      const payload = {
        timestamp: new Date().toISOString(),
        recordCount: todaysOrders.length,
        orders: todaysOrders
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`Successfully pushed ${todaysOrders.length} orders to Webhook!`);
      } else {
        console.error('Failed to push orders: ' + response.statusText);
      }
    } catch (error) {
      console.error(error);
      console.error('An error occurred while pushing orders to the webhook.');
    } finally {
      setPushingOrders(false);
    }
  };

  
  // ----------- SPREADSHEET GRID COLUMNS -----------
  const orderColumns: ColumnDef<Order>[] = [
    { key: 'orderNumber', header: 'Order Number', width: '120px' },
    { key: 'date', header: 'Date', width: '100px', align: 'center' },
    { key: 'customerName', header: 'Customer', width: '200px' },
    { key: 'salespersonName', header: 'Salesman', width: '150px' },
    { key: 'totalAmount', header: 'Total (SAR)', width: '120px', align: 'right', total: true },
    { key: 'amountPaid', header: 'Paid (SAR)', width: '120px', align: 'right', total: true },
    { key: 'status', header: 'Status', width: '100px', align: 'center' },
    { key: 'paymentStatus', header: 'Payment', width: '100px', align: 'center' },
  ];

  const customerColumns: ColumnDef<any>[] = [
    { key: 'name', header: 'Customer', width: '250px' },
    { key: 'shopName', header: 'Shop', width: '200px' },
    { key: 'opening', header: 'Opening Balance', width: '150px', align: 'right', total: true },
    { key: 'orders', header: 'Total Orders', width: '150px', align: 'right', total: true },
    { key: 'paid', header: 'Payments Made', width: '150px', align: 'right', total: true },
    { key: 'returns', header: 'Returns', width: '150px', align: 'right', total: true },
    { key: 'balance', header: 'Remaining Balance', width: '150px', align: 'right', total: true },
  ];

  const productColumns: ColumnDef<any>[] = [
    { key: 'name', header: 'Product Name', width: '300px' },
    { key: 'code', header: 'SKU', width: '120px' },
    { key: 'sold', header: 'Sold Qty', width: '120px', align: 'center', total: true },
    { key: 'returned', header: 'Returned Qty', width: '120px', align: 'center', total: true },
    { key: 'stock', header: 'Current Stock', width: '120px', align: 'center', total: true },
  ];

  const processedCustomerData = useMemo(() => {
    return customers.map(c => {
      const cOrders = orders.filter(o => o.customerId === c.id && o.status !== 'Cancelled');
      const totalOrders = cOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalPaid = cOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
      const remainingBalance = Number(c.remainingBalance || 0);
      const totalReturns = 0;
      const openingBalance = remainingBalance + totalPaid - totalOrders + totalReturns;
      return { ...c, opening: openingBalance, orders: totalOrders, paid: totalPaid, returns: totalReturns, balance: remainingBalance };
    });
  }, [customers, orders]);

  const processedProductData = useMemo(() => {
    return (products || []).filter(p => p != null).map(p => {
      const soldQty = (orders || []).filter(o => o && o.status !== 'Cancelled').reduce((sum, o) => {
        const item = (o.items || []).find(i => i && i.productId === p.id);
        return sum + (item ? (item.qty || 0) : 0);
      }, 0);
      return { ...p, sold: soldQty, returned: 0 };
    });
  }, [products, orders]);

    return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-350 text-slate-900 dark:text-slate-100">
      
      {/* Admin Top Navigation bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-700 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-100" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Admin Management Hub</h1>
              <p className="text-xs text-green-300">Sales Order Tracker & Analytics Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-600 text-emerald-100 hover:text-white rounded-xl border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Open Live Monthly Google Sheets Workbook"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Open Live Google Sheet (Manager View)</span>
              </a>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-xl border border-slate-700 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isOnline ? 'Sheets Link Active' : 'Offline Mode'}</span>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Panel
            </button>
          </div>
        </div>
      </header>

      {/* Admin Sub Navigation tabs (GROUPED) */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full px-4">
          
          {/* Top Level: Group Tabs */}
          <div className="flex overflow-x-auto gap-2 py-3 border-b border-slate-100 hide-scrollbar">
            {(hasAccess(currentUser, 'sales_dashboard') || hasAccess(currentUser, 'sales_analytics')) && (
              <button
                onClick={() => { setActiveTabGroup('overview'); setActiveSubTab('dashboard'); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTabGroup === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📊 Overview & Analytics
              </button>
            )}
            
            {(hasAccess(currentUser, 'sales_orders') || hasAccess(currentUser, 'inventory_products')) && (
              <button
                onClick={() => { setActiveTabGroup('commerce'); setActiveSubTab('orders'); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTabGroup === 'commerce' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🛒 Commerce & Orders
              </button>
            )}

            {(hasAccess(currentUser, 'admin_users') || hasAccess(currentUser, 'sales_customerLedger') || hasAccess(currentUser, 'sales_customers')) && (
              <button
                onClick={() => { setActiveTabGroup('network'); setActiveSubTab(hasAccess(currentUser, 'admin_users') ? 'users' : 'customers'); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTabGroup === 'network' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👥 Accounts & Network
                {users.filter(u => u.role === 'pending').length > 0 && hasAccess(currentUser, 'admin_users') && (
                  <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-xs">
                    {users.filter(u => u.role === 'pending').length}
                  </span>
                )}
              </button>
            )}

            {(hasAccess(currentUser, 'admin_settings') || hasAccess(currentUser, 'extensions')) && (
              <button
                onClick={() => { setActiveTabGroup('system'); setActiveSubTab('sheets'); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTabGroup === 'system' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ⚙️ System & Sync
              </button>
            )}

            {hasAccess(currentUser, 'sales_exportHub') && (
              <button
                onClick={() => { setActiveTabGroup('export'); setActiveSubTab('exportCenter'); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTabGroup === 'export' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📤 Export Hub
              </button>
            )}
          </div>

                    {/* Second Level: Sub Tabs based on active group */}
          <div className="flex border-b border-slate-200 bg-white px-2 overflow-x-auto whitespace-nowrap">
            {activeTabGroup === 'overview' && (
              <>
                {hasAccess(currentUser, 'sales_dashboard') && (
                  <button
                    onClick={() => setActiveSubTab('dashboard')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'dashboard' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <TrendingUp className="w-4.5 h-4.5" /> Operations Dashboard
                  </button>
                )}
              </>
            )}

            {activeTabGroup === 'commerce' && (
              <>
                {hasAccess(currentUser, 'sales_orders') && (
                  <button
                    onClick={() => setActiveSubTab('orders')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'orders' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <ShoppingCart className="w-4.5 h-4.5" /> Central Orders 
                  </button>
                )}

                {hasAccess(currentUser, 'inventory_products') && (
                  <button
                    onClick={() => setActiveSubTab('inventory')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'inventory' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Package className="w-4.5 h-4.5" /> Catalog & Prices
                  </button>
                )}

                {hasAccess(currentUser, 'reports') && (
                  <button
                    onClick={() => setActiveSubTab('productLedger')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'productLedger' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" /> Product Ledger
                  </button>
                )}

                {hasAccess(currentUser, 'sales_customers') && (
                  <button
                    onClick={() => setActiveSubTab('customers')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'customers' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <ShoppingBag className="w-4.5 h-4.5" /> Client Directory
                  </button>
                )}

                {hasAccess(currentUser, 'sales_payments') && (
                  <button
                    onClick={() => setActiveSubTab('finance')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'finance' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <DollarSign className="w-4.5 h-4.5" /> Approved Payments
                  </button>
                )}
              </>
            )}

            {activeTabGroup === 'network' && (
              <>
                {hasAccess(currentUser, 'sales_customerLedger') && (
                  <button
                    onClick={() => setActiveSubTab('customerLedger')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'customerLedger' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" /> Customer Ledger
                  </button>
                )}

                {hasAccess(currentUser, 'sales_history') && (
                  <button
                    onClick={() => setActiveSubTab('orderHistory')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'orderHistory' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" /> Order History
                  </button>
                )}

              </>
            )}

            {activeTabGroup === 'system' && (
              <>
                {hasAccess(currentUser, 'admin_settings') && (
                  <button
                    onClick={() => setActiveSubTab('sheets')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'sheets' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-4.5 h-4.5" /> Sync Integration
                  </button>
                )}
              </>
            )}
            
            {activeTabGroup === 'export' && (
              <>
                {hasAccess(currentUser, 'sales_exportHub') && (
                  <button
                    onClick={() => setActiveSubTab('exportCenter')}
                    className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeSubTab === 'exportCenter' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Download className="w-4.5 h-4.5" /> Export Center Dashboard
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <main className="flex-1 w-full h-full p-4 md:p-6 space-y-6 overflow-y-auto">
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
        {/* ----------------- SUB-TAB 1: ANALYTICS DASHBOARD ----------------- */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-450 font-bold block text-xs uppercase tracking-wider mb-1">Total Revenue</span>
                  <span className="text-2xl font-bold font-mono text-blue-900">{kpis.revenue.toFixed(2)} SAR</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-700">
                  <TrendingUp className="w-5 h-5 text-[#1E3A8A]" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block text-xs uppercase tracking-wider mb-1">Orders Count</span>
                  <span className="text-2xl font-bold font-mono text-slate-800">{kpis.orderCount}</span>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl text-green-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block text-xs uppercase tracking-wider mb-1">Retail Stores</span>
                  <span className="text-2xl font-bold font-mono text-slate-800">{kpis.clientCount}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block text-xs uppercase tracking-wider mb-1">Active Sales Reps</span>
                  <span className="text-2xl font-bold font-mono text-slate-800">{kpis.salesmanCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>

            {/* VISUAL CHARTS PANELS (RECHARTS) - CONFIGURED WITH ABDULLAH SHARBATLY THEMATIC BRANDING */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily Sales Trend Visualizer Section */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                          Official Brand Metric
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-[#15803D] font-bold">Sharbatly Hub Insights</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs mt-1">Daily Revenue & Sales Trend</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Earned field bookings mapped across consecutive dispatch calendars in Saudi Riyal (SAR).
                      </p>
                    </div>

                    {/* interactive Toggle Pills */}
                    <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          chartType === 'area'
                            ? 'bg-white text-[#1E3A8A] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        📈 Area View
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          chartType === 'bar'
                            ? 'bg-white text-[#15803D] shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        📊 Bar View
                      </button>
                    </div>
                  </div>

                  {/* Summary Ribbon Metrics Inside Visual Section */}
                  <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 p-3 rounded-2xl border border-blue-105 mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-sm uppercase tracking-wider font-semibold">Peak Day Sales</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {chartsData.dailyTrend.length > 0 
                          ? `${Math.max(...chartsData.dailyTrend.map(d => d.Sales)).toFixed(2)} SAR` 
                          : '0.00 SAR'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-sm uppercase tracking-wider font-semibold">Average Booking</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {chartsData.dailyTrend.length > 0 
                          ? `${(chartsData.dailyTrend.reduce((sum, d) => sum + d.Sales, 0) / chartsData.dailyTrend.length).toFixed(2)} SAR`
                          : '0.00 SAR'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-sm uppercase tracking-wider font-semibold">Dispatch Trend Line</span>
                      <span className="font-bold text-[#1E3A8A] flex items-center gap-0.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#1E3A8A]" />
                        <span>Active Forecast</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {chartsData.dailyTrend.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-3xl">
                      No customer invoice stream orders submitted. Complete checkout to test visualization.
                    </div>
                  ) : isMounted ? (
                    <ResponsiveContainer width="99%" height={256} minWidth={0}>
                      {chartType === 'area' ? (
                        <AreaChart data={chartsData.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSalesSharbatly" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#15803D" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(tick) => {
                              // Elegant day/month format
                              try {
                                const parts = tick.split('-');
                                if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                              } catch(e) {}
                              return tick;
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(v) => `${v} SAR`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${parseFloat(value).toFixed(2)} SAR`, 'Revenue Net']} 
                            contentStyle={{ background: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Sales" 
                            stroke="#1E3A8A" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorSalesSharbatly)" 
                          />
                        </AreaChart>
                      ) : (
                        <BarChart data={chartsData.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(tick) => {
                              try {
                                const parts = tick.split('-');
                                if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                              } catch(e) {}
                              return tick;
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(v) => `${v} SAR`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${parseFloat(value).toFixed(2)} SAR`, 'Booking Peak']}
                            contentStyle={{ background: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                          />
                          <Bar 
                            dataKey="Sales" 
                            fill="#15803D" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={45}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              {/* Category Product Distribution BarChart */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-4 flex flex-col justify-between">
                <div>
                  <span className="p-1 px-2.5 bg-[#DC2626] text-white rounded-lg text-xs font-bold uppercase tracking-wider inline-block mb-3">
                    Category Mix
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs mb-1">Sales by Catalog</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-normal">Aggregate bookings earned per food product division.</p>
                </div>
                <div className="h-64 w-full">
                  {chartsData.categoryBreakdown.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-3xl">
                      No categorical division data yet
                    </div>
                  ) : isMounted ? (
                    <ResponsiveContainer width="99%" height={256} minWidth={0}>
                      <BarChart data={chartsData.categoryBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `${v} SAR`} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} tickLine={false} width={80} />
                        <Tooltip 
                          formatter={(value: any) => [`${parseFloat(value).toFixed(2)} SAR`, 'Division Sales']}
                          contentStyle={{ background: '#1e293b', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '10px' }} 
                        />
                        <Bar dataKey="Value" fill="#15803D" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>
            </div>

            {/* PERFORMANCE LEADERBOARD & RECENT SYSTEM LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Leaderboard panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1">Sales Reps Route Leaderboard</h3>
                <p className="text-xs text-slate-400 mb-4">Revenue bookings & route coverage</p>

                {chartsData.leaderboard.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No sales logs compiled yet.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {chartsData.leaderboard.map((rep, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{rep.name}</span>
                            <span className="text-xs text-slate-400 uppercase font-mono">{rep.Orders} orders booked</span>
                          </div>
                        </div>
                        <span className="font-bold text-[#1E3A8A] font-mono text-sm">{(rep.Revenue || 0).toFixed(2)} SAR</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sync Audit Logs */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1">Sheets Sync Pipeline Audit Logs</h3>
                <p className="text-xs text-slate-400 mb-4">Latest synchronization triggers and state logs</p>

                {syncLogs.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs">
                    No sync records registered yet in this session.
                  </div>
                ) : (
                  <div className="space-y-2.5 h-60 overflow-y-auto pr-1">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl text-sm font-mono leading-normal shadow-xs border border-slate-100">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={log.status === 'SUCCESS' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                            {log.status}
                          </span>
                        </div>
                        <span className="text-slate-700 block font-sans text-xs">{log.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ----------------- SUB-TAB 3: PRODUCT INVENTORY CATALOG ----------------- */}
        {activeSubTab === 'inventory' && (
          <div className="w-full">
              {viewMode === 'spreadsheet' ? (
                <div className="h-[800px] w-full">
                  <SpreadsheetGrid 
                    data={products}
                    columns={[
                      { key: 'code', header: 'Product Code (SKU)', width: 120 },
                      { key: 'name', header: 'Product Name', width: 250 },
                      { key: 'category', header: 'Category', width: 150 },
                      { key: 'price', header: 'Price', width: 100 },
                      { key: 'stock', header: 'Stock', width: 100 }
                    ]}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            
            {/* New Product Form */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Add Product SKU</h3>
              <p className="text-xs text-slate-400 mb-4">Insert new items and prices to feed route salesman terminals.</p>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. P011"
                      value={newProdCode}
                      onChange={(e) => setNewProdCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-normal">Pack Unit</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bag, Box"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Lentils 5kg"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category Group</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-sans">Standard Price (SAR)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="12.50"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="150"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Insert Active SKU
                </button>
              </form>
            </div>

            {/* Product Grid Table */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Standard Products & Prices Inventory Sheet</h3>
              <p className="text-xs text-slate-400 mb-4">Edit pricing and stock levels globally mapped to on-site catalogs.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Code</th>
                      <th className="pb-3 px-4 border border-slate-200">Product Name / Description</th>
                      <th className="pb-3 px-4 border border-slate-200">Category Group</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Standard Price</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">In-Stock Qty</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Settings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-400 border border-slate-200">{prod.code}</td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="font-bold text-slate-800 text-sm block">{prod.name}</span>
                          <span className="text-xs text-slate-400">Inventory Unit: {prod.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded uppercase">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 border border-slate-200">
                          {editingProduct?.id === prod.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-16 p-1 text-right border rounded bg-white text-xs font-mono"
                              value={editingProduct.price}
                              onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                            />
                          ) : (
                            `${(prod.price || 0).toFixed(2)} SAR`
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center border border-slate-200">
                          {editingProduct?.id === prod.id ? (
                            <input
                              type="number"
                              className="w-14 p-1 text-center border rounded bg-white text-xs font-mono"
                              value={editingProduct.stock}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                            />
                          ) : (
                            <span className={prod.stock < 20 ? 'text-rose-600 font-bold font-mono' : 'font-mono'}>
                              {prod.stock} {prod.unit}s
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap border border-slate-200">
                          {editingProduct?.id === prod.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onEditProduct(editingProduct);
                                  setEditingProduct(null);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs cursor-pointer"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-green-650 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this product? It will delete referencing catalog items.')) {
                                    onDeleteProduct(prod.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
              </>
            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    )}

        {/* ----------------- SUB-TAB 4: CUSTOMERS & LEDGERS SHEET ----------------- */}
        
{activeSubTab === 'customers' && (
          <div className="w-full">
              {viewMode === 'spreadsheet' ? (
                <div className="h-[800px] w-full">
                  <SpreadsheetGrid 
                    data={customers}
                    columns={[
                      { key: 'id', header: 'Customer ID', width: 150 },
                      { key: 'name', header: 'Customer Name', width: 250 },
                      { key: 'region', header: 'Region', width: 150 },
                      { key: 'type', header: 'Type', width: 150 }
                    ]}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            
            {/* New Customer registry */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Add Retail Client Profile</h3>
              <p className="text-xs text-slate-400 mb-4">Enroll retail profiles with initial balances mapped to route territories.</p>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sardar Rashid"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Shop / Outlet Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rashid General Store"
                    value={newCustShop}
                    onChange={(e) => setNewCustShop(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl mt-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +92-300-1234567"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Outlet Address</label>
                  <textarea
                    rows={2}
                    placeholder="Sector / Area description..."
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 font-sans">Initial Outstanding Debt (SAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newCustBalance}
                    onChange={(e) => setNewCustBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Enroll Retail Client
                </button>
              </form>
            </div>

            {/* Customers Master Ledger Table */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1">Customers Accounts Master Ledger Beat Registry</h3>
              <p className="text-xs text-slate-400 mb-4 font-normal">Check contact info, outstanding dues, and trace payments.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Shop details</th>
                      <th className="pb-3 px-4 border border-slate-200">Contact</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Debit Balance</th>
                      <th className="pb-3 px-4 text-right border border-slate-200">Settings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(cust => (
                      <tr key={cust.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-sans text-xs border border-slate-200">
                          {editingCustomer?.id === cust.id ? (
                            <input
                              type="text"
                              className="font-bold text-slate-800 border p-1"
                              value={editingCustomer.shopName}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, shopName: e.target.value })}
                            />
                          ) : (
                            <span className="font-bold text-slate-800 text-sm block leading-tight">{cust.shopName}</span>
                          )}
                          <span className="text-xs text-green-700 font-medium font-sans">Prop: {cust.name}</span>
                          <span className="text-xs text-slate-400 block max-w-xs truncate">{cust.address}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono border border-slate-200">{cust.phone}</td>
                        <td className="py-3.5 px-4 text-right border border-slate-200">
                          {editingCustomer?.id === cust.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-16 text-right border font-mono"
                              value={editingCustomer.remainingBalance}
                              onChange={(e) => setEditingCustomer({ ...editingCustomer, remainingBalance: parseFloat(e.target.value) || 0 })}
                            />
                          ) : (
                            <span className={`font-mono font-bold text-xs ${(cust.remainingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {(cust.remainingBalance || 0).toFixed(2)} SAR
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap border border-slate-200">
                          {editingCustomer?.id === cust.id ? (
                            <>
                              <button
                                onClick={() => {
                                  onEditCustomer(editingCustomer);
                                  setEditingCustomer(null);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCustomer(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingCustomer(cust)}
                                className="p-1.5 text-slate-400 hover:text-green-650 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this customer? It will wipe off active route ledgers.')) {
                                    onDeleteCustomer(cust.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
              </>
            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    )}

        {/* ----------------- SUB-TAB 5: ORDER TRANSACTIONS STREAM ----------------- */}
        
{activeSubTab === 'orders' && (
          <div className="w-full">
              {viewMode === 'spreadsheet' ? (

                <div className="h-[800px]">
                  <SpreadsheetGrid 
                    data={orders}
                    columns={[
                      { key: 'orderId', header: 'Order No', width: 120 },
                      { key: 'createdAt', header: 'Date', width: 150 },
                      { key: 'customerName', header: 'Customer', width: 250 },
                      { key: 'salesmanName', header: 'Salesman', width: 150 },
                      { key: 'status', header: 'Status', width: 120 },
                      { key: 'totalAmount', header: 'Total', width: 120 }
                    ]}
                    onRowDoubleClick={(order) => setSelectedOrder(order)}
                  />
                </div>
              ) : (
                <>

            
            {/* Daily Report PDF Archival Center Section */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-green-700 rounded-lg text-green-100">
                      <Printer className="w-5 h-5" />
                    </span>
                    <h4 className="font-bold text-sm tracking-tight">Daily Summary PDF Archival Center</h4>
                  </div>
                  <p className="text-slate-300 text-xs leading-normal">
                    Select any target date to compile and export a high-fidelity, polished, standard-ready A4 daily sales report PDF. Ideal for printing, archival, or workspace audits.
                  </p>
                  <button 
                    onClick={onClearOrders}
                    className="mt-2 px-3 py-1 bg-red-900/60 hover:bg-red-700 text-red-200 hover:text-white rounded-lg border border-red-500/30 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All Order History
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Target Sales Date
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-green-600 border border-slate-700 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Orders Found
                    </label>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold border ${
                      orders.filter(o => o.date === reportDate).length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {orders.filter(o => o.date === reportDate).length} Orders
                    </span>
                  </div>

                  <button
                    onClick={() => exportDailySalesToExcel(reportDate, orders)}
                    className="mt-1 md:mt-4 px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export to Excel Summary</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Live Sales Orders Transactions Stream</h3>
                  <p className="text-xs text-slate-400 font-normal">Review sales performance, check synchronization metadata, and approve/cancel order statuses.</p>
                </div>

                {/* Batch Action Control */}
                <button
                  type="button"
                  onClick={() => {
                    // @ts-ignore
                    const pendingList = orders.filter(o => o.status === 'Pending' && !o.isPaymentPendingApproval);
                    if (pendingList.length === 0) {
                      console.warn('No pending orders are waiting for Manager approval right now (or all are waiting for payment verification).');
                      return;
                    }
                    if (window.confirm(`Batch approve all ${pendingList.length} ready pending orders? This automatically updates the Google Sheets and logs in real time.`)) {
                      pendingList.forEach(p => onUpdateOrderStatus(p.id, 'Approved'));
                      console.log(`Successfully batch approved ${pendingList.length} orders! Both manager sheets matrix and invoicing ledger updated.`);
                    }
                  }}
                  className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-green-100"
                >
                  <Check className="w-4 h-4 text-green-650" />
                  {/* @ts-ignore */}
                  <span>Batch Approve All ({orders.filter(o => o.status === 'Pending' && !o.isPaymentPendingApproval).length} Ready)</span>
                </button>
              </div>

              {/* Status Filters Bar */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                  {(['All', 'Pending', 'Approved', 'Delivered', 'Cancelled'] as const).map(fState => (
                    <button
                      key={fState}
                      onClick={() => setAdminOrderFilter(fState)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        adminOrderFilter === fState ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                    {fState} Orders ({fState === 'All' ? orders.filter(o => o.status !== 'Draft').length : orders.filter(o => o.status === fState).length})
                    </button>
                  ))}
                </div>

                {/* Orders Filter Controls */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Customer / ID</label>
                    <input 
                      type="text" 
                      placeholder="Customer name or Order Number..." 
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter Date</label>
                    <input 
                      type="date" 
                      value={orderFilterDate}
                      onChange={(e) => {
                        setOrderFilterDate(e.target.value);
                        setOrderFilterMonth('');
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter Month</label>
                    <input 
                      type="month" 
                      value={orderFilterMonth}
                      onChange={(e) => {
                        setOrderFilterMonth(e.target.value);
                        setOrderFilterDate('');
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <button 
                    onClick={() => { setOrderSearchQuery(''); setOrderFilterDate(''); setOrderFilterMonth(''); setAdminOrderFilter('All'); }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
  
                <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-xs font-sans border border-slate-200">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-left uppercase text-sm tracking-wider">
                      <th className="pb-3 px-4 border border-slate-200">Order details</th>
                      <th className="pb-3 px-4 border border-slate-200">Logged customer</th>
                      <th className="pb-3 px-4 border border-slate-200">On-site representative</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">Amount total</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">Payment state</th>
                      <th className="pb-3 px-4 text-center border border-slate-200">Fulfill Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(ord => ord.status !== 'Draft')
                      .filter(ord => adminOrderFilter === 'All' || ord.status === adminOrderFilter)
                      .filter(ord => {
                        if (orderSearchQuery) {
                          const q = orderSearchQuery.toLowerCase();
                          return (ord.customerName || '').toLowerCase().includes(q) || (ord.id || '').toLowerCase().includes(q) || (ord.orderNumber || '').toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .filter(ord => {
                        if (orderFilterDate) {
                          return ord.date === orderFilterDate;
                        }
                        if (orderFilterMonth) {
                          return ord.date.startsWith(orderFilterMonth);
                        }
                        return true;
                      })
                      .reverse()
                      .map(ord => (
                      <tr key={ord.id} className="border border-slate-50 rounded-xl hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-sans text-xs border border-slate-200">
                          <span className="font-bold text-slate-800 text-[13px] block">{ord.orderNumber || `#${ord.id.slice(-6).toUpperCase()}`}</span>
                          <span className="text-xs text-slate-400 font-mono block">{ord.date} • {ord.time}</span>
                        </td>
                        <td className="py-3.5 px-4 border border-slate-200">
                          <span className="font-medium text-slate-800 block text-xs">{ord.customerName}</span>
                        </td>
                        <td className="py-3.5 px-4 font-sans text-xs border border-slate-200">{ord.salespersonName}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 text-sm font-semibold border border-slate-200">
                          {(ord.totalAmount || 0).toFixed(2)} SAR
                        </td>
                        <td className="py-3.5 px-4 text-center cursor-pointer border border-slate-200" title="Click to process payment" onClick={() => {
                          const balanceDue = Math.max(0, (ord.totalAmount || 0) - (ord.amountPaid || 0) - (ord.pendingAmountPaid || 0));
                          if (balanceDue <= 0) return; // Already fully paid/pending
                          setPaymentModalOrder(ord);
                          setPaymentModalAmount(String(balanceDue.toFixed(2)));
                          setPaymentModalMethod('Cash');
                        }}>
                          {/* @ts-ignore */}
                          {ord.isPaymentPendingApproval ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed" title="Pending Verification in Field Collections">
                              Verifying Payment ⏳
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase hover:opacity-80 transition-opacity ${
                              ord.paymentStatus === 'Paid' || ((ord.totalAmount || 0) - (ord.amountPaid || 0) - (ord.pendingAmountPaid || 0)) <= 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : ord.paymentStatus === 'Partial' 
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {(() => {
                                const remaining = Math.max(0, (ord.totalAmount || 0) - (ord.amountPaid || 0) - (ord.pendingAmountPaid || 0));
                                if (remaining <= 0 || ord.paymentStatus === 'Paid') return 'Paid ✓';
                                return `${remaining.toFixed(2)} SAR Due ✏️`;
                              })()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap border border-slate-200">
                          <button
                            onClick={() => setInvoiceModalOrder(ord)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors inline-block align-middle mr-1"
                            title="Generate Invoice PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {/* @ts-ignore */}
                          <select
                            // @ts-ignore
                            disabled={ord.status === 'Delivered' || ord.isPaymentPendingApproval}
                            value={ord.status}
                            onChange={(e: any) => {
                              if (e.target.value === 'Delivered') {
                                setDeliverConfirmOrder(ord);
                              } else {
                                onUpdateOrderStatus(ord.id, e.target.value);
                              }
                            }}
                            className={`p-1 px-2 border rounded-lg text-xs font-bold focus:outline-none ${
                              // @ts-ignore
                              ord.isPaymentPendingApproval
                                ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed opacity-70'
                                : ord.status === 'Delivered' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : ord.status === 'Cancelled' 
                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                    : 'bg-slate-50 text-slate-700 border-slate-150'
                            }`}
                          >
                            <option value="Pending">💡 Pending Approved</option>
                            <option value="Approved">⚙️ Approved</option>
                            <option value="Delivered">✓ Delivered</option>
                            <option value="Cancelled">✕ Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </>
      )}
    </div>
  )}

{activeSubTab === 'finance' && (
          <div className="space-y-6">
            {/* Customer Ledger Collections Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                Customer Ledger
              </h3>
              <p className="text-sm text-slate-500 mb-6">Manage customer balances and collect payments directly from their ledger.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold border-b rounded-tl-xl border border-slate-200">Customer ID</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Name</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Store</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Remaining Balance</th>
                      <th className="py-3 px-4 font-bold border-b text-center rounded-tr-xl border border-slate-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {customers.filter(c => Number(c.remainingBalance || 0) > 0).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                          No outstanding balances for any customers!
                        </td>
                      </tr>
                    ) : customers.filter(c => Number(c.remainingBalance || 0) > 0).map(cust => (
                      <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 text-xs border border-slate-200">{cust.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 border border-slate-200">{cust.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 border border-slate-200">{cust.storeName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 border border-slate-200">{Number(cust.remainingBalance || 0).toFixed(2)} SAR</td>
                        <td className="py-3 px-4 text-center border border-slate-200">
                          <button
                            onClick={() => {
                              setPaymentModalCustomer(cust);
                              setPaymentModalAmount(String(Number(cust.remainingBalance || 0).toFixed(2)));
                              setPaymentModalMethod('Cash');
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Collect Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Field Collections Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm mt-6">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-amber-600" />
                Pending Field Collections
              </h3>
              <p className="text-sm text-slate-500 mb-6">Verify and confirm payments collected by Salesmen in the field.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold border-b rounded-tl-xl border border-slate-200">Date</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Salesman</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Customer</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Amount</th>
                      <th className="py-3 px-4 font-bold border-b border border-slate-200">Description</th>
                      <th className="py-3 px-4 font-bold border-b text-center rounded-tr-xl border border-slate-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {payments.filter(p => p.status === 'Pending Verification' || p.status === 'Pending').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                          No pending field collections to verify.
                        </td>
                      </tr>
                    ) : payments.filter(p => p.status === 'Pending Verification' || p.status === 'Pending').map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-slate-500 border border-slate-200">{new Date(pay.date).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 border border-slate-200">{pay.collectedBy}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 border border-slate-200">{pay.customerName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 border border-slate-200">{Number(pay.amountPaid || 0).toFixed(2)} SAR</td>
                        <td className="py-3 px-4 text-xs text-slate-500 border border-slate-200">{pay.description}</td>
                        <td className="py-3 px-4 text-center border border-slate-200">
                          <button
                            onClick={() => setConfirmFieldPayment(pay)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Confirm Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUB-TAB 6: SPREADSHEETS HUB ----------------- */}
        {activeSubTab === 'sheets' && (
          <div className="space-y-6">
            {/* Sync panel integration widget */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Google Sheets API Live Integration Pipeline</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Synchronize Products, Customer registries, and Daily Sales Order matrices into designated Google Sheets.
                </p>
                {spreadsheetId ? (
                  <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-sm truncate mt-2">
                    <span className="text-slate-400 select-none">Sheets Key:</span>
                    <span className="text-slate-600 select-all truncate">{spreadsheetId}</span>
                  </div>
                ) : (
                  <span className="inline-block text-sm font-bold text-rose-500 mt-1">
                    ⚠️ Missing active Spreadsheet ID. Input configuration below!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Spreadsheet connector form */}
                <form onSubmit={applySpreadsheetLink} className="flex gap-1.5 items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    required
                    placeholder="Google Spreadsheet ID..."
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    className="px-3 py-1.5 bg-white text-xs rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-green-700 border border-slate-250 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-green-800 whitespace-nowrap"
                  >
                    Set ID
                  </button>
                </form>

                <button
                  onClick={onManualSync}
                  disabled={isSyncing || !isOnline}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-650/40 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : `Push Sync (${syncPendingCount})`}</span>
                </button>
              </div>
            </div>

            {/* Webhook Push Integration Widget */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm mt-6">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                <Globe className="w-5 h-5 text-indigo-600" />
                <span>Daily Orders Webhook Push (Zapier/Make/OneDrive)</span>
              </div>
              <p className="text-slate-500 text-xs mb-4">
                Configure a Webhook URL to push daily orders to external services like Microsoft Excel on OneDrive via automation platforms (e.g., Make.com or Zapier).
              </p>
              
              <form onSubmit={saveWebhookUrl} className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hook.make.com/..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm"
                  required
                />
                <button type="submit" className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors">
                  Save Webhook
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">Push all orders created today ({new Date().toLocaleDateString()})</p>
                <button
                  onClick={handlePushDailyOrders}
                  disabled={pushingOrders}
                  className={`px-6 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${pushingOrders ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'}`}
                >
                  {pushingOrders ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Push Daily Orders
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mt-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Native Data Export Hub</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Export your sales orders, customer lists, and product matrix directly to Excel or CSV for offline analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <button
                  onClick={() => exportDailySalesToExcel(``, orders.filter(o => o.status === 'Approved' || o.status === 'Delivered'))}
                  className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
                  <span className="font-semibold text-slate-700 group-hover:text-emerald-700">Export Daily Sales</span>
                  <span className="text-xs text-slate-500">{orders.length} Records</span>
                </button>
                
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Customer ID,Name,Phone,Address,Balance\n"
                      + customers.map(c => `${c.id},"${c.name}","${c.phone || ''}","${c.address || ''}",${c.remainingBalance || 0}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `customers_.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="p-6 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <Users className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                  <span className="font-semibold text-slate-700 group-hover:text-blue-700">Export Customer List</span>
                  <span className="text-xs text-slate-500">{customers.length} Records</span>
                </button>
                
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Product ID,Name,Category,Original Price\n"
                      + products.map(p => `${p.id},"${p.name}","${p.category || ''}",${p.originalPrice}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `products_.csv`);
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="p-6 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <Package className="w-8 h-8 text-slate-400 group-hover:text-purple-600" />
                  <span className="font-semibold text-slate-700 group-hover:text-purple-700">Export Product Matrix</span>
                  <span className="text-xs text-slate-500">{products.length} Records</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'firebase' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-800">Firebase System Management</h3>
              </div>
              <p className="text-sm text-slate-600 mb-8">
                Manage your real-time database data directly from this hub. 
              </p>

              <div className="border border-red-200 rounded-2xl bg-red-50/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h4 className="text-sm font-bold text-red-700">Danger Zone</h4>
                </div>
                <p className="text-xs text-red-600/80 mb-6 font-medium">
                  The following actions are highly destructive. Data will be permanently wiped from the Firebase realtime database and cannot be recovered unless you have a backup.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you SURE you want to clear ALL Orders? This action is irreversible.")) {
                        await set(ref(database, 'sales_orders'), null);
                        console.log("Orders data cleared.");
                      }
                    }}
                    className="flex justify-between items-center p-4 bg-white border border-red-200 hover:border-red-400 rounded-xl transition-all"
                  >
                    <span className="font-bold text-slate-700 text-sm">Clear Orders Data</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded-lg">Wipe</span>
                  </button>

                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you SURE you want to clear ALL Payments? This action is irreversible.")) {
                        await set(ref(database, 'sales_payments'), null);
                        console.log("Payments data cleared.");
                      }
                    }}
                    className="flex justify-between items-center p-4 bg-white border border-red-200 hover:border-red-400 rounded-xl transition-all"
                  >
                    <span className="font-bold text-slate-700 text-sm">Clear Payments Data</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded-lg">Wipe</span>
                  </button>

                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you SURE you want to clear ALL Customers? This action is irreversible.")) {
                        await set(ref(database, 'customers'), null);
                        console.log("Customers data cleared.");
                      }
                    }}
                    className="flex justify-between items-center p-4 bg-white border border-red-200 hover:border-red-400 rounded-xl transition-all"
                  >
                    <span className="font-bold text-slate-700 text-sm">Clear Customers Data</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded-lg">Wipe</span>
                  </button>

                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you SURE you want to clear ALL Products/Inventory? This action is irreversible.")) {
                        await set(ref(database, 'sales_products'), null);
                        console.log("Products data cleared.");
                      }
                    }}
                    className="flex justify-between items-center p-4 bg-white border border-red-200 hover:border-red-400 rounded-xl transition-all"
                  >
                    <span className="font-bold text-slate-700 text-sm">Clear Products Data</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded-lg">Wipe</span>
                  </button>

                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you SURE you want to clear ALL Apps/Users? This action is irreversible.")) {
                        await set(ref(database, 'sales_users'), null);
                        console.log("Apps/Users data cleared.");
                      }
                    }}
                    className="flex justify-between items-center p-4 bg-white border border-red-200 hover:border-red-400 rounded-xl transition-all"
                  >
                    <span className="font-bold text-slate-700 text-sm">Clear Apps Data</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded-lg">Wipe</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIELD COLLECTION CONFIRM MODAL */}
        {confirmFieldPayment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/40 border border-amber-100 dark:border-amber-800 flex items-center justify-center mb-4 mx-auto">
                <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-center text-slate-800 dark:text-slate-200 mb-1">Confirm Collection Receipt?</h3>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-5">Please verify the following payment before confirming.</p>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Salesman</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{confirmFieldPayment.collectedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{confirmFieldPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Amount</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">{Number(confirmFieldPayment.amountPaid || 0).toFixed(2)} SAR</span>
                </div>
                {confirmFieldPayment.description && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Note</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300 text-right max-w-[60%]">{confirmFieldPayment.description}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmFieldPayment(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmFieldPayment(confirmFieldPayment);
                    setConfirmFieldPayment(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
                >
                  ✓ Yes, Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY CONFIRM MODAL */}
        {deliverConfirmOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center mb-4 mx-auto">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xs font-bold text-center text-slate-800 dark:text-slate-200 mb-2">Mark as Delivered?</h3>
              <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to mark this order as <b>Delivered</b>? Once marked, you cannot revert the order status via the UI.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeliverConfirmOrder(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateOrderStatus(deliverConfirmOrder.id, 'Delivered');
                    setDeliverConfirmOrder(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
                >
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM PAYMENT MODAL */}
        {paymentModalOrder && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Process Payment</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Order: {paymentModalOrder.orderNumber || `#${paymentModalOrder.id.slice(-6).toUpperCase()}`}</p>
                </div>
                <button onClick={() => setPaymentModalOrder(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Balance Due</span>
                  <span className="font-bold text-xs text-emerald-700 font-mono">${Math.max(0, (paymentModalOrder.totalAmount || 0) - (paymentModalOrder.amountPaid || 0) - (paymentModalOrder.pendingAmountPaid || 0)).toFixed(2)}</span>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Collection Medium</label>
                  <select 
                    value={paymentModalMethod}
                    onChange={(e) => setPaymentModalMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="POS Card">💳 POS Card</option>
                    <option value="Bank Cheque">🏦 Bank Cheque</option>
                    <option value="Bank Transfer">🔄 Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Amount Collected ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentModalAmount}
                    onChange={(e) => setPaymentModalAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  onClick={() => {
                    const amt = parseFloat(paymentModalAmount);
                    const bal = Math.max(0, (paymentModalOrder.totalAmount || 0) - (paymentModalOrder.amountPaid || 0) - (paymentModalOrder.pendingAmountPaid || 0));
                    if (isNaN(amt) || amt <= 0 || amt > bal || bal <= 0) {
                      console.error('Invalid payment amount. It cannot exceed the remaining balance due.');
                      return;
                    }
                    onProcessPayment(paymentModalOrder, amt, paymentModalMethod);
                    setPaymentModalOrder(null);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Check className="w-5 h-5" /> Confirm Payment Receipt
                </button>
              </div>
            </div>
          </div>
        )}

        
        {/* CUSTOMER PAYMENT MODAL */}
        {paymentModalCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xs font-bold text-slate-800">Ledger Collection</h2>
                  <p className="text-sm text-slate-500 font-medium">Customer: {paymentModalCustomer.name}</p>
                </div>
                <button onClick={() => setPaymentModalCustomer(null)} className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-colors border border-slate-200 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Amount Collected ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentModalAmount}
                    onChange={(e) => setPaymentModalAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  onClick={() => {
                    const amt = parseFloat(paymentModalAmount);
                    if (isNaN(amt) || amt <= 0) {
                      console.error('Invalid payment amount entered.');
                      return;
                    }
                    onCollectCustomerPayment(paymentModalCustomer, amt, paymentModalMethod, "Manual ledger collection by Supervisor");
                    setPaymentModalCustomer(null);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Check className="w-5 h-5" /> Confirm Payment Receipt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM INVOICE GENERATOR MODAL */}
        {invoiceModalOrder && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Sidebar Settings */}
              <div className="w-full md:w-80 border-r border-slate-100 bg-slate-50 flex flex-col h-full">
                <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Printer className="w-5 h-5 text-indigo-600"/> Invoice Settings</h3>
                  <button onClick={() => setInvoiceModalOrder(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-3">Theme Color</label>
                    <div className="flex flex-wrap gap-2">
                      {['#059669', '#4f46e5', '#db2777', '#ea580c', '#0284c7', '#475569'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setInvoiceOptions({...invoiceOptions, themeColor: color})}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${invoiceOptions.themeColor === color ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                          style={{backgroundColor: color}}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-3 border-b border-slate-200 pb-2">Toggle Details</label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={invoiceOptions.showSalesman} onChange={(e) => setInvoiceOptions({...invoiceOptions, showSalesman: e.target.checked})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Show Salesman / Route</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={invoiceOptions.showContact} onChange={(e) => setInvoiceOptions({...invoiceOptions, showContact: e.target.checked})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Show Customer Contact Info</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={invoiceOptions.showDiscount} onChange={(e) => setInvoiceOptions({...invoiceOptions, showDiscount: e.target.checked})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Show Discount/Savings Row</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                  <button 
                    onClick={() => {
                      const element = document.getElementById('invoice-preview-container');
                      if (element) {
                        // Dynamically import html2canvas and jsPDF to keep bundle size small when unused
                        import('html2canvas').then((html2canvasModule) => {
                          const html2canvas = html2canvasModule.default;
                          import('jspdf').then((jsPDFModule) => {
                            const jsPDF = jsPDFModule.jsPDF;
                            html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
                              const imgData = canvas.toDataURL('image/png');
                              const pdf = new jsPDF('p', 'mm', 'a4');
                              const pdfWidth = pdf.internal.pageSize.getWidth();
                              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                              pdf.save(`Invoice_${invoiceModalOrder.orderNumber || invoiceModalOrder.id}.pdf`);
                              setInvoiceModalOrder(null);
                            });
                          });
                        });
                      }
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>

              {/* Preview Pane */}
              <div className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center items-start">
                {/* A4 Paper Dimensions scaling roughly */}
                <div id="invoice-preview-container" className="bg-white shadow-sm w-full max-w-[210mm] min-h-[297mm] relative text-slate-800 p-12">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <img src="/logo.png" alt="Company Logo" className="h-16 object-contain mb-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                      <h1 className="text-4xl font-black tracking-tight" style={{ color: invoiceOptions.themeColor }}>INVOICE</h1>
                      <p className="text-slate-500 font-mono text-sm mt-1">{invoiceModalOrder.orderNumber || `#${invoiceModalOrder.id.slice(-6).toUpperCase()}`}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p className="font-bold text-slate-800 mb-1">Company Name L.L.C.</p>
                      <p>123 Business Avenue, Suite 100</p>
                      <p>Metropolis, NY 10001</p>
                      <p className="mt-2">Tel: +1 (555) 019-2838</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-12 border-t border-slate-200 pt-8">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h4>
                      <p className="font-bold text-sm text-slate-800">{invoiceModalOrder.customerName}</p>
                      {invoiceOptions.showContact && (
                        <div className="text-sm text-slate-500 mt-2 space-y-1">
                          <p>Customer ID: {invoiceModalOrder.customerId}</p>
                          <p>Retail Outlet Address / Location</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Details</h4>
                      <div className="text-sm text-slate-600 space-y-1.5">
                        <p className="flex justify-end gap-4"><span className="font-medium">Issue Date:</span> <span className="font-mono">{invoiceModalOrder.date}</span></p>
                        <p className="flex justify-end gap-4"><span className="font-medium">Time:</span> <span className="font-mono">{invoiceModalOrder.time}</span></p>
                        {invoiceOptions.showSalesman && (
                          <p className="flex justify-end gap-4"><span className="font-medium">Sales Rep:</span> <span>{invoiceModalOrder.salespersonName}</span></p>
                        )}
                        <p className="flex justify-end gap-4 pt-2">
                          <span className="font-medium">Status:</span> 
                          <span className="font-bold" style={{ color: invoiceOptions.themeColor }}>{invoiceModalOrder.status}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-left mb-12 border border-slate-200">
                    <thead>
                      <tr className="border-b-2 border-slate-200" style={{ borderColor: invoiceOptions.themeColor }}>
                        <th className="py-3 font-bold text-slate-700 text-sm border border-slate-200">Item Description</th>
                        <th className="py-3 font-bold text-slate-700 text-sm text-center border border-slate-200">Qty</th>
                        <th className="py-3 font-bold text-slate-700 text-sm text-right border border-slate-200">Unit Price</th>
                        <th className="py-3 font-bold text-slate-700 text-sm text-right border border-slate-200">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(invoiceModalOrder.items || []).map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-4 text-sm font-medium text-slate-800 border border-slate-200">{it.productName} <span className="text-xs text-slate-400 font-normal block mt-0.5">{it.productId}</span></td>
                          <td className="py-4 text-sm text-slate-600 text-center font-mono border border-slate-200">{it.qty}</td>
                          <td className="py-4 text-sm text-slate-600 text-right font-mono border border-slate-200">${(it.price || 0).toFixed(2)}</td>
                          <td className="py-4 text-sm font-bold text-slate-800 text-right font-mono border border-slate-200">${((it.qty * (it.price || 0)) || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="w-1/2 ml-auto space-y-3 text-sm">
                    {invoiceOptions.showDiscount && invoiceModalOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Subtotal:</span>
                        <span className="font-mono">${(invoiceModalOrder.totalAmount + (invoiceModalOrder.discount || 0)).toFixed(2)}</span>
                      </div>
                    )}
                    {invoiceOptions.showDiscount && invoiceModalOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-rose-500">
                        <span>Discount/Savings:</span>
                        <span className="font-mono">-${(invoiceModalOrder.discount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm font-black pt-4 border-t-2 border-slate-800">
                      <span>Grand Total:</span>
                      <span className="font-mono" style={{ color: invoiceOptions.themeColor }}>${(invoiceModalOrder.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500 pt-2">
                      <span>Amount Paid:</span>
                      <span className="font-mono">${(invoiceModalOrder.amountPaid || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center font-bold text-slate-800 pt-1">
                      <span>Balance Due:</span>
                      <span className="font-mono">${((invoiceModalOrder.totalAmount || 0) - (invoiceModalOrder.amountPaid || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
                    <p>Thank you for your business. For any inquiries regarding this invoice, please contact our billing department.</p>
                    <p className="mt-1 font-mono">system-generated-receipt-{(new Date()).getTime()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


                    {/* PRODUCT LEDGER */}
          {activeSubTab === 'productLedger' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">Product Ledger</h3>
                    <p className="text-xs text-slate-400">View all products, stock levels, and sales data</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Product Code,Product Name,Category,Price,Stock,Unit,Sold Qty,Returned Qty\n"
                        + processedProductData.map(p => `"${p.code}","${p.name}","${p.category}",${p.price},${p.stock},"${p.unit}",${p.sold},${p.returned}`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `product_ledger_.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search</label>
                    <input type="text" placeholder="Name or code..." value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select value={adminOrderFilter} onChange={(e) => setAdminOrderFilter(e.target.value as any)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="All">All Categories</option>
                      {Array.from(new Set(products.map(p => p.category))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stock Status</label>
                    <select value={adminOrderPaymentFilter} onChange={(e) => setAdminOrderPaymentFilter(e.target.value as any)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="All">All</option>
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Price</label>
                    <input type="number" placeholder="0" value={orderFilterDate} onChange={(e) => setOrderFilterDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => { setOrderSearchQuery(''); setAdminOrderFilter('All'); setAdminOrderPaymentFilter('All'); setNewProdCode(''); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">
                    Clear Filters
                  </button>
                </div>
              </div>
              
              <div className="h-[600px] bg-white rounded-2xl p-4 shadow-sm">
                <SpreadsheetGrid 
                  data={(processedProductData || []).filter(p => {
                    if (!p) return false;
                    if (orderSearchQuery) {
                      const q = orderSearchQuery.toLowerCase();
                      return (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
                    }
                    if (adminOrderFilter !== 'All') return p.category === adminOrderFilter;
                    if (adminOrderPaymentFilter === 'In Stock') return p.stock > 20;
                    if (adminOrderPaymentFilter === 'Low Stock') return p.stock > 0 && p.stock <= 20;
                    if (adminOrderPaymentFilter === 'Out of Stock') return p.stock === 0;
                    if (orderFilterDate) return p.price >= parseFloat(orderFilterDate);
                    return true;
                  })}
                  columns={[
                    { key: 'code', header: 'Product Code', width: 150 },
                    { key: 'name', header: 'Product Name', width: 250 },
                    { key: 'category', header: 'Category', width: 150 },
                    { key: 'price', header: 'Price', width: 100 },
                    { key: 'stock', header: 'Stock', width: 100 },
                    { key: 'unit', header: 'Unit', width: 100 },
                    { key: 'sold', header: 'Sold Qty', width: 100 },
                    { key: 'returned', header: 'Returned Qty', width: 100 }
                  ]}
                />
              </div>
            </div>
          )}
          
{/* CUSTOMER LEDGER */}
          {activeSubTab === 'customerLedger' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">Customer Ledger</h3>
                    <p className="text-xs text-slate-400">View customer balances, orders, and payment history</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Customer,Shop,Opening Balance,Total Orders,Payments Made,Returns,Remaining Balance\n"
                        + processedCustomerData.map(c => `"${c.name}","${c.shopName}",${c.opening},${c.orders},${c.paid},${c.returns},${c.balance}`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `customer_ledger_.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                    <button onClick={() => window.print()} className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date From</label>
                    <input type="date" value={orderFilterDate} onChange={(e) => setOrderFilterDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date To</label>
                    <input type="date" value={orderFilterMonth} onChange={(e) => setOrderFilterMonth(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer</label>
                    <select value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="">All Customers</option>
                      {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => { setOrderFilterDate(''); setOrderFilterMonth(''); setOrderSearchQuery(''); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">
                    Clear Filters
                  </button>
                </div>
              </div>
              
              <div className="h-[600px] bg-white rounded-2xl p-4 shadow-sm">
                <SpreadsheetGrid 
                  title="Customer Ledger" 
                  data={processedCustomerData.filter(c => {
                    if (orderSearchQuery) return c.name === orderSearchQuery;
                    return true;
                  })} 
                  columns={customerColumns} 
                  rowKey={r=>r.id} 
                  searchable={true} 
                  searchKeys={['name','shopName']} 
                />
              </div>
            </div>
          )}

          {/* ORDER HISTORY */}
          {activeSubTab === 'orderHistory' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">Order History</h3>
                    <p className="text-xs text-slate-400">Filter and view all orders with advanced options</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Order Number,Date,Customer,Salesman,Total,Status,Payment Status,Amount Paid\n"
                        + orders.map(o => `"${o.orderNumber || o.id}","${o.date}","${o.customerName}","${o.salespersonName}",${o.totalAmount},"${o.status}","${o.paymentStatus}",${o.amountPaid || 0}`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `order_history_.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date From</label>
                    <input type="date" value={orderFilterDate} onChange={(e) => setOrderFilterDate(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date To</label>
                    <input type="date" value={orderFilterMonth} onChange={(e) => setOrderFilterMonth(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer</label>
                    <select value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="">All Customers</option>
                      {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Salesman</label>
                    <select value={adminOrderSearchText} onChange={(e) => setAdminOrderSearchText(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="">All Salesmen</option>
                      {users.filter(u => u.role === 'SALESPERSON' || u.role === 'SALESMAN').map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select value={adminOrderFilter} onChange={(e) => setAdminOrderFilter(e.target.value as any)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                      <option value="All">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => { setOrderFilterDate(''); setOrderFilterMonth(''); setOrderSearchQuery(''); setAdminOrderSearchText(''); setAdminOrderFilter('All'); setAdminOrderPaymentFilter('All'); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">
                    Clear Filters
                  </button>
                  <div className="flex gap-2 ml-auto">
                    {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map(p => (
                      <button key={p} onClick={() => setAdminOrderPaymentFilter(p as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${adminOrderPaymentFilter === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="h-[600px] bg-white rounded-2xl p-4 shadow-sm">
                <SpreadsheetGrid 
                  title="Order History" 
                  data={orders
                    .filter(ord => ord.status !== 'Draft')
                    .filter(ord => adminOrderFilter === 'All' || ord.status === adminOrderFilter)
                    .filter(ord => {
                      if (orderSearchQuery) return ord.customerName === orderSearchQuery;
                      return true;
                    })
                    .filter(ord => {
                      if (adminOrderSearchText) return ord.salespersonName === adminOrderSearchText;
                      return true;
                    })
                    .filter(ord => {
                      if (orderFilterDate) return ord.date >= orderFilterDate;
                      return true;
                    })
                    .filter(ord => {
                      if (orderFilterMonth) return ord.date <= orderFilterMonth;
                      return true;
                    })
                    .filter(ord => {
                      if (adminOrderPaymentFilter === 'Paid') return ord.paymentStatus === 'Paid';
                      if (adminOrderPaymentFilter === 'Partial') return ord.paymentStatus === 'Partial';
                      if (adminOrderPaymentFilter === 'Unpaid') return ord.paymentStatus === 'Unpaid';
                      return true;
                    })
                    .sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime())
                  } 
                  columns={orderColumns} 
                  rowKey={r=>r.id} 
                  onRowDoubleClick={setSelectedOrder} 
                  searchable={true} 
                  searchKeys={['orderNumber','customerName','salespersonName','status']} 
                />
              </div>
            </div>
          )}

          {/* EXPORT CENTER */}
          {activeSubTab === 'exportCenter' && (<ExportCenter orders={orders} customers={customers} products={products} users={users} />)}

        </main>
      </div>
  );
}




