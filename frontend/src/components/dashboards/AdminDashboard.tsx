import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, Package, AlertTriangle, CheckCircle, TrendingUp, Users, Settings, BellRing, Activity } from 'lucide-react';
import { database } from '../../lib/firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { auditService } from '../../services/audit';

export function AdminDashboard({ onAction }: { onAction: (action: string) => void }) {
  const [stats, setStats] = useState({
    todaysSales: 0,
    outstandingBalance: 0,
    pendingShipments: 0,
    pendingApprovals: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  useEffect(() => {
    // 1. Fetch Orders for Today's Sales & Chart
    const ordersRef = ref(database, 'orders');
    const unsubOrders = onValue(ordersRef, (snap) => {
      let todaySales = 0;
      let pendingApp = 0;
      const last7Days: Record<string, number> = {};
      
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days[d.toISOString().split('T')[0]] = 0;
      }

      if (snap.exists()) {
        snap.forEach(child => {
          const order = child.val();
          if (!order.date) return;
          const dateStr = order.date.split('T')[0];
          
          if (dateStr === new Date().toISOString().split('T')[0] && order.status !== 'Rejected') {
            todaySales += (order.totalAmount || 0);
          }
          if (order.status === 'Pending') {
            pendingApp++;
          }
          if (last7Days[dateStr] !== undefined && order.status !== 'Rejected') {
            last7Days[dateStr] += (order.totalAmount || 0);
          }
        });
      }
      
      setStats(prev => ({ ...prev, todaysSales: todaySales, pendingApprovals: pendingApp }));
      setRevenueData(Object.keys(last7Days).map(date => ({ date: date.slice(5), revenue: last7Days[date] })));
    });

    // 2. Fetch Ledgers for Outstanding Balance
    const ledgerRef = ref(database, 'ledgers');
    const unsubLedgers = onValue(ledgerRef, (snap) => {
      let balance = 0;
      if (snap.exists()) {
        snap.forEach(child => {
          const l = child.val();
          balance += (l.balance || 0);
        });
      }
      setStats(prev => ({ ...prev, outstandingBalance: balance }));
    });

    // 3. Fetch Shipments
    const shipRef = ref(database, 'shipments');
    const unsubShip = onValue(shipRef, (snap) => {
      let pending = 0;
      if (snap.exists()) {
        snap.forEach(child => {
          if (child.val().status === 'Pending') pending++;
        });
      }
      setStats(prev => ({ ...prev, pendingShipments: pending }));
    });

    // 4. Fetch Low Stock Alerts
    const lotsRef = ref(database, 'stock_lots');
    const unsubLots = onValue(lotsRef, (snap) => {
      const alerts: any[] = [];
      if (snap.exists()) {
        // Mocked logic for low stock based on some assumed threshold
        snap.forEach(child => {
          const lot = child.val();
          if (lot.quantity && lot.quantity < 50) {
            alerts.push(lot);
          }
        });
      }
      setLowStock(alerts.slice(0, 5));
    });

    // 5. Fetch Recent Audit Logs
    auditService.getRecentLogs(10).then(logs => {
      setRecentActivity(logs);
      
      // Calculate activity chart (Modules used today)
      const moduleCounts: Record<string, number> = {};
      logs.forEach(l => {
        moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1;
      });
      setActivityData(Object.keys(moduleCounts).map(m => ({ module: m, count: moduleCounts[m] })));
    });

    return () => {
      unsubOrders();
      unsubLedgers();
      unsubShip();
      unsubLots();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Sales</p>
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">${stats.todaysSales.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding Balance</p>
            <div className="p-2 bg-red-50 rounded-lg"><DollarSign className="w-5 h-5 text-red-600" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">${stats.outstandingBalance.toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Approvals</p>
            <div className="p-2 bg-orange-50 rounded-lg"><CheckCircle className="w-5 h-5 text-orange-600" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.pendingApprovals}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Shipments</p>
            <div className="p-2 bg-blue-50 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.pendingShipments}</h3>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">7-Day Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Activity by Module</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="module" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" /> Inventory Alerts
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No low stock alerts.</p>
            ) : lowStock.map((lot, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{lot.variety} {lot.size}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Lot: {lot.id?.slice(-6)}</p>
                </div>
                <span className="px-2 py-1 bg-white dark:bg-slate-800 text-orange-600 rounded-lg text-xs font-bold shadow-sm">
                  {lot.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" /> Recent Activity
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4">
            {recentActivity.slice(0, 5).map((log, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{log.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{log.userId} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" /> Quick Actions
          </h3>
          <div className="flex flex-col gap-3">
            <button onClick={() => onAction('users')} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700/50 rounded-xl transition-colors text-left border border-slate-100">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Users className="w-4 h-4 text-indigo-600" /></div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Manage Users</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add or edit system roles</p>
              </div>
            </button>
            <button onClick={() => onAction('broadcast')} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700/50 rounded-xl transition-colors text-left border border-slate-100">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><BellRing className="w-4 h-4 text-orange-600" /></div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Send Broadcast</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notify all staff members</p>
              </div>
            </button>
            <button onClick={() => onAction('settings')} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700/50 rounded-xl transition-colors text-left border border-slate-100">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">System Settings</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure global preferences</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
