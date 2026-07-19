import os

path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\components\AnalyticsView.tsx"

new_content = """import React, { useState, useEffect } from "react";
import { 
  Warehouse, ArrowRightLeft, AlertTriangle, 
  TrendingDown, CheckCircle2, Package, ShieldAlert 
} from "lucide-react";
import type { StoreRoom, StockLot, Transfer, Storekeeper } from "../types";
import { getStoreRooms, getRoomMetrics } from "../services/roomService";
import { getStockLots } from "../services/productService";
import { getTransfers } from "../services/transferService";

interface AnalyticsViewProps {
  currentUser: Storekeeper;
}

export function AnalyticsView({ currentUser }: AnalyticsViewProps) {
  const [rooms, setRooms] = useState<(StoreRoom & { metrics: any })[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [loadedRooms, loadedLots, loadedTransfers] = await Promise.all([
          getStoreRooms(),
          getStockLots(),
          getTransfers()
        ]);
        
        // Fetch metrics for each room
        const roomsWithMetrics = await Promise.all(
          loadedRooms.map(async (room) => {
            const metrics = await getRoomMetrics(room.id);
            return { ...room, metrics };
          })
        );
        
        setRooms(roomsWithMetrics);
        setStockLots(loadedLots);
        setTransfers(loadedTransfers);
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Operational Dashboard...</div>;
  }

  const pendingTransfers = transfers.filter(t => t.status === 'Pending' || t.status === 'In Transit');
  const expiredLots = stockLots.filter(l => l.status === 'Expired');
  const damagedLots = stockLots.filter(l => l.status === 'Damaged');
  
  // Calculate average utilization
  const avgUtilization = rooms.length > 0 
    ? rooms.reduce((acc, r) => acc + (r.metrics?.currentUtilization || 0), 0) / rooms.length 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Warehouse className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-800">Operational Dashboard</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Warehouse /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Room Utilization</p>
            <h3 className="text-2xl font-black text-slate-800">{Math.round(avgUtilization)}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><ArrowRightLeft /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Transfers</p>
            <h3 className="text-2xl font-black text-slate-800">{pendingTransfers.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry Alerts</p>
            <h3 className="text-2xl font-black text-slate-800">{expiredLots.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><TrendingDown /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Damaged Lots</p>
            <h3 className="text-2xl font-black text-slate-800">{damagedLots.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Room Utilization Visualization */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Room Capacity Status
          </h3>
          <div className="space-y-4">
            {rooms.map(room => {
              const util = room.metrics?.currentUtilization || 0;
              const color = util > 90 ? 'bg-rose-500' : util > 70 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={room.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">{room.name}</span>
                    <span className="font-mono text-slate-500">{util}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${util}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Alerts Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Critical Alerts
          </h3>
          <div className="space-y-3">
            {expiredLots.slice(0, 3).map(lot => (
              <div key={lot.id} className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center text-sm">
                <span className="font-semibold text-rose-900">Lot {lot.id.substring(0,8)} expired!</span>
                <span className="text-rose-600 text-xs">({lot.categoryId})</span>
              </div>
            ))}
            {pendingTransfers.slice(0, 3).map(pt => (
              <div key={pt.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-sm">
                <span className="font-semibold text-amber-900">Transfer Pending: {pt.sourceRoomId} ➔ {pt.destinationRoomId}</span>
              </div>
            ))}
            {expiredLots.length === 0 && pendingTransfers.length === 0 && (
              <div className="text-center p-6 text-emerald-600 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <p className="text-sm font-bold">All clear. No critical alerts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"""

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replaced AnalyticsView.tsx with new Operational KPI Dashboard.")
