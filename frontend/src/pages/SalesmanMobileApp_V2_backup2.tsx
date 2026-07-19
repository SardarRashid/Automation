import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { database, storage } from '../lib/firebase'; import { ref, onValue, set, push, runTransaction, get } from 'firebase/database'; import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; import { getAuth, signOut } from 'firebase/auth'; import type { Customer, Order, PaymentHistoryItem, Product } from './SalesmanAdmin'; import {    DollarSign, User, Users, LogOut, ChevronRight, Plus, Minus, ShoppingCart, History, PhoneCall, FileText, Search, Star, Clock, RotateCcw, X, Filter, Camera, UploadCloud, CheckCircle, Clock as ClockIcon, RefreshCw, AlertTriangle, Loader2, Home, Package, FileEdit, Bell, ChevronLeft, Calendar, BadgeCheck, MoreVertical, Trash2, CornerDownLeft, FileWarning } from 'lucide-react';

// --- CONTEXTS ---
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: string; type: ToastType; title: string; message?: string; }
interface ToastContextType { addToast: (type: ToastType, title: string, message?: string) => void; }

const ToastContext = createContext<ToastContextType | null>(null);
const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// --- MAIN APP COMPONENT ---
export default function SalesmanMobileApp_V2({ onBack }: { onBack: () => void }) {
  const currentUser = getAuth().currentUser;

  const [activeTab, setActiveTab] = useState<'home' | 'customers' | 'orders' | 'drafts' | 'profile'>('home');
  const [subView, setSubView] = useState<'none' | 'customer_detail' | 'new_order' | 'collect_payment' | 'view_ledger' | 'view_history'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // LocalStorage Preferences
  const [favCustomers, setFavCustomers] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('fav_customers') || '[]'); } catch { return []; } });
  const [recentCustomers, setRecentCustomers] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('recent_customers') || '[]'); } catch { return []; } });
  const [manualFavProducts, setManualFavProducts] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('fav_products') || '[]'); } catch { return []; } });
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [upfrontPayment, setUpfrontPayment] = useState('');
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [paymentPhoto, setPaymentPhoto] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; title: string; message: string; type: 'danger'|'warning'|'info'; onConfirm: () => void; confirmLabel?: string} | null>(null);
  const [actionDialog, setActionDialog] = useState<{isOpen: boolean; title: string; message: string; type: 'success'|'error'|'info'|'warning'; actions: {label: string, onClick: () => void, primary?: boolean}[]} | null>(null);

  useEffect(() => {
    let loaded = 0;
    const checkLoaded = () => { loaded++; if (loaded >= 4) setIsLoading(false); };
    const unsubCust = onValue(ref(database, 'customers'), (snap) => { setCustomers(snap.exists() ? Object.values(snap.val()) : []); checkLoaded(); });
    const unsubPay = onValue(ref(database, 'sales_payments'), (snap) => { setPayments(snap.exists() ? Object.values(snap.val()) : []); checkLoaded(); });
    const unsubOrd = onValue(ref(database, 'sales_orders'), (snap) => { setOrders(snap.exists() ? Object.values(snap.val()) : []); checkLoaded(); });
    const unsubProd = onValue(ref(database, 'products'), (snap) => { setProducts(snap.exists() ? Object.values(snap.val()) : []); checkLoaded(); });
    return () => { unsubCust(); unsubPay(); unsubOrd(); unsubProd(); };
  }, []);

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  const handleConfirm = (title: string, message: string, type: 'danger'|'warning'|'info', onConfirm: () => void, confirmLabel = 'Confirm') => {
    setConfirmDialog({ isOpen: true, title, message, type, onConfirm, confirmLabel });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const [drafts, setDrafts] = useState<any[]>([]);
  
  useEffect(() => {
    const loadDrafts = () => {
      const allDrafts = [];
      for(let i=0; i<localStorage.length; i++) {
        const key = localStorage.key(i);
        if(key?.startsWith('draft_order_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            allDrafts.push({ key, ...data });
          } catch(e){}
        }
      }
      setDrafts(allDrafts.sort((a,b) => b.updatedAt - a.updatedAt));
    };
    loadDrafts();
    const interval = setInterval(loadDrafts, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCustomer && cart.length > 0 && subView === 'new_order') {
      const draftKey = `draft_order_${selectedCustomer.id}`;
      localStorage.setItem(draftKey, JSON.stringify({ customerId: selectedCustomer.id, cartData: cart, updatedAt: Date.now() }));
    } else if (selectedCustomer && cart.length === 0 && subView === 'new_order') {
      localStorage.removeItem(`draft_order_${selectedCustomer.id}`);
    }
  }, [cart, selectedCustomer, subView]);

  const recordRecentCustomer = (id: string) => {
    setRecentCustomers(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 10);
      localStorage.setItem('recent_customers', JSON.stringify(next));
      return next;
    });
  };

  const selectCustomerAndRecord = (c: Customer) => {
    setSelectedCustomer(c);
    recordRecentCustomer(c.id);
    setSubView('customer_detail');
  };

  const loadDraft = (draft: any) => {
    const cust = customers.find(c => c.id === draft.customerId);
    if(cust) {
      setSelectedCustomer(cust);
      setCart(draft.cartData);
      setSubView('new_order');
      setActiveTab('customers');
    }
  };

  const deleteDraft = (key: string) => {
    handleConfirm('Delete Draft', 'Are you sure you want to discard this draft order?', 'danger', () => {
      localStorage.removeItem(key);
      setDrafts(prev => prev.filter(d => d.key !== key));
      addToast('success', 'Draft Deleted');
    }, 'Delete');
  };

  const postDraftDirectly = (draft: any) => {
    const cust = customers.find(c => c.id === draft.customerId);
    if(!cust) return;
    
    handleConfirm('Post Order', `Post draft order for ${cust.name}?`, 'info', async () => {
      await processOrderSubmission(cust, draft.cartData, 0);
      localStorage.removeItem(draft.key);
      setDrafts(prev => prev.filter(d => d.key !== draft.key));
    }, 'Post');
  };

  const toggleFavCustomer = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setFavCustomers(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fav_customers', JSON.stringify(next));
      return next;
    });
  };

  const toggleFavProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setManualFavProducts(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fav_products', JSON.stringify(next));
      return next;
    });
  };

  const addToCart = (prod: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) return prev.map(item => item.product.id === prod.id ? {...item, qty: item.qty + 1} : item);
      return [...prev, {product: prod, qty: 1}];
    });
  };

  const updateCartQty = (prodId: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.product.id === prodId) {
          return {...item, qty: item.qty + delta, _raw: undefined};
        }
        return item;
      }).filter(item => item.qty > 0)
    );
  };

  const setCartQtyDirect = (prodId: string, val: string) => {
    setCart(prev => prev.map(item => {
        if (item.product.id === prodId) {
          // Allow empty string temporarily for typing
          if (val === '') return {...item, qty: 0, _raw: ''};
          const num = parseInt(val);
          return {...item, qty: isNaN(num) ? 0 : num, _raw: val};
        }
        return item;
      }) // We don't filter here so they can delete and type a new number without the input disappearing!
    );
  };
  
  const removeCartItem = (prodId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== prodId));
  };

  const orderTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const processOrderSubmission = async (cust: Customer, cartItems: any[], upfAmount: number) => {
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    const existingCredit = Math.max(0, -(Number(cust.remainingBalance || 0)));
    const creditApplied = Math.min(existingCredit, Math.max(0, total - upfAmount));
    const totalEffectivePaid = upfAmount + creditApplied;

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
      customerId: cust.id,
      customerName: cust.name,
      salespersonId: currentUser?.uid || '',
      salespersonName: currentUser?.email || 'Salesman',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        qty: item.qty,
        price: item.product.price
      })),
      totalAmount: total,
      status: 'Pending Approval',
      syncStatus: 'SYNCED',
      paymentStatus: totalEffectivePaid >= total ? 'Paid' : upfAmount > 0 ? 'Pending Verification' : creditApplied > 0 ? 'Partial' : 'Unpaid',
      amountPaid: creditApplied,         
      creditApplied: creditApplied,      
      pendingAmountPaid: upfAmount,
      paymentMethod: paymentMethod,
      isPaymentPendingApproval: upfAmount > 0,
      isStockDeducted: false
    };

    try {
      await set(newOrderRef, orderRecord);

      if (upfAmount > 0) {
        const newPaymentRef = push(ref(database, 'sales_payments'));
        const paymentRecord = {
          id: newPaymentRef.key as string,
          customerId: cust.id,
          customerName: cust.name,
          date: new Date().toISOString(),
          amountPaid: upfAmount,
          description: `Upfront payment for ${orderNumber}`,
          orderNumber: orderNumber,
          collectedBy: currentUser?.email || 'Unknown Salesman',
          status: 'Pending Verification',
          method: paymentMethod,
          orderId: orderId
        };
        await set(newPaymentRef, paymentRecord);
      }

      const newBalance = Number(cust.remainingBalance || 0) + total - creditApplied - upfAmount;
      await set(ref(database, `customers/${cust.id}/remainingBalance`), newBalance);

      // Save recent ordered products globally
      const recentProds = JSON.parse(localStorage.getItem('recent_products') || '[]');
      const newlyOrderedIds = cartItems.map(i => i.product.id);
      const updatedRecentProds = [...newlyOrderedIds, ...recentProds.filter((id: string) => !newlyOrderedIds.includes(id))].slice(0, 20);
      localStorage.setItem('recent_products', JSON.stringify(updatedRecentProds));

      return orderNumber;
    } catch (err) {
      throw err;
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedCustomer) { addToast('error', 'Select a customer'); return; }
    if (cart.filter((i:any)=>i.qty>0).length === 0) { addToast('error', 'Cart is empty'); return; }
    
    handleConfirm('Post Order', `Submit order for ${selectedCustomer.name}? Total: ${orderTotal.toFixed(2)} SAR`, 'info', async () => {
      const upf = parseFloat(upfrontPayment) || 0;
      if (upf > orderTotal) { addToast('error', 'Payment cannot exceed order total.'); return; }

      try {
        const orderNumber = await processOrderSubmission(selectedCustomer, cart.filter((i:any)=>i.qty>0), upf);
        localStorage.removeItem(`draft_order_${selectedCustomer.id}`);
        setCart([]);
        setUpfrontPayment('');
        setSubView('none');

        setActionDialog({
          isOpen: true,
          title: 'Order Posted Successfully',
          message: `Order ${orderNumber} has been sent to admin for approval.`,
          type: 'success',
          actions: [
            { label: 'View Pending Orders', onClick: () => { setActiveTab('orders'); setSubView('none'); setActionDialog(null); }, primary: true },
            { label: 'Create New Order', onClick: () => { setActiveTab('customers'); setSubView('none'); setActionDialog(null); } },
            { label: 'Back to Home', onClick: () => { setActiveTab('home'); setSubView('none'); setActionDialog(null); } }
          ]
        });
      } catch (err) {
        addToast('error', 'Failed to save order. Network error.');
      }
    }, 'Post Order');
  };

  const handleSaveDraft = () => {
    addToast('success', 'Draft Saved', 'You can resume editing from the Drafts tab.');
    setSubView('none');
    setActionDialog({
      isOpen: true,
      title: 'Draft Saved',
      message: 'Your draft has been saved locally.',
      type: 'success',
      actions: [
        { label: 'Continue Editing', onClick: () => { setActionDialog(null); }, primary: true },
        { label: 'Back to Home', onClick: () => { setActiveTab('home'); setSubView('none'); setActionDialog(null); } }
      ]
    });
  };

  const handleCollectPayment = async () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) { addToast('error', 'Invalid amount'); return; }
    if (amount > selectedCustomer.remainingBalance) { addToast('warning', 'Amount exceeds remaining balance.'); return; }

    handleConfirm('Submit Payment', `Collect ${amount} SAR from ${selectedCustomer.name}?`, 'info', async () => {
      setIsSubmittingPayment(true);
      try {
        let photoUrl = '';
        if (paymentPhoto) {
          const fileRef = storageRef(storage, `payment_proofs/${Date.now()}_${paymentPhoto.name}`);
          await uploadBytes(fileRef, paymentPhoto);
          photoUrl = await getDownloadURL(fileRef);
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
          method: paymentMethod,
          photoUrl: photoUrl
        };

        await set(newPaymentRef, paymentRecord);
        const newBalance = Math.max(0, Number(selectedCustomer.remainingBalance || 0) - amount);
        await set(ref(database, `customers/${selectedCustomer.id}/remainingBalance`), newBalance);

        setPaymentAmount('');
        setDescription('');
        setPaymentPhoto(null);
        setSubView('none');
        
        setActionDialog({
          isOpen: true,
          title: 'Payment Submitted',
          message: 'Payment sent for supervisor approval.',
          type: 'success',
          actions: [
            { label: 'Collect Another', onClick: () => { setActiveTab('customers'); setSubView('none'); setActionDialog(null); }, primary: true },
            { label: 'Back to Home', onClick: () => { setActiveTab('home'); setSubView('none'); setActionDialog(null); } }
          ]
        });
      } catch (err) {
        addToast('error', 'Payment failed.');
      } finally {
        setIsSubmittingPayment(false);
      }
    });
  };

  const repeatOrder = (order: Order) => {
    const cust = customers.find(c => c.id === order.customerId);
    if(!cust) { addToast('error', 'Customer not found'); return; }
    const newCart = order.items.map(i => {
      const p = products.find(prod => prod.id === i.productId);
      return {
        product: p || { id: i.productId, name: i.productName, price: i.price, category: '', unit: '', currentStock: 0, lowStockThreshold: 0, image: '', barcode: '', sku: '' },
        qty: i.qty
      };
    });
    setSelectedCustomer(cust);
    setCart(newCart);
    setSubView('new_order');
    setActiveTab('customers');
    addToast('success', 'Order Copied to Cart');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Loading App...</h2>
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white shadow-sm z-30 flex-none sticky top-0 border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border-2 border-blue-200" onClick={() => setActiveTab('profile')}>
                {currentUser?.email?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 leading-tight">{currentUser?.email?.split('@')[0] || 'Salesman'}</h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Online Sync</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-medium hidden sm:block">{new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</span>
              <button className="text-slate-400 hover:text-slate-600 relative">
                <Bell className="w-5 h-5" />
                {drafts.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => addToast('info', 'More options coming soon')}>
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* PULL TO REFRESH LOADER */}
        {isRefreshing && (
          <div className="absolute top-16 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="bg-white rounded-full p-2 shadow-lg animate-bounce">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative pb-20" onTouchMove={(e) => {
          if (e.currentTarget.scrollTop <= 0 && e.nativeEvent.touches[0].clientY > 150 && !isRefreshing) handleRefresh();
        }}>
          {subView !== 'none' ? (
            <SubViews 
              subView={subView} setSubView={setSubView} selectedCustomer={selectedCustomer} customers={customers} products={products} orders={orders} payments={payments}
              cart={cart} setCart={setCart} upfrontPayment={upfrontPayment} setUpfrontPayment={setUpfrontPayment} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount}
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} description={description} setDescription={setDescription} paymentPhoto={paymentPhoto}
              setPaymentPhoto={setPaymentPhoto} isSubmittingPayment={isSubmittingPayment} handleCollectPayment={handleCollectPayment} handleSubmitOrder={handleSubmitOrder}
              addToCart={addToCart} updateCartQty={updateCartQty} setCartQtyDirect={setCartQtyDirect} removeCartItem={removeCartItem} orderTotal={orderTotal} manualFavProducts={manualFavProducts} toggleFavProduct={toggleFavProduct}
              repeatOrder={repeatOrder} handleSaveDraft={handleSaveDraft}
            />
          ) : (
            <MainTabs 
              activeTab={activeTab} setActiveTab={setActiveTab} customers={customers} orders={orders} payments={payments} drafts={drafts}
              favCustomers={favCustomers} recentCustomers={recentCustomers} toggleFavCustomer={toggleFavCustomer} selectCustomerAndRecord={selectCustomerAndRecord}
              loadDraft={loadDraft} deleteDraft={deleteDraft} postDraftDirectly={postDraftDirectly} repeatOrder={repeatOrder} onBack={onBack}
            />
          )}
        </main>

        {/* BOTTOM NAV */}
        {subView === 'none' && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
              <NavItem icon={<Home />} label="Home" isActive={activeTab === 'home' && subView === 'none'} onClick={() => {setActiveTab('home'); setSubView('none');}} />
              <NavItem icon={<Users />} label="Customers" isActive={activeTab === 'customers'} onClick={() => {setActiveTab('customers'); setSubView('none');}} />
              <NavItem icon={<Package />} label="Orders" isActive={activeTab === 'orders'} onClick={() => {setActiveTab('orders'); setSubView('none');}} />
              <NavItem icon={<FileEdit />} label="Drafts" isActive={activeTab === 'drafts'} badge={drafts.length} onClick={() => {setActiveTab('drafts'); setSubView('none');}} />
              <NavItem icon={<User />} label="Profile" isActive={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); setSubView('none');}} />
            </div>
          </nav>
        )}

        {/* TOASTS */}
        <div className="fixed top-16 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
          {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border w-full max-w-sm animate-in fade-in slide-in-from-top-5 pointer-events-auto transition-all ${
              t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {t.type === 'info' && <BadgeCheck className="w-5 h-5 text-blue-500" />}
              <div className="flex-1">
                <p className="font-bold text-sm">{t.title}</p>
                {t.message && <p className="text-xs opacity-80 mt-0.5">{t.message}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* ACTION DIALOG */}
        {actionDialog?.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                  actionDialog.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  actionDialog.type === 'error' ? 'bg-red-100 text-red-600' :
                  actionDialog.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {actionDialog.type === 'success' && <CheckCircle className="w-8 h-8" />}
                  {actionDialog.type === 'error' && <AlertTriangle className="w-8 h-8" />}
                  {actionDialog.type === 'warning' && <AlertTriangle className="w-8 h-8" />}
                  {actionDialog.type === 'info' && <BadgeCheck className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{actionDialog.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{actionDialog.message}</p>
                <div className="space-y-2">
                  {actionDialog.actions.map((act, i) => (
                    <button key={i} onClick={act.onClick} className={`w-full py-3.5 rounded-xl font-bold transition-all ${act.primary ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-700 active:bg-slate-200'}`}>
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM DIALOG */}
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  confirmDialog.type === 'danger' ? 'bg-red-100 text-red-600' :
                  confirmDialog.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {confirmDialog.type === 'danger' ? <AlertTriangle className="w-6 h-6" /> :
                   confirmDialog.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <BadgeCheck className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
                <p className="text-slate-500 text-sm">{confirmDialog.message}</p>
              </div>
              <div className="flex border-t border-slate-100">
                <button onClick={() => setConfirmDialog(null)} className="flex-1 py-4 text-slate-500 font-bold active:bg-slate-50">Cancel</button>
                <div className="w-px bg-slate-100"></div>
                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className={`flex-1 py-4 font-bold active:bg-slate-50 ${
                  confirmDialog.type === 'danger' ? 'text-red-600' : 'text-blue-600'
                }`}>{confirmDialog.confirmLabel || 'Confirm'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

// --- SUB COMPONENTS ---

function NavItem({ icon, label, isActive, badge, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full gap-1 relative transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <span className={`text-[10px] font-semibold ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      {!!badge && badge > 0 && <span className="absolute top-1 right-1/4 translate-x-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">{badge}</span>}
    </button>
  );
}

function MainTabs({ activeTab, setActiveTab, customers, orders, payments, drafts, favCustomers, recentCustomers, toggleFavCustomer, selectCustomerAndRecord, loadDraft, deleteDraft, postDraftDirectly, repeatOrder, onBack }: any) {
  const currentUser = getAuth().currentUser;
  const myOrders = useMemo(() => orders.filter((o:any) => o.salespersonId === currentUser?.uid || o.salespersonName === currentUser?.email).sort((a:any, b:any) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()), [orders, currentUser]);
  const todaysOrders = useMemo(() => { const today = new Date().toISOString().split('T')[0]; return myOrders.filter((o:any) => o.date === today); }, [myOrders]);
  const pendingOrders = myOrders.filter((o:any) => ['Pending Approval', 'Pending'].includes(o.status));

  const myPayments = useMemo(() => payments.filter((p:any) => p.collectedBy === currentUser?.email), [payments, currentUser]);
  const todaysCollection = useMemo(() => { const today = new Date().toISOString().split('T')[0]; return myPayments.filter((p:any) => p.date.startsWith(today)).reduce((sum:number, p:any) => sum + p.amountPaid, 0); }, [myPayments]);

  const outstandingCust = customers.filter((c:any) => c.remainingBalance > 0);

  if (activeTab === 'home') {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-4 text-white shadow-lg shadow-blue-500/20">
            <Package className="w-8 h-8 text-blue-200 mb-3" />
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Today's Orders</p>
            <div className="text-3xl font-black mt-1">{todaysOrders.length}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-4 text-white shadow-lg shadow-emerald-500/20">
            <DollarSign className="w-8 h-8 text-emerald-200 mb-3" />
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Collection</p>
            <div className="text-2xl font-black mt-1 leading-tight">{todaysCollection.toFixed(0)} <span className="text-sm font-bold opacity-80">SAR</span></div>
          </div>
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Orders</p>
            <div className="text-2xl font-black text-slate-800 mt-2 flex items-center gap-2">
              {pendingOrders.length}
              {pendingOrders.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Drafts</p>
            <div className="text-2xl font-black text-slate-800 mt-2">{drafts.length}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Quick Actions</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {[
              { label: 'New Order', icon: <Plus />, color: 'bg-blue-50 text-blue-600', action: () => setActiveTab('customers') },
              { label: 'Customers', icon: <Users />, color: 'bg-purple-50 text-purple-600', action: () => setActiveTab('customers') },
              { label: 'Pending', icon: <ClockIcon />, color: 'bg-amber-50 text-amber-600', action: () => setActiveTab('orders') },
              { label: 'Drafts', icon: <FileEdit />, color: 'bg-slate-100 text-slate-600', action: () => setActiveTab('drafts') },
              { label: 'Payments', icon: <DollarSign />, color: 'bg-emerald-50 text-emerald-600', action: () => setActiveTab('customers') },
              { label: 'Reports', icon: <FileText />, color: 'bg-indigo-50 text-indigo-600', action: () => setActiveTab('profile') },
            ].map((a, i) => (
              <button key={i} onClick={a.action} className="flex flex-col items-center gap-2 flex-shrink-0 active:scale-95 transition-transform w-[72px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${a.color}`}>
                  {React.cloneElement(a.icon as React.ReactElement, { className: 'w-6 h-6' })}
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-red-50 rounded-3xl p-5 border border-red-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold">Outstanding Balance</h3>
            </div>
            <p className="text-red-800/70 text-xs font-medium">{outstandingCust.length} customers require follow-up</p>
          </div>
          <button onClick={() => setActiveTab('customers')} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">View</button>
        </div>
      </div>
    );
  }

  if (activeTab === 'customers') return <CustomerList customers={customers} favCustomers={favCustomers} recentCustomers={recentCustomers} toggleFavCustomer={toggleFavCustomer} selectCustomerAndRecord={selectCustomerAndRecord} />;
  
  if (activeTab === 'orders') return <OrdersTab myOrders={myOrders} repeatOrder={repeatOrder} />;
  
  if (activeTab === 'drafts') return <DraftsTab drafts={drafts} customers={customers} loadDraft={loadDraft} deleteDraft={deleteDraft} postDraftDirectly={postDraftDirectly} />;
  
  if (activeTab === 'profile') {
    return (
      <div className="p-4 space-y-6 animate-in fade-in">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-3 border-4 border-white shadow-lg">
            {currentUser?.email?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-black text-slate-800">{currentUser?.email}</h2>
          <p className="text-sm text-slate-500 font-medium">Sales Representative</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <button className="w-full p-4 flex items-center justify-between border-b border-slate-50 active:bg-slate-50">
            <div className="flex items-center gap-3 text-slate-700 font-semibold"><RefreshCw className="w-5 h-5 text-blue-500" /> Sync Status</div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Online & Synced</span>
          </button>
          <button onClick={onBack} className="w-full p-4 flex items-center justify-between border-b border-slate-50 active:bg-slate-50">
            <div className="flex items-center gap-3 text-slate-700 font-semibold"><LogOut className="w-5 h-5 text-slate-400" /> Switch to Admin</div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
          <button onClick={() => signOut(getAuth())} className="w-full p-4 flex items-center justify-between text-red-600 active:bg-red-50">
            <div className="flex items-center gap-3 font-semibold"><LogOut className="w-5 h-5" /> Logout</div>
          </button>
        </div>
      </div>
    );
  }
  return null;
}

function OrdersTab({ myOrders, repeatOrder }: any) {
  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'Pending'|'Delivered'|'Completed'>('Pending');
  const [returnOrder, setReturnOrder] = useState<any>(null); // order object if returning
  
  const filtered = useMemo(() => {
    return myOrders.filter((o:any) => {
      // 1. Pending: Approved but not delivered (e.g. Approved, Preparing)
      if (activeSubTab === 'Pending') {
        if (!['Approved', 'Preparing', 'Pending Approval'].includes(o.status)) return false;
      }
      // 2. Delivered: status === Delivered AND (remainingBalance > 0 OR payment pending)
      // Actually we'll use order amountPaid vs totalAmount
      else if (activeSubTab === 'Delivered') {
        if (o.status !== 'Delivered') return false;
        if (o.totalAmount <= o.amountPaid && o.paymentStatus === 'Paid') return false;
      }
      // 3. Completed: status === Delivered AND fully paid
      else if (activeSubTab === 'Completed') {
        if (o.status !== 'Delivered' && o.status !== 'Completed') return false;
        if (o.status === 'Delivered' && o.totalAmount > (o.amountPaid || 0)) return false;
      }
      
      if (search && !o.orderNumber?.toLowerCase().includes(search.toLowerCase()) && !o.customerName?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a:any, b:any) => new Date(b.date + 'T' + (b.time||'00:00')).getTime() - new Date(a.date + 'T' + (a.time||'00:00')).getTime());
  }, [myOrders, search, activeSubTab]);

  return (
    <div className="flex flex-col h-full animate-in fade-in relative">
      <div className="p-4 bg-white border-b border-slate-100 z-10 sticky top-0">
        <h2 className="text-2xl font-black text-slate-800 mb-3">Orders</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search order Number or customer..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['Pending', 'Delivered', 'Completed'].map(s => (
            <button key={s} onClick={() => setActiveSubTab(s as any)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === s ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {filtered.length === 0 ? <EmptyState icon={<Package />} title="No Orders Found" /> : filtered.map((o:any) => (
          <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${o.status === 'Pending Approval' ? 'bg-amber-400' : o.status === 'Approved' || o.status === 'Preparing' ? 'bg-blue-400' : o.status === 'Delivered' ? 'bg-purple-400' : 'bg-emerald-400'}`}></div>
            <div className="flex justify-between items-start mb-3 pl-2">
              <div>
                <h3 className="font-bold text-slate-800">{o.customerName}</h3>
                <p className="text-xs text-slate-400">{o.orderNumber || o.id.substring(0,8)} • {o.date}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${o.status.includes('Pending') ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{o.status}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{o.paymentStatus}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-50 pl-2">
              <div>
                <div className="font-black text-slate-800 text-lg">{Number(o.totalAmount).toFixed(2)} <span className="text-xs text-slate-500 font-bold">SAR</span></div>
                {o.amountPaid > 0 && <div className="text-[10px] font-bold text-emerald-600">Paid: {Number(o.amountPaid).toFixed(2)}</div>}
              </div>
              <div className="flex gap-2">
                {activeSubTab === 'Delivered' && (
                  <button onClick={() => setReturnOrder(o)} className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 border border-red-100">
                    <CornerDownLeft className="w-3 h-3" /> Return
                  </button>
                )}
                <button onClick={() => repeatOrder(o)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 border border-blue-100">
                  <RotateCcw className="w-3 h-3" /> Reorder
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {returnOrder && <ReturnModal order={returnOrder} onClose={() => setReturnOrder(null)} />}
    </div>
  );
}

function ReturnModal({ order, onClose }: any) {
  const { addToast } = useToast();
  const [returnItems, setReturnItems] = useState<Record<string, { qty: number, reason: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQtyChange = (productId: string, val: string, maxQty: number) => {
    let qty = parseInt(val) || 0;
    if (qty > maxQty) qty = maxQty;
    if (qty < 0) qty = 0;
    setReturnItems(prev => ({ ...prev, [productId]: { ...prev[productId], qty } }));
  };

  const handleReasonChange = (productId: string, reason: string) => {
    setReturnItems(prev => ({ ...prev, [productId]: { ...prev[productId], reason } }));
  };

  const submitReturn = async () => {
    const itemsToReturn = Object.entries(returnItems).filter(([_, data]) => data.qty > 0).map(([productId, data]) => {
      const originalItem = order.items.find((i:any) => i.productId === productId);
      return {
        productId,
        productName: originalItem.productName,
        sku: originalItem.productId.substring(0,6),
        price: originalItem.price,
        orderedQty: originalItem.qty,
        returnQty: data.qty,
        reason: data.reason || 'No reason provided'
      };
    });

    if (itemsToReturn.length === 0) {
      addToast('warning', 'No items selected for return');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalReturnAmount = itemsToReturn.reduce((sum, item) => sum + (item.returnQty * item.price), 0);
      
      const currentUser = getAuth().currentUser;
      const returnRef = push(ref(database, 'sales_returns'));
      const returnRecord = {
        id: returnRef.key,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        salespersonId: currentUser?.uid || '',
        salespersonName: currentUser?.email || 'Unknown',
        date: new Date().toISOString(),
        items: itemsToReturn,
        totalReturnAmount,
        status: 'Pending Approval', // Admin approves
        isOrderPaid: order.paymentStatus === 'Paid' || (order.amountPaid >= order.totalAmount)
      };

      await set(returnRef, returnRecord);
      addToast('success', 'Return Request Submitted', 'Sent to admin for approval.');
      onClose();
    } catch (e) {
      addToast('error', 'Failed to submit return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex flex-col animate-in fade-in slide-in-from-bottom-8">
      <div className="flex-1" onClick={onClose}></div>
      <div className="bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CornerDownLeft className="w-5 h-5 text-red-500"/> Return Items</h2>
            <p className="text-xs text-slate-500 font-medium">Order: {order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full active:scale-95"><X className="w-5 h-5 text-slate-600" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3">
          {order.items.map((item:any) => {
            const currentRet = returnItems[item.productId] || { qty: 0, reason: '' };
            return (
              <div key={item.productId} className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight pr-4">{item.productName}</h3>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-bold whitespace-nowrap">Ordered: {item.qty}</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Return Qty</label>
                    <input type="number" min="0" max={item.qty} value={currentRet.qty || ''} onChange={(e) => handleQtyChange(item.productId, e.target.value, item.qty)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-red-600 text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="0" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Reason</label>
                    <select value={currentRet.reason} onChange={(e) => handleReasonChange(item.productId, e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white">
                      <option value="">Select reason...</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Wrong Item">Wrong Item</option>
                      <option value="Customer Rejected">Customer Rejected</option>
                      <option value="Quality Issue">Quality Issue</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100 bg-white pb-safe">
          <button onClick={submitReturn} disabled={isSubmitting} className="w-full bg-red-600 text-white font-black text-lg py-3.5 rounded-xl shadow-lg shadow-red-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftsTab({ drafts, customers, loadDraft, deleteDraft, postDraftDirectly }: any) {
  return (
    <div className="p-4 space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-black text-slate-800 mb-4">Draft Orders</h2>
      {drafts.length === 0 ? <EmptyState icon={<FileEdit className="w-12 h-12" />} title="No Drafts" subtitle="Unfinished orders will be saved here automatically." /> : drafts.map((d:any) => {
        const cust = customers.find((c:any) => c.id === d.customerId);
        const total = d.cartData.reduce((s:number, i:any) => s + (i.product.price * i.qty), 0);
        const itemsCount = d.cartData.length;
        return (
          <div key={d.key} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800">{cust?.name || 'Unknown'}</h3>
                <p className="text-xs text-slate-400">Items: {itemsCount} • Total: {total.toFixed(2)} SAR</p>
                <p className="text-[10px] text-slate-400 mt-1">Last Updated: {new Date(d.updatedAt).toLocaleString()}</p>
              </div>
              <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Draft</div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
              <button onClick={() => deleteDraft(d.key)} className="px-3 py-2 text-red-600 bg-red-50 rounded-xl text-xs font-bold active:scale-95"><X className="w-4 h-4" /></button>
              <button onClick={() => loadDraft(d)} className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-xl text-sm font-bold active:scale-95">Continue</button>
              <button onClick={() => postDraftDirectly(d)} className="flex-1 py-2 text-white bg-emerald-600 rounded-xl text-sm font-bold shadow-sm shadow-emerald-500/30 active:scale-95">Post</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomerList({ customers, favCustomers, recentCustomers, toggleFavCustomer, selectCustomerAndRecord }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'fav'|'recent'|'debt'>('all');
  const [visibleCount, setVisibleCount] = useState(20);

  const filtered = useMemo(() => {
    return customers.filter((c:any) => {
      if (filter === 'fav' && !favCustomers.includes(c.id)) return false;
      if (filter === 'recent' && !recentCustomers.includes(c.id)) return false;
      if (filter === 'debt' && c.remainingBalance <= 0) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone?.includes(search)) return false;
      return true;
    }).sort((a:any, b:any) => {
      if (filter === 'recent') return recentCustomers.indexOf(a.id) - recentCustomers.indexOf(b.id);
      return a.name.localeCompare(b.name);
    });
  }, [customers, filter, search, favCustomers, recentCustomers]);

  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <div className="p-4 bg-white border-b border-slate-100 z-10 sticky top-0">
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search customers..." className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {(['all', 'fav', 'recent', 'debt'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
              {f === 'all' ? 'All' : f === 'fav' ? '⭐ Favs' : f === 'recent' ? 'Recent' : '💰 Debt'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3 pb-32 overflow-y-auto">
        {filtered.length === 0 ? <EmptyState icon={<Users className="w-12 h-12" />} title="No customers found" /> : filtered.slice(0, visibleCount).map((c:any) => {
          const isFav = favCustomers.includes(c.id);
          const hasDebt = c.remainingBalance > 0;
          const overLimit = c.creditLimit && c.remainingBalance > c.creditLimit;
          return (
            <div key={c.id} onClick={() => selectCustomerAndRecord(c)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer relative">
              <h3 className="font-bold text-slate-800 pr-10">{c.name}</h3>
              <button onClick={(e) => toggleFavCustomer(c.id, e)} className="absolute right-4 top-4 p-2 -m-2 text-slate-300 active:scale-110">
                <Star className={`w-6 h-6 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <p className="text-xs font-medium text-slate-500 mb-3">{c.phone || 'No phone'}</p>
              <div className="flex gap-2 flex-wrap">
                {hasDebt && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Debt: {c.remainingBalance.toFixed(2)}</span>}
                {overLimit && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Over Limit</span>}
              </div>
            </div>
          );
        })}
        {filtered.length > visibleCount && <button onClick={() => setVisibleCount(v => v + 20)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl active:bg-slate-200 mt-2">Load More Customers</button>}
      </div>
    </div>
  );
}

function SubViews({ subView, setSubView, selectedCustomer, ...props }: any) {
  if (!selectedCustomer) return null;

  if (subView === 'customer_detail') {
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right-4 duration-300">
        <div className="bg-white p-6 border-b border-slate-100 sticky top-0 z-20">
          <button onClick={() => setSubView('none')} className="flex items-center gap-2 text-slate-500 font-bold mb-4 active:opacity-70"><ChevronLeft className="w-5 h-5" /> Back</button>
          <h2 className="text-2xl font-black text-slate-800 mb-1">{selectedCustomer.name}</h2>
          <p className="text-slate-500 text-sm font-medium">{selectedCustomer.phone || 'No Phone'}</p>
          
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
              <p className={`text-2xl font-black ${selectedCustomer.remainingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {Number(selectedCustomer.remainingBalance || 0).toFixed(2)} <span className="text-xs font-bold">SAR</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          <ActionCard icon={<ShoppingCart />} label="New Order" color="blue" onClick={() => setSubView('new_order')} />
          <ActionCard icon={<DollarSign />} label="Collect Payment" color="emerald" onClick={() => setSubView('collect_payment')} />
          <ActionCard icon={<History />} label="Order History" color="purple" onClick={() => setSubView('view_history')} />
          <ActionCard icon={<FileText />} label="Ledger" color="amber" onClick={() => setSubView('view_ledger')} />
        </div>
      </div>
    );
  }

  if (subView === 'new_order') return <OrderEntry selectedCustomer={selectedCustomer} setSubView={setSubView} {...props} />;

  if (subView === 'collect_payment') {
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSubView('customer_detail')} className="p-2 -ml-2 text-slate-500"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-lg font-bold text-slate-800">Collect Payment</h2>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</p>
            <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
            <div className="mt-3 bg-red-50 p-3 rounded-xl">
              <p className="text-xs font-bold text-red-400 uppercase">Balance Due</p>
              <p className="font-black text-xl text-red-600">{Number(selectedCustomer.remainingBalance || 0).toFixed(2)} SAR</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-2">Amount (SAR)</label>
              <input type="number" value={props.paymentAmount} onChange={e => props.setPaymentAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-2">Method</label>
              <div className="flex gap-2">
                {['Cash', 'Bank Transfer', 'Cheque'].map(m => (
                  <button key={m} onClick={() => props.setPaymentMethod(m)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${props.paymentMethod === m ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-2">Remarks</label>
              <textarea value={props.description} onChange={e => props.setDescription(e.target.value)} rows={2} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Optional notes..."></textarea>
            </div>
            <button onClick={props.handleCollectPayment} disabled={props.isSubmittingPayment} className="w-full bg-emerald-600 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-transform disabled:opacity-50 mt-4 flex justify-center items-center gap-2">
              {props.isSubmittingPayment ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <button onClick={() => setSubView('customer_detail')} className="mb-4 text-blue-600 font-bold flex items-center justify-center gap-1"><ChevronLeft/> Back</button>
      <h2 className="text-xl font-bold text-slate-800 mb-2">View Data</h2>
      <p className="text-slate-500 text-sm">Please check the Admin panel for full ledger and history.</p>
    </div>
  );
}

function ActionCard({ icon, label, color, onClick }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 rounded-3xl border ${colors[color]} active:scale-95 transition-all shadow-sm`}>
      {React.cloneElement(icon, { className: 'w-10 h-10 mb-3' })}
      <span className="font-bold text-sm text-center">{label}</span>
    </button>
  );
}

function OrderEntry({ selectedCustomer, setSubView, products, cart, setCart, addToCart, updateCartQty, setCartQtyDirect, removeCartItem, orderTotal, handleSubmitOrder, handleSaveDraft, upfrontPayment, setUpfrontPayment, manualFavProducts, toggleFavProduct }: any) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [visibleCount, setVisibleCount] = useState(20);
  
  const recentProductsIds: string[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('recent_products') || '[]'); } catch { return []; } }, []);

  const categories = useMemo(() => ['All', 'Favourites', 'Recent', ...Array.from(new Set(products.map((p:any) => p.category).filter(Boolean)))], [products]);

  const filtered = useMemo(() => {
    return products.filter((p:any) => {
      if(cat === 'Favourites' && !manualFavProducts.includes(p.id)) return false;
      if(cat === 'Recent' && !recentProductsIds.includes(p.id)) return false;
      if(cat !== 'All' && cat !== 'Favourites' && cat !== 'Recent' && p.category !== cat) return false;
      
      if(search) {
        const term = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesSku = p.sku?.toLowerCase().includes(term);
        const matchesBrand = p.brand?.toLowerCase().includes(term);
        const matchesVariant = p.variant?.toLowerCase().includes(term);
        const matchesSize = p.size?.toLowerCase().includes(term);
        if(!matchesName && !matchesSku && !matchesBrand && !matchesVariant && !matchesSize) return false;
      }
      return true;
    }).sort((a:any, b:any) => {
      const aFav = manualFavProducts.includes(a.id);
      const bFav = manualFavProducts.includes(b.id);
      if(aFav && !bFav) return -1;
      if(!aFav && bFav) return 1;
      return 0;
    });
  }, [products, search, cat, manualFavProducts, recentProductsIds]);

  const totalQty = cart.reduce((s:number, i:any) => s + i.qty, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white px-4 py-3 border-b border-slate-100 z-20 sticky top-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} className="p-2 -ml-2 text-slate-500 bg-slate-50 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordering For</p>
            <h2 className="text-sm font-black text-slate-800 leading-tight">{selectedCustomer.name}</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
          <p className="text-sm font-black text-red-600">{Number(selectedCustomer.remainingBalance||0).toFixed(2)} SAR</p>
        </div>
      </div>

      <div className="bg-white p-3 border-b border-slate-100 z-10 sticky top-[60px]">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by name, SKU, brand, size..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map((c:any) => (
            <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cat === c ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-56">
        {filtered.slice(0, visibleCount).map((p:any) => {
          const cartItem = cart.find((i:any) => i.product.id === p.id);
          const isFav = manualFavProducts.includes(p.id);
          return (
            <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 flex-shrink-0">
                {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-xl" alt="" /> : <Package className="w-6 h-6 text-slate-300" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight pr-4">{p.name}</h3>
                  <button onClick={(e) => toggleFavProduct(p.id, e)} className="text-slate-300 p-1 -mr-2 -mt-1"><Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{p.sku || 'NO SKU'} • {p.currentStock > 0 ? <span className="text-emerald-500">{p.currentStock} in stock</span> : <span className="text-red-500">Out of stock</span>}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-black text-slate-800 text-sm">{p.price.toFixed(2)} <span className="text-[10px] text-slate-500 font-bold">SAR</span></span>
                  {cartItem ? (
                    <div className="flex items-center gap-1 bg-blue-50 rounded-lg p-1 border border-blue-100">
                      <button onClick={() => updateCartQty(p.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white text-blue-600 rounded-md shadow-sm font-bold active:scale-95"><Minus className="w-4 h-4" /></button>
                      <input type="text" value={cartItem._raw !== undefined ? cartItem._raw : (cartItem.qty === 0 ? '' : cartItem.qty)} onChange={(e) => setCartQtyDirect(p.id, e.target.value)} className="w-12 text-center font-black text-blue-700 text-sm bg-transparent outline-none" />
                      <button onClick={() => updateCartQty(p.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white text-blue-600 rounded-md shadow-sm font-bold active:scale-95"><Plus className="w-4 h-4" /></button>
                      <button onClick={() => removeCartItem(p.id)} className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-600 rounded-md shadow-sm font-bold active:scale-95 ml-1 border border-red-100"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(p)} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"><Plus className="w-4 h-4 inline-block mr-1" /> Add</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length > visibleCount && <button onClick={() => setVisibleCount(v => v + 20)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl active:bg-slate-200 mt-2">Load More Products</button>}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Items: {cart.filter((i:any)=>i.qty>0).length} • Qty: {totalQty}</p>
              <p className="font-black text-2xl text-slate-800 leading-none">{orderTotal.toFixed(2)} <span className="text-xs font-bold text-slate-500">SAR</span></p>
            </div>
            <div className="text-right w-1/2">
              <input type="number" placeholder="Upfront (Optional)" value={upfrontPayment} onChange={e=>setUpfrontPayment(e.target.value)} className="w-full text-right bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={handleSubmitOrder} className="w-full bg-blue-600 text-white font-black text-lg py-3.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Post Order
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl border border-slate-100 mt-4">
      <div className="text-slate-300 mb-4 bg-slate-50 p-4 rounded-full">{icon}</div>
      <h3 className="text-lg font-black text-slate-800 mb-1">{title}</h3>
      {subtitle && <p className="text-sm font-medium text-slate-500">{subtitle}</p>}
    </div>
  );
}
