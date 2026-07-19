import os

code = """import { database, firebaseConfig } from '../../../lib/firebase';
import { ref, get, set, remove, push, update } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { User, Product, Customer, Order, PaymentHistoryItem, CustomerLedgerEntry } from '../../../types/SalesmanAdmin';

const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);

export const fbService = {
  async addUser(u: User, pass: string) {
    let uid = u.id || Date.now().toString();
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, u.email, pass);
      uid = userCredential.user.uid;
    } catch (err: any) {
      if (err.code !== 'auth/email-already-in-use') {
        throw err;
      }
      uid = u.email.toLowerCase().replace(/[.#$\\[\\]]/g, '_');
    }
    
    u.id = uid;
    await set(ref(database, `sales_users/${uid}`), u);
    
    if (u.email) {
      const userKey = u.email.toLowerCase().replace(/[.#$\\[\\]]/g, '_');
      const uRef = ref(database, `users/${userKey}`);
      const snapshot = await get(uRef);
      if (!snapshot.exists()) {
        await set(uRef, {
          email: u.email,
          password: pass,
          role: 'pending',
          allowedApps: { salesman: true }
        });
      }
    }
  },

  async updateUser(u: User) {
    await set(ref(database, `sales_users/${u.id}`), u);
  },

  async deleteUser(id: string) {
    await remove(ref(database, `sales_users/${id}`));
  },

  async addProduct(p: Product) {
    p.id = p.id || Date.now().toString();
    await set(ref(database, `products/${p.id}`), p);
  },

  async updateProduct(p: Product) {
    await set(ref(database, `products/${p.id}`), p);
  },

  async deleteProduct(id: string) {
    await remove(ref(database, `products/${id}`));
  },

  async addCustomer(c: Customer) {
    c.id = c.id || Date.now().toString();
    const balance = c.remainingBalance;
    c.remainingBalance = 0; // We keep it 0 as ledger will calculate it
    await set(ref(database, `customers/${c.id}`), c);

    if (balance && balance !== 0) {
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
    }
  },

  async updateCustomer(c: Customer) {
    // We only update the basic info here, not balance (which is dynamically calculated from ledgers)
    const originalBalance = c.remainingBalance;
    c.remainingBalance = 0;
    await set(ref(database, `customers/${c.id}`), c);
  },

  async deleteCustomer(id: string) {
    await remove(ref(database, `customers/${id}`));
    await remove(ref(database, `customer_ledgers/${id}`));
  },

  async updateOrderStatus(orderId: string, status: string) {
    await set(ref(database, `sales_orders/${orderId}/status`), status);
  },

  async deductStock(order: Order, products: Product[]) {
    const updates: Record<string, any> = {};
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updates[`products/${product.id}/stock`] = Math.max(0, Number(product.stock) - Number(item.qty));
      }
    }
    updates[`sales_orders/${order.id}/isStockDeducted`] = true;
    await update(ref(database, '/'), updates);
  },

  async processPayment(order: Order, amount: number, method: string) {
    const newPayment = { amount, method, date: new Date().toISOString() };
    const currentPayments = order.payments || [];
    const updatedPayments = [...currentPayments, newPayment];
    
    await set(ref(database, `sales_orders/${order.id}/payments`), updatedPayments);
    
    const totalPaid = Number(order.amountPaid || 0) + Number(amount);
    
    if (totalPaid >= Number(order.totalAmount)) {
      await set(ref(database, `sales_orders/${order.id}/paymentStatus`), 'Paid');
    } else {
      await set(ref(database, `sales_orders/${order.id}/paymentStatus`), 'Partial');
    }
    
    await set(ref(database, `sales_orders/${order.id}/amountPaid`), totalPaid);
    await set(ref(database, `sales_orders/${order.id}/paymentMethod`), method);

    if (order.customerId) {
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
    }
  },

  async confirmFieldPayment(payment: PaymentHistoryItem & { orderId?: string }, orders: Order[]) {
    await set(ref(database, `sales_payments/${payment.id}/status`), 'Confirmed');

    if (payment.orderId) {
      const order = orders.find(o => o.id === payment.orderId);
      if (order) {
        const newAmountPaid = Number(order.amountPaid || 0) + Number(payment.amountPaid || 0);
        const newPaymentStatus = newAmountPaid >= order.totalAmount ? 'Paid' : 'Partial';
        await set(ref(database, `sales_orders/${payment.orderId}/amountPaid`), newAmountPaid);
        await set(ref(database, `sales_orders/${payment.orderId}/paymentStatus`), newPaymentStatus);
        await set(ref(database, `sales_orders/${payment.orderId}/isPaymentPendingApproval`), false);
      }
    }
  }
};
"""

with open(r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\services\firebaseService.ts", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated firebaseService.ts")
