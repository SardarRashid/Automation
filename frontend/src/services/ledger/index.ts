import { ref, push } from 'firebase/database';
import { database } from '../../lib/firebase';
import { BusinessEventType } from '../core/EventTypes';
import type { BusinessEvent } from '../core/EventTypes';
import { eventBus } from '../core/EventBus';
import type { Customer, CustomerLedgerEntry } from '@/types/SalesmanAdmin';

export const ledgerService = {
  computeCustomerBalance(customer: Customer, customerLedgers: Record<string, CustomerLedgerEntry> | undefined): number {
    const entries = customerLedgers ? Object.values(customerLedgers) : [];
    let totalCents = 0;
    
    const hasInitialBalance = entries.some(e => e.type === 'INITIAL_BALANCE');
    if (!hasInitialBalance && customer.remainingBalance) {
      totalCents += Math.round(Number(customer.remainingBalance) * 100);
    }
    
    if (entries.length > 0) {
      totalCents += entries.reduce((sum, entry) => sum + Math.round(Number(entry.amount) * 100), 0);
    }
    
    return totalCents / 100;
  },

  applyDynamicBalances(customers: Customer[], allLedgers: Record<string, Record<string, CustomerLedgerEntry>>): Customer[] {
    return customers.map(c => {
      const balance = this.computeCustomerBalance(c, allLedgers[c.id]);
      return { ...c, remainingBalance: balance };
    });
  }
};

/**
 * Register Ledger Event Listeners
 */
eventBus.subscribe(BusinessEventType.ORDER_DELIVERED, async (event: BusinessEvent) => {
  const order = event.payload;
  // Create an invoice entry for the new order (increases debt)
  const newRef = push(ref(database, `customer_ledgers/${order.customerId}`));
  const entry: CustomerLedgerEntry = {
    id: newRef.key!,
    customerId: order.customerId,
    date: new Date().toISOString(),
    type: 'INVOICE',
    amount: order.totalAmount, // Invoices increase debt
    description: `Invoice for Order #${order.id}`,
    referenceId: order.id
  };
  
  return {
    [`customer_ledgers/${order.customerId}/${newRef.key}`]: entry
  };
});

eventBus.subscribe(BusinessEventType.PAYMENT_VERIFIED, async (event: BusinessEvent) => {
  const payment = event.payload;
  const newRef = push(ref(database, `customer_ledgers/${payment.customerId}`));
  const entry: CustomerLedgerEntry = {
    id: newRef.key!,
    customerId: payment.customerId,
    date: new Date().toISOString(),
    type: 'PAYMENT',
    amount: -Math.abs(payment.amount), // Payments decrease debt
    description: `Payment verified (${payment.paymentMethod})`,
    referenceId: payment.id
  };
  
  return {
    [`customer_ledgers/${payment.customerId}/${newRef.key}`]: entry
  };
});

eventBus.subscribe(BusinessEventType.ORDER_CANCELLED, async (event: BusinessEvent) => {
  const order = event.payload;
  const newRef = push(ref(database, `customer_ledgers/${order.customerId}`));
  const entry: CustomerLedgerEntry = {
    id: newRef.key!,
    customerId: order.customerId,
    date: new Date().toISOString(),
    type: 'CREDIT_NOTE',
    amount: -Math.abs(order.totalAmount), // Reverses the invoice
    description: `Credit Note for Cancelled Order #${order.id}`,
    referenceId: order.id
  };
  
  return {
    [`customer_ledgers/${order.customerId}/${newRef.key}`]: entry
  };
});
