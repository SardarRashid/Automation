import React, { useState, useEffect } from 'react';
import { OfflineIndicator } from '../components/mobile/OfflineIndicator';
import { SuccessOverlay } from '../components/mobile/SuccessOverlay';
import { TouchButton } from '../components/mobile/TouchButton';
import { useDraft } from '../hooks/useDraft';
import { useFavorites } from '../hooks/useFavorites';

import { AIAssistant } from '../components/ui/AIAssistant';
import { auth, logoutUser } from '../lib/firebase';
import { Users, Search, Package, MapPin, Phone, LogOut, CheckCircle, Clock, PackageCheck, ShoppingCart, DollarSign, Plus, Minus } from 'lucide-react';
import type {  Product  } from '../types/SalesmanAdmin';
import { useSalesMobileState } from '../hooks/useSalesMobileState';
import { salesService } from '../services/sales';
import { NotificationBell } from '../components/NotificationBell';

interface SalesmanMobileAppProps {
  onBack?: () => void;
}

export default function SalesmanMobileApp({ onBack }: SalesmanMobileAppProps) {
  const currentUser = auth.currentUser;
  const logout = logoutUser;
  
  const {
    loading,
    activeTab, setActiveTab,
    selectedCustomer, setSelectedCustomer,
    orderCustomer, setOrderCustomer,
    cart, setCart,
    customers,
    products,
    payments
  } = useSalesMobileState();

  // Initialize offline sync queue listener
  useEffect(() => {
    salesService.initOfflineSync();
  }, []);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [upfrontPayment, setUpfrontPayment] = useState('');
  
  // New UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile UX Hooks
  const { draft: draftCart, saveDraft: saveCartDraft, clearDraft: clearCartDraft } = useDraft('salesCart', []);
  const { favorites, toggleFavorite, addRecent } = useFavorites('salesProducts');
  const [showSuccess, setShowSuccess] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    if (draftCart && draftCart.length > 0 && cart.length === 0) {
      if (window.confirm("You have an unsaved order draft. Would you like to resume?")) {
        setCart(draftCart);
      } else {
        clearCartDraft();
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (cart.length > 0) saveCartDraft(cart);
  }, [cart]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Search filtering
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    setIsSubmitting(true);
    try {
      await salesService.submitPayment(
        selectedCustomer,
        parseFloat(paymentAmount),
        paymentMethod,
        description,
        currentUser?.email || 'Unknown Salesman'
      );
      
      alert(`Payment queued for processing.`);
      setPaymentAmount('');
      setDescription('');
      setSelectedCustomer(null);
      setActiveTab('collections');
    } catch (err: any) {
      alert(err.message || "Failed to submit payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!orderCustomer) { alert("Please select a customer"); return; }
    
    setIsSubmitting(true);
    try {
      await salesService.submitOrder(
        orderCustomer,
        cart,
        parseFloat(upfrontPayment) || 0,
        paymentMethod,
        currentUser?.uid || '',
        currentUser?.email || 'Unknown Salesman'
      );
      
      alert(`Order queued for processing!`);
      setCart([]);
      setOrderCustomer(null);
      setUpfrontPayment('');
      setSearchQuery('');
      setActiveTab('customers');
    } catch (err: any) {
      alert(err.message || "Failed to submit order");
    } finally {
      setIsSubmitting(false);
    }
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

  const currentOrderTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* HEADER */}
      <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Field Sales</h1>
          <p className="text-xs opacity-90">{currentUser?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {!navigator.onLine && <span className="text-xs bg-red-500 px-2 py-1 rounded-full font-bold">OFFLINE</span>}
          <button onClick={logout} className="p-2 hover:bg-emerald-700 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="flex bg-white shadow-sm border-b border-slate-200 sticky top-[72px] z-10">
        <button 
          onClick={() => setActiveTab('customers')}
          className={`flex-1 py-3 text-sm font-bold flex flex-col items-center gap-1 ${activeTab === 'customers' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
        >
          <Users className="w-5 h-5" /> Customers
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-sm font-bold flex flex-col items-center gap-1 ${activeTab === 'products' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
        >
          <Package className="w-5 h-5" /> New Order
        </button>
        <button 
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-3 text-sm font-bold flex flex-col items-center gap-1 ${activeTab === 'collections' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
        >
          <DollarSign className="w-5 h-5" /> Collections
        </button>
      </div>

      <main className="p-4">
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
              <p className="font-bold text-slate-800">Processing...</p>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            {customers.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{c.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{c.shopName || c.storeName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Balance</span>
                    <span className={`font-mono font-bold ${c.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {Number(c.remainingBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.area}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => { setOrderCustomer(c); setActiveTab('products'); }}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:bg-slate-200 flex justify-center items-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" /> Order
                  </button>
                  <button 
                    onClick={() => { setSelectedCustomer(c); setActiveTab('collections'); }}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl active:bg-emerald-100 flex justify-center items-center gap-2 border border-emerald-100"
                  >
                    <DollarSign className="w-4 h-4" /> Collect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRODUCTS & NEW ORDER TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            {!orderCustomer ? (
              <>
                <button 
                  onClick={() => setActiveTab('customers')}
                  className="w-full py-4 border-2 border-dashed border-emerald-500 text-emerald-600 font-bold rounded-2xl bg-emerald-50 flex justify-center items-center gap-2 active:bg-emerald-100 transition-colors"
                >
                  <Users className="w-5 h-5" /> Select Customer First
                </button>
              </>
            ) : (
              <>
                {/* Search Bar */}
                <div className="sticky top-[140px] z-10 bg-slate-50 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 gap-3 mb-32">
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform cursor-pointer flex flex-col justify-between">
                      <div>
                        <div className="aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{p.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{p.sku}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-600 text-sm">{Number(p.price).toFixed(2)}</span>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg font-bold">{p.stock} left</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sticky Cart Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl z-20">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                      <p className="text-2xl font-mono font-bold text-slate-800">SAR {currentOrderTotal.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('cart')}
                      className="px-6 py-3 bg-slate-800 text-white font-bold rounded-2xl flex items-center gap-2 active:bg-slate-700"
                    >
                      <ShoppingCart className="w-5 h-5" /> 
                      {cart.length > 0 && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{cart.reduce((s,i)=>s+i.qty,0)}</span>}
                      View Cart
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* CART TAB */}
        {activeTab === 'cart' && (
          <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right-4 duration-200">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 mb-2">Cart is empty</h2>
                <button 
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-3 bg-emerald-100 text-emerald-700 font-bold rounded-2xl mt-4"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Ordering For</p>
                  <p className="font-bold text-slate-800">{orderCustomer?.name}</p>
                </div>

                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{item.product.name}</h3>
                        <p className="text-emerald-600 font-mono font-bold text-sm mt-1">{Number(item.product.price).toFixed(2)} <span className="text-slate-400 text-xs">SAR</span></p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 ml-4">
                        <button onClick={() => updateCartQty(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:bg-slate-100">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:bg-slate-100">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <span className="text-slate-500 font-bold">Total Amount</span>
                    <span className="text-2xl font-mono font-bold text-slate-800">SAR {currentOrderTotal.toFixed(2)}</span>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Upfront Payment (Optional)</label>
                    <input
                      type="number"
                      value={upfrontPayment}
                      onChange={(e) => setUpfrontPayment(e.target.value)}
                      className="w-full text-center text-xl font-mono font-bold text-slate-800 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {parseFloat(upfrontPayment) > 0 && (
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
                      </select>
                    </div>
                  )}
                  
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="w-full py-4 font-bold text-white bg-emerald-600 rounded-2xl active:bg-emerald-700 shadow-lg flex justify-center items-center gap-2 mt-4 disabled:opacity-70"
                  >
                    <ShoppingCart className="w-5 h-5" /> Submit Order
                  </button>
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
                  onClick={() => setActiveTab('customers')}
                  className="w-full py-4 border-2 border-dashed border-emerald-500 text-emerald-600 font-bold rounded-2xl bg-emerald-50 flex justify-center items-center gap-2 active:bg-emerald-100 transition-colors"
                >
                  <DollarSign className="w-5 h-5" /> Make Lump Sum Collection
                </button>

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
                    <TouchButton
                      type="submit"
                      disabled={isSubmitting}
                      variant="primary"
                    >
                      <CheckCircle className="w-5 h-5" /> Submit Collection
                    </TouchButton>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}


      </main>
        <AIAssistant context="sales" />
    </div>
  );
}
