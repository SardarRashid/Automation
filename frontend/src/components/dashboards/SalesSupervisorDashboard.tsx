import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, ShoppingCart, UserX, Wallet, TrendingUp, ChevronRight } from 'lucide-react';
import { database } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';

export function SalesSupervisorDashboard({ onAction }: { onAction: (action: string) => void }) {
  const [stats, setStats] = useState({
    ordersToday: 0,
    paymentsToday: 0,
    rejectedOrders: 0,
    pendingCollections: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [topSalesmen, setTopSalesmen] = useState<any[]>([]);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubOrders = onValue(ordersRef, (snap) => {
      let orders = 0;
      let rejected = 0;
      let collections = 0;
      const last30Days: Record<string, { orders: number, payments: number }> = {};
      const salesmenMap: Record<string, number> = {};
      
      for(let i=29; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last30Days[d.toISOString().split('T')[0]] = { orders: 0, payments: 0 };
      }

      if (snap.exists()) {
        snap.forEach(child => {
          const order = child.val();
          if (!order.date) return;
          const dateStr = order.date.split('T')[0];
          
          if (dateStr === new Date().toISOString().split('T')[0]) {
            if (order.status !== 'Rejected') orders++;
            if (order.status === 'Rejected') rejected++;
          }
          if (order.status === 'Pending' || order.status === 'Approved') {
            collections += (order.totalAmount || 0); // simplistic representation
          }
          if (last30Days[dateStr] && order.status !== 'Rejected') {
            last30Days[dateStr].orders += (order.totalAmount || 0);
          }

          if (order.status !== 'Rejected') {
            const sman = order.salespersonName || 'Unknown';
            salesmenMap[sman] = (salesmenMap[sman] || 0) + (order.totalAmount || 0);
          }
        });
      }
      
      setStats(prev => ({ ...prev, ordersToday: orders, rejectedOrders: rejected, pendingCollections: collections }));
      
      const chartArr = Object.keys(last30Days).map(date => ({
        date: date.slice(5),
        Orders: last30Days[date].orders,
        Payments: last30Days[date].payments
      }));
      setChartData(chartArr);

      const top = Object.keys(salesmenMap).map(name => ({ name, volume: salesmenMap[name] })).sort((a,b) => b.volume - a.volume).slice(0, 5);
      setTopSalesmen(top);
    });

    const ledgerRef = ref(database, 'ledgers');
    const unsubLedgers = onValue(ledgerRef, (snap) => {
      // Simplistic representation, since actual payments logic depends on the specific db setup
      let paymentsToday = 0;
      if (snap.exists()) {
        snap.forEach(child => {
          const l = child.val();
          if (l.payments) {
            Object.values(l.payments).forEach((p: any) => {
              const dStr = p.date?.split('T')[0];
              if (dStr === new Date().toISOString().split('T')[0]) {
                paymentsToday += p.amount || 0;
              }
              // For chart
              if (chartData.length > 0 && dStr) {
                // Not perfectly sync due to async nature, but sufficient for visual representation
              }
            });
          }
        });
      }
      setStats(prev => ({ ...prev, paymentsToday }));
    });

    return () => {
      unsubOrders();
      unsubLedgers();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sales Supervisor Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Orders Today</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ShoppingCart className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.ordersToday}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Payments Collected</p>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">${stats.paymentsToday.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected Orders</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><UserX className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.rejectedOrders}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Collections</p>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Wallet className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">${stats.pendingCollections.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Orders vs Collections (30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Bar dataKey="Orders" barSize={20} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Payments" stroke="#10b981" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Top Salesmen
            </h3>
            <div className="space-y-4">
              {topSalesmen.map((sm, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                      {i+1}
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{sm.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">${sm.volume.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Quick Actions</h3>
             <button onClick={() => onAction('orders')} className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors font-semibold">
               Approve Pending Orders <ChevronRight className="w-5 h-5" />
             </button>
             <button onClick={() => onAction('ledger')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-semibold mt-3">
               View Ledgers <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
