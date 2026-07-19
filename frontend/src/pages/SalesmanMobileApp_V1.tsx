import React, { useState, useEffect } from 'react';
import { database } from '../lib/firebase';
import { ref, onValue, set, push, get, runTransaction } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import type { Customer, Order, PaymentHistoryItem, Product } from './SalesmanAdmin';
import { DollarSign, User, CheckCircle, Clock, ArrowLeft, LogOut, ChevronRight, Package, Plus, Minus, ShoppingCart, List } from 'lucide-react';

export default function SalesmanMobileApp({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'customers' | 'new_order' | 'collections'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Collections State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');

  // Order State
  const [orderCustomer, setOrderCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [upfrontPayment, setUpfrontPayment] = useState('');

  const currentUser = getAuth().currentUser;

  useEffect(() => {
    const unsubCust = onValue(ref(database, 'customers'), (snap) => {
      setCustomers(snap.exists() ? Object.values(snap.val()) : []);
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
      unsubPay();
      unsubOrd();
      unsubProd();
    };
  }, []);

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    if (amount > selectedCustomer.remainingBalance) {
      alert("Amount cannot exceed the remaining balance due.");
      return;
    }

    const newPaymentRef = push(ref(database, 'sales_payments'));
    const paymentRecord = {
      id: newPaymentRef.key as string,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      date: new Date().toISOString(),
      amountPaid: amount,
      description: description || `Lump sum collection via ${paymentMethod}`,
      collectedBy: currentUser?.email || 'Unknown Salesman',
      status: 'Pending Verification',
      method: paymentMethod
    };

    await set(newPaymentRef, paymentRecord);
    
    // Deduct immediately so the salesman sees the updated balance instantly
    const newBalance = Math.max(0, Number(selectedCustomer.remainingBalance || 0) - amount);
    await set(ref(database, `customers/${selectedCustomer.id}/remainingBalance`), newBalance);

    alert(`Payment of ${amount} SAR submitted for verification.`);
    setPaymentAmount('');
    setDescription('');
    setSelectedCustomer(null);
    setActiveTab('collections');
  };

  const addToCart = (prod: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item => item.product.id === prod.id ? {...item, qty: item.qty + 1} : item);
      }
      return [...prev, {product: prod, qty: 1}];
    });
  };

  const updateCartQty = (prodId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === prodId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? {...item, qty: newQty} : item;
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const orderTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const handleSubmitOrder = async () => {
    if (!orderCustomer) { alert("Please select a customer"); return; }
    if (cart.length === 0) { alert("Cart is empty"); return; }
    
    const upf = parseFloat(upfrontPayment) || 0;
    if (upf > orderTotal) { alert("Payment cannot exceed order total."); return; }

    // Calculate how much advance credit this customer has and can apply to this order
    const existingCredit = Math.max(0, -(Number(orderCustomer.remainingBalance || 0)));
    const creditApplied = Math.min(existingCredit, Math.max(0, orderTotal - upf));
    const totalEffectivePaid = upf + creditApplied;

    // Generate sequential order number (ORD-0001, ORD-0002, ...)
    const counterRef = ref(database, 'counters/orderNumber');
    let orderNum = 1;
    await runTransaction(counterRef, (current) => {
      orderNum = (current || 0) + 1;
      return orderNum;
    });
    const orderNumber = `ORD-${String(orderNum).padStart(4, '0')}`;

    const newOrderRef = push(ref(database, 'sales_orders'));
    const orderId = newOrderRef.key as string;

    const orderRecord = {
      id: orderId,
      orderNumber: orderNumber,
      customerId: orderCustomer.id,
      customerName: orderCustomer.name,
      salespersonId: currentUser?.uid || '',
      salespersonName: currentUser?.email || 'Salesman',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        qty: item.qty,
        price: item.product.price
      })),
      totalAmount: orderTotal,
      status: 'Pending',
      syncStatus: 'SYNCED',
      // Credit applied immediately settles that portion; upf is pending verification
      paymentStatus: totalEffectivePaid >= orderTotal
        ? 'Paid'
        : upf > 0 ? 'Pending Verification' : creditApplied > 0 ? 'Partial' : 'Unpaid',
      amountPaid: creditApplied,         // credit portion settled immediately
      creditApplied: creditApplied,      // track for audit/display
      pendingAmountPaid: upf,
      paymentMethod: paymentMethod,
      isPaymentPendingApproval: upf > 0,
      isStockDeducted: false
    };

    // 1. Create the Order
    await set(newOrderRef, orderRecord);

    // 2. If upfront payment > 0, create a pending collection!
    if (upf > 0) {
      const newPaymentRef = push(ref(database, 'sales_payments'));
      const paymentRecord = {
        id: newPaymentRef.key as string,
        customerId: orderCustomer.id,
        customerName: orderCustomer.name,
        date: new Date().toISOString(),
        amountPaid: upf,
        description: `Upfront payment for ${orderNumber}`,
        orderNumber: orderNumber,
        collectedBy: currentUser?.email || 'Unknown Salesman',
        status: 'Pending Verification',
        method: paymentMethod,
        orderId: orderId
      };
      await set(newPaymentRef, paymentRecord);
    }

    // 3. Update customer's ledger
    // Math.max(0,...) ensures credit is consumed and balance never goes negative here.
    // creditApplied is already factored in because it came from the existing negative balance.
    const newDebt = orderTotal;
    const newBalance = Math.max(0, Number(orderCustomer.remainingBalance || 0) + newDebt - upf - creditApplied);
    await set(ref(database, `customers/${orderCustomer.id}/remainingBalance`), newBalance);

    alert(`Order submitted successfully!${upf > 0 ? ` Payment of ${upf} SAR is Pending Verification.` : ''}`);
    setCart([]);
    setOrderCustomer(null);
    setUpfrontPayment('');
    setActiveTab('customers');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-emerald-600 text-white p-4 flex items-center shadow-md z-10 relative">
        <button onClick={onBack} className="p-2 bg-emerald-700 rounded-full text-white active:bg-emerald-800 mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold leading-tight">Salesman App</h1>
          <p className="text-xs text-emerald-100">{currentUser?.email || 'Sales Rep'}</p>
        </div>
      </header>

      {/* TABS */}
      <div className="flex bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <button 
          onClick={() => setActiveTab('customers')} 
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'customers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          Customers
        </button>
        <button 
          onClick={() => setActiveTab('new_order')} 
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'new_order' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          New Order
        </button>
        <button 
          onClick={() => setActiveTab('collections')} 
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'collections' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}
        >
          Collections
        </button>
      </div>

      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        
        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Customers</h2>
            {customers.length === 0 ? <p className="text-slate-500 text-center py-10">No customers found.</p> : null}
            {customers.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setSelectedCustomer(c); setActiveTab('collections'); }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:scale-95 transition-transform cursor-pointer hover:border-emerald-500"
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {c.shopName || c.storeName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Balance Due</span>
                  <span className={`text-sm font-bold font-mono ${Number(c.remainingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {Number(c.remainingBalance || 0).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NEW ORDER TAB */}
        {activeTab === 'new_order' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            {!orderCustomer ? (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3">1. Select Customer</h3>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {customers.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setOrderCustomer(c)}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 focus:bg-emerald-100 active:scale-95 transition-all"
                    >
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.shopName || c.storeName}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Selected Customer</span>
                    <h3 className="font-bold text-slate-800">{orderCustomer.name}</h3>
                  </div>
                  <button onClick={() => setOrderCustomer(null)} className="text-xs font-bold text-slate-500 underline">Change</button>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-3">2. Add Products</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto pr-1">
                    {products.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 active:scale-95 transition-all flex flex-col justify-between h-24"
                      >
                        <div className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{p.name}</div>
                        <div className="font-mono font-bold text-emerald-600">{Number(p.price || 0).toFixed(2)}</div>
                      </button>
                    ))}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 mt-4">
                      <h4 className="font-bold text-slate-800 text-sm mb-2 flex justify-between">
                        <span>Cart</span>
                        <span>{cart.reduce((a,b)=>a+b.qty,0)} items</span>
                      </h4>
                      <div className="space-y-2 mb-4">
                        {cart.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                            <div className="flex-1 truncate pr-2">
                              <span className="text-sm font-semibold block truncate">{item.product.name}</span>
                              <span className="text-xs text-slate-500 font-mono">{item.product.price} x {item.qty} = {(item.product.price * item.qty).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1 bg-white rounded-lg border shadow-sm"><Minus className="w-4 h-4"/></button>
                              <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                              <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 shadow-sm"><Plus className="w-4 h-4"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-800 text-white p-4 rounded-2xl mb-4 shadow-inner">
                        <span className="font-bold">Total Amount</span>
                        <span className="text-xs font-mono font-bold">{orderTotal.toFixed(2)} SAR</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Upfront Payment (Optional)</label>
                          <input
                            type="number"
                            value={upfrontPayment}
                            onChange={(e) => setUpfrontPayment(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-center text-xs font-mono font-bold text-emerald-700 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        {parseFloat(upfrontPayment) > 0 && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Method</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Bank Cheque">Bank Cheque</option>
                            </select>
                          </div>
                        )}
                        <button
                          onClick={handleSubmitOrder}
                          className="w-full py-4 font-bold text-white bg-emerald-600 rounded-2xl active:bg-emerald-700 shadow-lg flex justify-center items-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" /> Submit Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* COLLECTIONS TAB */}
        {activeTab === 'collections' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            {!selectedCustomer ? (
              <>
                <button 
                  onClick={() => setActiveTab('customers')} // They will select a customer first
                  className="w-full py-4 border-2 border-dashed border-emerald-500 text-emerald-600 font-bold rounded-2xl bg-emerald-50 flex justify-center items-center gap-2 active:bg-emerald-100 transition-colors"
                >
                  <DollarSign className="w-5 h-5" /> Make Lump Sum Collection
                </button>
                <p className="text-center text-xs text-slate-500">
                  Select a customer from the Customers tab to collect a lump sum payment.
                </p>

                <div>
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Your Recent Collections</h2>
                  <div className="space-y-3">
                    {payments.filter(p => p.collectedBy === currentUser?.email).length === 0 ? <p className="text-slate-400 text-xs text-center py-4">No collections yet.</p> : null}
                    {payments.filter(p => p.collectedBy === currentUser?.email).reverse().map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{p.customerName}</h3>
                          <p className="text-xs text-slate-500">{new Date(p.date).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 block">{Number(p.amountPaid || 0).toFixed(2)} SAR</span>
                          {/* @ts-ignore */}
                          {p.status === 'Pending Verification' ? (
                            <span className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1 justify-end mt-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          ) : (
                            <span className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1 justify-end mt-1">
                              <CheckCircle className="w-3 h-3" /> Confirmed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-200">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 text-center">
                  <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                  <p className="text-sm text-slate-500">{selectedCustomer.shopName || selectedCustomer.storeName}</p>
                  <div className="mt-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <span className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Balance Due</span>
                    <span className="text-2xl font-bold font-mono text-rose-700">{Number(selectedCustomer.remainingBalance || 0).toFixed(2)} SAR</span>
                  </div>
                </div>

                <form onSubmit={handleCollectPayment} className="space-y-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount to Collect (SAR)</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="1"
                        max={selectedCustomer.remainingBalance}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full text-center text-2xl font-mono font-bold text-slate-800 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Bank Cheque">Bank Cheque</option>
                        <option value="POS Card">POS Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Note / Description</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                        placeholder="Optional details..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer(null); setActiveTab('collections'); }}
                      className="flex-1 py-4 font-bold text-slate-600 bg-slate-200 rounded-2xl active:bg-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-4 font-bold text-white bg-emerald-600 rounded-2xl active:bg-emerald-700 shadow-lg shadow-emerald-600/30 flex justify-center items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Submit Collection
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
