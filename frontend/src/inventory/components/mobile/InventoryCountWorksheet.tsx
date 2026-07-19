import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, ArrowLeft, Search } from "lucide-react";
import type { StoreRoom, StockLot, StockCountSessionItem } from "../../types";
import { getActiveLotsInRoom } from "../../services/movementService";
import { submitStockCountSession } from "../../services/stockCountService";
import { RoomSelectorCards } from "./RoomSelectorCards";

export function InventoryCountWorksheet({ storeRooms, currentUser, onBack, onSuccess }: any) {
  const [selectedRoomId, setSelectedRoomId] = useState(storeRooms[0]?.id || "");
  const [lots, setLots] = useState<(StockLot & { expectedQty: number })[]>([]);
  const [counts, setCounts] = useState<Record<string, { actual: number, reason: string }>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedRoomId) return;
    async function load() {
      setLoading(true);
      try {
        const roomLots = await getActiveLotsInRoom(selectedRoomId);
        setLots(roomLots as any[]);
        
        const initialCounts: any = {};
        roomLots.forEach((lot: any) => {
          initialCounts[lot.id] = { actual: lot.expectedQty || 0, reason: '' };
        });
        setCounts(initialCounts);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [selectedRoomId]);

  const filteredLots = useMemo(() => {
    if (!searchTerm) return lots;
    const term = searchTerm.toLowerCase();
    return lots.filter(l => 
      l.categoryId.toLowerCase().includes(term) || 
      l.variety.toLowerCase().includes(term) ||
      l.size.toLowerCase().includes(term)
    );
  }, [lots, searchTerm]);

  const handleSubmit = async () => {
    if (!window.confirm("Submit full room count?")) return;
    setLoading(true);
    
    try {
      const items: StockCountSessionItem[] = lots.map(lot => {
        const c = counts[lot.id];
        return {
          stockLotId: lot.id,
          categoryId: lot.categoryId,
          variety: lot.variety,
          size: lot.size,
          expectedQty: lot.expectedQty || 0,
          actualQty: c.actual,
          difference: c.actual - (lot.expectedQty || 0),
          reason: c.reason
        };
      });

      await submitStockCountSession({
        date: new Date().toISOString().split('T')[0],
        storeRoomId: selectedRoomId,
        storekeeperId: currentUser?.id || "unknown",
        storekeeperName: currentUser?.name || "Unknown",
        status: 'Pending Verification',
        timestamp: new Date().toISOString(),
        items
      });
      
      onSuccess("Inventory count session submitted for review!");
    } catch (e) {
      console.error(e);
      alert("Error submitting session");
    }
    setLoading(false);
  };

  const completedItems = Object.keys(counts).filter(id => counts[id].actual !== undefined).length;
  const progressPercent = lots.length > 0 ? Math.round((completedItems / lots.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
            <h2 className="text-white font-bold tracking-wide">Count Worksheet</h2>
          </div>
          <div className="text-right">
             <div className="text-emerald-400 font-bold text-sm">{completedItems} / {lots.length}</div>
             <div className="text-slate-500 text-xs">Completed</div>
          </div>
        </div>
        
        {lots.length > 0 && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{width: `${progressPercent}%`}}></div>
          </div>
        )}
      </header>
      
      <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <RoomSelectorCards 
          rooms={storeRooms} 
          selectedRoomId={selectedRoomId} 
          onSelect={setSelectedRoomId} 
          label="Target Room" 
        />
        
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Jump to product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500"
          />
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? <div className="text-center text-white p-4">Loading lots...</div> : filteredLots.length === 0 ? <div className="text-center text-slate-500 p-4">No matching lots found.</div> : filteredLots.map(lot => {
          const c = counts[lot.id];
          const diff = (c?.actual || 0) - (lot.expectedQty || 0);
          return (
            <div 
              key={lot.id} 
              ref={el => itemRefs.current[lot.id] = el}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-white font-bold">{lot.categoryId} <span className="text-slate-400 font-normal">›</span> {lot.variety}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Size: {lot.size} {lot.originCountry ? `| ${lot.originCountry}` : ''}</div>
                </div>
                <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-300">
                  Exp: {lot.expectedQty || 0}
                </div>
              </div>
              
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Act</span>
                  <input 
                    type="number"
                    value={c?.actual === undefined ? '' : c.actual}
                    onChange={e => setCounts(prev => ({...prev, [lot.id]: {...prev[lot.id], actual: parseInt(e.target.value) || 0}}))}
                    className={`w-20 bg-slate-950 border text-white p-2 rounded-lg text-center font-bold text-lg ${diff !== 0 ? 'border-orange-500' : 'border-slate-700'}`}
                  />
                </div>
                <div className="flex-1">
                   {diff !== 0 && (
                     <div className={`text-xs font-bold px-2 py-1 rounded w-fit ${diff > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{diff} Diff
                     </div>
                   )}
                </div>
              </div>
              
              {diff !== 0 && (
                <div className="mt-3">
                  <input 
                    type="text" 
                    placeholder="Reason for difference..."
                    value={c?.reason || ''}
                    onChange={e => setCounts(prev => ({...prev, [lot.id]: {...prev[lot.id], reason: e.target.value}}))}
                    className="w-full bg-slate-950 border border-orange-900/50 text-orange-200 text-sm p-2 rounded-lg placeholder-orange-900/40"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <button 
          onClick={handleSubmit} 
          disabled={loading || lots.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-lg"
        >
          <Save className="w-5 h-5" /> Submit Complete Count
        </button>
      </div>
    </div>
  );
}
