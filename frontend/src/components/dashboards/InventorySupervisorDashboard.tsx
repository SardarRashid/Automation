import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardCheck, ArrowRightLeft, AlertOctagon, PackageMinus, MapPin, Plus } from 'lucide-react';
import { database } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';

export function InventorySupervisorDashboard({ onAction }: { onAction: (action: string) => void }) {
  const [stats, setStats] = useState({
    pendingCounts: 0,
    transfersInTransit: 0,
    damageReports: 0,
    lowStockItems: 0
  });

  const [movementData, setMovementData] = useState<any[]>([]);
  const [roomStatus, setRoomStatus] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Movements for Chart
    const movRef = ref(database, 'inventory_movements');
    const unsubMov = onValue(movRef, (snap) => {
      let damage = 0;
      const last30Days: Record<string, { in: number, out: number }> = {};
      
      for(let i=29; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last30Days[d.toISOString().split('T')[0]] = { in: 0, out: 0 };
      }

      if (snap.exists()) {
        snap.forEach(child => {
          const m = child.val();
          if (!m.timestamp) return;
          const dateStr = m.timestamp.split('T')[0];
          
          if (m.type === 'ADJUSTMENT' && m.quantity < 0) {
            damage++; // simplistic damage count
          }

          if (last30Days[dateStr]) {
            if (m.quantity > 0) last30Days[dateStr].in += m.quantity;
            if (m.quantity < 0) last30Days[dateStr].out += Math.abs(m.quantity);
          }
        });
      }
      
      setStats(prev => ({ ...prev, damageReports: damage }));
      setMovementData(Object.keys(last30Days).map(date => ({
        date: date.slice(5),
        Inbound: last30Days[date].in,
        Outbound: last30Days[date].out
      })));
    });

    // 2. Fetch Rooms
    const roomsRef = ref(database, 'store_rooms');
    const unsubRooms = onValue(roomsRef, (snap) => {
      const rooms: any[] = [];
      if (snap.exists()) {
        snap.forEach(child => rooms.push(child.val()));
      }
      setRoomStatus(rooms);
    });

    // 3. Fetch Stock Lots
    const lotsRef = ref(database, 'stock_lots');
    const unsubLots = onValue(lotsRef, (snap) => {
      let lowStock = 0;
      if (snap.exists()) {
        snap.forEach(child => {
          if (child.val().quantity < 50) lowStock++;
        });
      }
      setStats(prev => ({ ...prev, lowStockItems: lowStock }));
    });

    // 4. Fetch Transfers
    const transRef = ref(database, 'transfers');
    const unsubTrans = onValue(transRef, (snap) => {
      let pending = 0;
      if (snap.exists()) {
        snap.forEach(child => {
          if (child.val().status === 'Pending') pending++;
        });
      }
      setStats(prev => ({ ...prev, transfersInTransit: pending }));
    });

    // 5. Fetch Counts
    const countsRef = ref(database, 'daily_counts');
    const unsubCounts = onValue(countsRef, (snap) => {
      let pendingCounts = 0;
      if (snap.exists()) {
        snap.forEach(child => {
          if (child.val().status === 'Submitted') pendingCounts++;
        });
      }
      setStats(prev => ({ ...prev, pendingCounts }));
    });

    return () => {
      unsubMov();
      unsubRooms();
      unsubLots();
      unsubTrans();
      unsubCounts();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventory Operations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Counts</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ClipboardCheck className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.pendingCounts}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Transfers</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ArrowRightLeft className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.transfersInTransit}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Damage Reports</p>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertOctagon className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.damageReports}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Low Stock Items</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><PackageMinus className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4">{stats.lowStockItems}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Stock Movement Trend (30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="Inbound" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="Outbound" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" /> Room Status
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {roomStatus.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{r.type} • {r.capacity} capacity</p>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${r.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => onAction('count')} className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors font-semibold gap-2">
               <Plus className="w-6 h-6" /> Count
             </button>
             <button onClick={() => onAction('transfer')} className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-semibold gap-2">
               <ArrowRightLeft className="w-6 h-6" /> Transfer
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
