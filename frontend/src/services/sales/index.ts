import { database } from '../../lib/firebase';
import { ref, push } from 'firebase/database';
import type { Customer, Product } from '@/types/SalesmanAdmin';
import { offlineSyncEngine } from '../OfflineSyncEngine';
import { eventBus } from '../core/EventBus';
import { BusinessEventType } from '../core/EventTypes';
import type { BusinessEvent } from '../core/EventTypes';

export const salesService = {
  initOfflineSync() {
    offlineSyncEngine.registerHandler('sales_submitOrder', async (payload: any) => {
      await this.executeSubmitOrder(payload);
    });
    offlineSyncEngine.registerHandler('sales_submitPayment', async (payload: any) => {
      await this.executeSubmitPayment(payload);
    });
  },

  validatePayment(amount: number, customer: Customer) {
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Enter a valid amount.");
    }
    if (amount > customer.remainingBalance) {
      throw new Error("Amount cannot exceed the remaining balance due.");
    }
  },

  validateOrder(cart: { product: Product, qty: number }[], upfrontPayment: number) {
    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }
    const orderTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    if (upfrontPayment > orderTotal) {
      throw new Error("Payment cannot exceed order total.");
    }
    return orderTotal;
  },

  async submitPayment(
    customer: Customer,
    amount: number,
    paymentMethod: string,
    description: string,
    salesmanEmail: string
  ): Promise<void> {
    this.validatePayment(amount, customer);
    
    const payload = {
      customer,
      amount,
      paymentMethod,
      description,
      salesmanEmail
    };

    offlineSyncEngine.queueAction('sales_submitPayment', payload);
  },

  async executeSubmitPayment(data: any): Promise<void> {
    const { customer, amount, paymentMethod, description, salesmanEmail } = data;
    const newPaymentRef = push(ref(database, 'sales_payments'));
    
    const paymentRecord = {
      id: newPaymentRef.key as string,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString(),
      amountPaid: amount,
      description: description || `Field payment collection via ${paymentMethod}`,
      collectedBy: salesmanEmail,
      status: 'Pending Verification',
      method: paymentMethod
    };

    // Dispatch EventBus rather than updating DB directly
    await eventBus.dispatch(BusinessEventType.PAYMENT_PENDING, paymentRecord, customer.id);
  },

  _lastOrderHash: '',
  _lastOrderTime: 0,

  async submitOrder(
    customer: Customer,
    cart: { product: Product, qty: number }[],
    upfrontPayment: number,
    paymentMethod: string,
    salesmanId: string,
    salesmanEmail: string
  ): Promise<void> {
    const orderTotal = this.validateOrder(cart, upfrontPayment);

    const orderHash = `${customer.id}_${orderTotal}_${cart.length}`;
    const now = Date.now();
    if (this._lastOrderHash === orderHash && (now - this._lastOrderTime) < 10000) {
      throw new Error("Duplicate order submission prevented. Please wait before submitting again.");
    }
    this._lastOrderHash = orderHash;
    this._lastOrderTime = now;

    const payload = {
      customer,
      cart,
      upfrontPayment,
      paymentMethod,
      salesmanId,
      salesmanEmail,
      orderTotal
    };

    offlineSyncEngine.queueAction('sales_submitOrder', payload);
  },

  async executeSubmitOrder(data: any): Promise<void> {
    const { customer, cart, upfrontPayment, paymentMethod, salesmanId, salesmanEmail, orderTotal } = data;
    
    const newOrderRef = push(ref(database, 'sales_orders'));
    const orderId = newOrderRef.key as string;

    const orderRecord = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.name,
      salespersonId: salesmanId,
      salespersonName: salesmanEmail,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items: cart.map((item: any) => ({
        productId: item.product.id,
        productName: item.product.name,
        qty: item.qty,
        price: item.product.price
      })),
      totalAmount: orderTotal,
      status: 'Pending',
      paymentStatus: upfrontPayment > 0 ? 'Pending Verification' : 'Unpaid',
      amountPaid: 0,
      pendingAmountPaid: upfrontPayment,
      paymentMethod: paymentMethod,
      isPaymentPendingApproval: upfrontPayment > 0,
      isStockDeducted: false
    };

    // Dispatch EventBus rather than updating DB directly
    await eventBus.dispatch(BusinessEventType.ORDER_CREATED, orderRecord, salesmanId);
  }
};

/**
 * Register Sales Event Listeners
 */
eventBus.subscribe(BusinessEventType.ORDER_CREATED, async (event: BusinessEvent) => {
  const order = event.payload;
  const updates: Record<string, any> = {};
  
  // 1. Create the Order
  updates[`sales_orders/${order.id}`] = order;

  // 2. If upfront payment > 0, create a pending collection!
  if (order.pendingAmountPaid > 0) {
    const newPaymentRef = push(ref(database, 'sales_payments'));
    const paymentRecord = {
      id: newPaymentRef.key as string,
      customerId: order.customerId,
      customerName: order.customerName,
      date: new Date().toISOString(),
      amountPaid: order.pendingAmountPaid,
      description: `Upfront payment for Order #${order.id.substring(order.id.length-6)}`,
      collectedBy: order.salespersonName,
      status: 'Pending Verification',
      method: order.paymentMethod,
      orderId: order.id
    };
    updates[`sales_payments/${newPaymentRef.key}`] = paymentRecord;
  }

  return updates;
});

eventBus.subscribe(BusinessEventType.PAYMENT_PENDING, async (event: BusinessEvent) => {
  const payment = event.payload;
  const updates: Record<string, any> = {};
  updates[`sales_payments/${payment.id}`] = payment;
  return updates;
});
