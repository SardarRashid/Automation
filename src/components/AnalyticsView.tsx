import React from "react";
import { InventoryRecord, Storekeeper } from "../types";
import { PieChart, TrendingUp, ShoppingBag, ArrowUpRight, Scale } from "lucide-react";

interface AnalyticsViewProps {
  records: InventoryRecord[];
  date: string;
  currentUser: Storekeeper;
}

export function AnalyticsView({ records, date, currentUser }: AnalyticsViewProps) {
  // Filter records based on role credentials
  const permittedRecords = records.filter(r => {
    const matchSection = currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedSection === "All" ||
      currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.category.toLowerCase().trim());
    
    const matchStore = currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedStoreNum === "All" ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.location.toLowerCase().trim()) ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).some(store => r.location.toLowerCase().includes(store));

    return matchSection && matchStore;
  });

  // Aggregate stats using permitted subset
  const totalIncoming = permittedRecords.reduce((sum, r) => sum + r.incoming, 0);
  const totalSold = permittedRecords.reduce((sum, r) => sum + r.sold, 0);
  const totalAvailable = permittedRecords.reduce((sum, r) => sum + r.available, 0);
  const totalOpening = permittedRecords.reduce((sum, r) => sum + r.openingStock, 0);

  // Group by Category using permitted subset
  const categoryStats: { [cat: string]: { incoming: number; sold: number; available: number } } = {};
  permittedRecords.forEach((r) => {
    if (!categoryStats[r.category]) {
      categoryStats[r.category] = { incoming: 0, sold: 0, available: 0 };
    }
    categoryStats[r.category].incoming += r.incoming;
    categoryStats[r.category].sold += r.sold;
    categoryStats[r.category].available += r.available;
  });

  const categories = Object.keys(categoryStats);
  const maxVolume = Math.max(
    ...Object.values(categoryStats).map((s) => Math.max(s.incoming, s.sold, s.available)),
    10 // Fallback minimum
  );

  // Calculate low stock items (available < 25)
  const lowStockItems = permittedRecords.filter((r) => r.available < 25);

  return (
    <div className="space-y-6">
      
      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase">
              TOTAL AVAILABLE STOCK
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalAvailable.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Currently in warehouses
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-green-50 text-green-800 rounded-xl">
            <ArrowUpRight className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase">
              INCOMING STOCK (TODAY)
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              +{totalIncoming.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span>
            </h3>
            <p className="text-xs text-green-700 font-sans font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
              Received today
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase">
              SALES OUTFLOW (TODAY)
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              -{totalSold.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dispatched to clients
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase">
              SALES RATIO
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalIncoming > 0 ? Math.round((totalSold / totalIncoming) * 100) : 0}%
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Of incoming stock sold
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts & Indicators Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual 1: Stock Breakdown Dashboard Bar Chart (Custom Scalable SVG) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-8">
          <h3 className="text-base font-sans font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-705" />
            Stock Volume Breakdown by Category
          </h3>

          {categories.length > 0 ? (
            <div className="space-y-6 my-4">
              {categories.map((cat) => {
                const stat = categoryStats[cat];
                const incomingPct = (stat.incoming / maxVolume) * 100;
                const soldPct = (stat.sold / maxVolume) * 100;
                const availablePct = (stat.available / maxVolume) * 100;

                return (
                  <div key={cat} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <div className="flex gap-4 text-xs font-mono text-slate-500">
                        <span>Came: <strong className="text-slate-700">{stat.incoming}</strong></span>
                        <span>Sold: <strong className="text-slate-700">{stat.sold}</strong></span>
                        <span>Stored: <strong className="text-green-800 font-bold">{stat.available}</strong></span>
                      </div>
                    </div>

                    {/* SVG Progress Stack */}
                    <div className="space-y-1.5 pt-1">
                      {/* Incoming bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-[10px] font-mono font-bold text-slate-400">INCOMING</span>
                        <div className="flex-1 bg-slate-100 h-3.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-sky-550 h-full rounded-full transition-all duration-800"
                            style={{ width: `${Math.max(incomingPct, 2)}%` }}
                          />
                        </div>
                      </div>

                      {/* Sold bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-[10px] font-mono font-bold text-slate-400">SOLD</span>
                        <div className="flex-1 bg-slate-100 h-3.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-800"
                            style={{ width: `${Math.max(soldPct, 2)}%` }}
                          />
                        </div>
                      </div>

                      {/* Available bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-[10px] font-mono font-bold text-slate-400">STORED</span>
                        <div className="flex-1 bg-slate-100 h-3.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-720 h-full rounded-full transition-all duration-800"
                            style={{ width: `${Math.max(availablePct, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <PieChart className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-sans">No data currently logged on {date}</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-6 border-t border-slate-100 pt-4 text-xs font-mono font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-sky-500 rounded-sm" />
              <span>WHAT CAME (INCOMING)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-sm" />
              <span>WHAT SOLD (SALES)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-700 rounded-sm" />
              <span>WHAT AVAILABLE (STORED)</span>
            </div>
          </div>
        </div>

        {/* Visual 2: Quick Auditor Alerts & Warning Board */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-sans font-semibold text-slate-800 mb-4">
              Audit Alert Center
            </h3>

            {records.length > 0 ? (
              <div className="space-y-4">
                {/* Gauge 1: Sell-Through Rate */}
                <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100/50">
                  <span className="text-[10px] font-mono font-bold text-sky-700 tracking-wider">DAILY TURNOVER SPEED</span>
                  <div className="flex justify-between items-baseline mt-1.5">
                    <h4 className="text-xl font-bold text-sky-900">
                      {totalOpening > 0 ? Math.round((totalSold / (totalOpening + totalIncoming)) * 100) : 0}%
                    </h4>
                    <span className="text-xs text-sky-700 font-medium">Daily Outflow Rate</span>
                  </div>
                  <div className="w-full bg-sky-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className="bg-sky-600 h-full rounded-full transition-all"
                      style={{ width: `${totalOpening > 0 ? Math.min(Math.round((totalSold / (totalOpening + totalIncoming)) * 100), 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Low Stock Watchlist */}
                <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-100/50">
                  <span className="text-[10px] font-mono font-bold text-amber-700 tracking-wider flex justify-between">
                    <span>LOW STOCK WATCHLIST (&lt; 25 UNITS)</span>
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px]">
                      {lowStockItems.length} items
                    </span>
                  </span>

                  {lowStockItems.length > 0 ? (
                    <div className="space-y-2 mt-2 max-h-[140px] overflow-y-auto pr-1">
                      {lowStockItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs mt-1">
                          <span className="font-semibold text-slate-700">{item.variety} ({item.size})</span>
                          <span className="text-rose-600 font-bold font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {item.available} stored
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-green-700 font-semibold mt-2">
                      ✔ All items are safely stocked. No warnings!
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 text-xs">
                Waiting for inventory data to compute metrics.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-sans">
            Updated automatically with real-time Firestore database synchronization logs.
          </div>
        </div>

      </div>

    </div>
  );
}
