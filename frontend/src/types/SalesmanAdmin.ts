export type UserRole = 'ADMIN' | 'SALESPERSON';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  territory?: string;
  password?: string;
  allowPriceOverride?: boolean;
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
  code?: string;
  productName: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
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

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL_BALANCE' | 'CANCELLATION' | 'CREDIT_NOTE';
  amount: number;
  description: string;
  referenceId?: string;
}
