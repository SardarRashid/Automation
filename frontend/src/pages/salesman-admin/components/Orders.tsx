import React, { useState, useMemo } from 'react';
import { ShoppingBag, Eye, Check, X, ShieldAlert, DollarSign } from 'lucide-react';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { fbService } from '../services/firebaseService';
import { workflowEngine } from '../../../services/workflow/WorkflowEngine';
import { auth } from '../../../lib/firebase';
import type {  Order, Customer, Product  } from '../../../types/SalesmanAdmin';

export default function Orders() {
  const { orders, customers, products } = useSalesmanAdmin();

  const [adminOrderFilter, setAdminOrderFilter] = useState<'All' | 'Pending' | 'Approved' | 'Delivered' | 'Cancelled'>('All');
  const [adminOrderSearchText, setAdminOrderSearchText] = useState('');
  const [adminOrderPaymentFilter, setAdminOrderPaymentFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [adminOrderDateFilter, setAdminOrderDateFilter] = useState('');
  const [deliverConfirmOrder, setDeliverConfirmOrder] = useState<Order | null>(null);
  
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [paymentModalAmount, setPaymentModalAmount] = useState<string>('');
  const [paymentModalMethod, setPaymentModalMethod] = useState<string>('Cash');

  const filteredOrders = useMemo(() => {
    let temp = [...orders];
    temp.sort((a, b) => new Date(`${b.date}T${b.time || '00:00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00:00'}`).getTime());
    if (adminOrderFilter !== 'All') {
      temp = temp.filter(o => o.status === adminOrderFilter);
    }
    if (adminOrderPaymentFilter !== 'All') {
      if (adminOrderPaymentFilter === 'Unpaid') {
        temp = temp.filter(o => !o.paymentStatus || o.paymentStatus === 'Unpaid');
      } else {
        temp = temp.filter(o => o.paymentStatus === adminOrderPaymentFilter);
      }
    }
    if (adminOrderDateFilter) {
      temp = temp.filter(o => o.date === adminOrderDateFilter);
    }
    if (adminOrderSearchText) {
      const q = adminOrderSearchText.toLowerCase();
      temp = temp.filter(o => 
        (o.id && o.id.toLowerCase().includes(q)) || 
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.salespersonName && o.salespersonName.toLowerCase().includes(q))
      );
    }
    return temp;
  }, [orders, adminOrderFilter, adminOrderPaymentFilter, adminOrderDateFilter, adminOrderSearchText]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (confirm(`Change order status to ${status}?`)) {
      await workflowEngine.transitionOrder(orderId, status as any, auth.currentUser?.uid || 'system');
    }
  };

  const handleConfirmDelivery = async () => {
    if (deliverConfirmOrder) {
      await workflowEngine.transitionOrder(deliverConfirmOrder.id, 'Delivered', auth.currentUser?.uid || 'system');
      setDeliverConfirmOrder(null);
    }
  };

  const handleProcessPayment = async () => {
    if (paymentModalOrder && paymentModalAmount) {
      await workflowEngine.recordPayment(paymentModalOrder, Number(paymentModalAmount), paymentModalMethod, auth.currentUser?.uid || 'system', customers);
      setPaymentModalOrder(null);
      setPaymentModalAmount('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 dark:bg-slate-900/50 gap-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Order Management HQ</h3>
          <p className="text-xs text-slate-400">Review, approve, and track field orders.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="text"
            placeholder="Search Order Number, Client, Salesman..."
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={adminOrderSearchText}
            onChange={(e) => setAdminOrderSearchText(e.target.value)}
          />
          <input 
            type="date"
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 dark:text-slate-300"
            value={adminOrderDateFilter}
            onChange={(e) => setAdminOrderDateFilter(e.target.value)}
          />
          <select 
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 dark:text-slate-200"
            value={adminOrderFilter}
            onChange={(e) => setAdminOrderFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 dark:text-slate-200"
            value={adminOrderPaymentFilter}
            onChange={(e) => setAdminOrderPaymentFilter(e.target.value as any)}
          >
            <option value="All">All Payments</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-blue-200">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{filteredOrders.length} Orders</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-5 py-4">Order Number & Time</th>
              <th className="px-5 py-4">Field Agent</th>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4">Value</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Fulfillment</th>
              <th className="px-5 py-4 text-right">HQ Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredOrders.map(o => (
              <tr key={o.id} className="hover:bg-slate-50 dark:bg-slate-900/80 transition-colors group">
                <td className="px-5 py-4">
                  <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{o.id}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{o.date} {o.time}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-700 dark:text-slate-200">{o.salespersonName}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold text-blue-900">{o.customerName}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold text-slate-800 dark:text-slate-100">{Number(o.totalAmount).toFixed(2)} SAR</div>
                  <div className="text-[10px] text-slate-400">{o.items?.length || 0} items</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start space-y-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      o.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                      o.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {o.paymentStatus || 'Unpaid'}
                    </span>
                    {(o.paymentStatus === 'Partial' || !o.paymentStatus || o.paymentStatus === 'Unpaid') && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Paid: {Number(o.amountPaid || 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    o.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                    o.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Payment Button */}
                    {(o.status === 'Approved' || o.status === 'Delivered') && (!o.paymentStatus || o.paymentStatus !== 'Paid') && (
                      <button 
                        onClick={() => setPaymentModalOrder(o)}
                        className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100" 
                        title="Record Payment"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                    {o.status === 'Pending' && (
                      <>
                        <button onClick={() => handleUpdateOrderStatus(o.id, 'Approved')} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100" title="Approve Order">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100" title="Cancel Order">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {o.status === 'Approved' && (
                      <button 
                        onClick={() => setDeliverConfirmOrder(o)}
                        className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100" 
                        title="Mark as Delivered (Deducts Stock)"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-medium">
                  No orders match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Deliver Confirm Modal */}
      {deliverConfirmOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Confirm Delivery</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Order <span className="font-mono text-slate-800 dark:text-slate-100 font-bold">{deliverConfirmOrder.id}</span>
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-800">
                <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
                <div className="text-sm font-medium">
                  Marking this order as delivered will <b>permanently deduct stock</b> from your master inventory. This action cannot be undone.
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setDeliverConfirmOrder(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelivery}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Confirm & Deduct
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Record HQ Payment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Order <span className="font-mono text-slate-800 dark:text-slate-100 font-bold">{paymentModalOrder.id}</span>
                </p>
              </div>
              <button onClick={() => setPaymentModalOrder(null)} className="p-2 bg-slate-200 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total Order Amount</span>
                <span className="text-xl font-black text-blue-900">{Number(paymentModalOrder.totalAmount).toFixed(2)} SAR</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Remaining Balance</span>
                <span className="text-xl font-black text-green-700">{(Number(paymentModalOrder.totalAmount) - Number(paymentModalOrder.amountPaid || 0)).toFixed(2)} SAR</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Payment Amount Received (SAR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-lg font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                    value={paymentModalAmount}
                    onChange={(e) => setPaymentModalAmount(e.target.value)}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button 
                    onClick={() => setPaymentModalAmount((Number(paymentModalOrder.totalAmount) - Number(paymentModalOrder.amountPaid || 0)).toString())}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Set Full Amount
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Payment Method</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={paymentModalMethod}
                  onChange={(e) => setPaymentModalMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Bank Cheque</option>
                  <option>POS Card</option>
                  <option>Other</option>
                </select>
              </div>
              
              <button 
                onClick={handleProcessPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex justify-center items-center space-x-2 transition-all shadow-lg shadow-blue-500/30"
              >
                <Check className="w-5 h-5" />
                <span>Submit HQ Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
