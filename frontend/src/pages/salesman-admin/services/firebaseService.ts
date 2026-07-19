import { database, firebaseConfig } from '../../../lib/firebase';
import { ref, get, set, remove, push, update } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { eventBus } from '../../../services/core/EventBus';
import { BusinessEventType } from '../../../services/core/EventTypes';
import type {  User, Product, Customer, Order, PaymentHistoryItem, CustomerLedgerEntry  } from '../../../types/SalesmanAdmin';

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
      uid = u.email.toLowerCase().replace(/[.#$\[\]]/g, '_');
    }
    
    u.id = uid;
    await set(ref(database, `sales_users/${uid}`), u);
    
    if (u.email) {
      const userKey = u.email.toLowerCase().replace(/[.#$\[\]]/g, '_');
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
      // Legacy initial balance migration removed for EventBus
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



  async confirmFieldPayment(payment: PaymentHistoryItem & { orderId?: string }, orders: Order[]) {
    await set(ref(database, `sales_payments/${payment.id}/status`), 'Confirmed');

    // Append ledger entry only upon confirmation
    if (payment.customerId) {
      // EventBus handles payment on PAYMENT_VERIFIED
    }

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
