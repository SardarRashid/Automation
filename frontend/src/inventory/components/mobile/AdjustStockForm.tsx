import React, { useState, useEffect } from 'react';
import { ArrowLeft } from "lucide-react";
import type { StockLot } from "../../types";
import { getActiveLotsInRoom, logMovement } from "../../services/movementService";
import { RoomSelectorCards } from "./RoomSelectorCards";

export function AdjustStockForm({ storeRooms, onBack, onSuccess, currentUser }: any) {
  const [roomId, setRoomId] = useState(storeRooms[0]?.id || "");
  const [lots, setLots] = useState<(StockLot & { expectedQty: number })[]>([]);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [adjQty, setAdjQty] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    async function load() {
      const roomLots = await getActiveLotsInRoom(roomId);
      setLots(roomLots as any[]);
      if (roomLots.length > 0) setSelectedLotId(roomLots[0].id);
    }
    load();
  }, [roomId]);

  const selectedLot = lots.find(l => l.id === selectedLotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return alert("Select room.");
    if (!selectedLot || adjQty === 0) return alert("Invalid adjustment quantity.");
    if (selectedLot.expectedQty + adjQty < 0) return alert("Cannot adjust below 0.");
    
    setLoading(true);
    try {
      await logMovement({
        roomId,
        stockLotId: selectedLotId,
        quantity: adjQty,
        type: 'ADJUSTMENT',
        notes: `Manual adjustment by ${currentUser?.name || "Storekeeper"}`,
        createdBy: currentUser?.id || "unknown"
      });
      onSuccess(`Successfully adjusted stock by ${adjQty}.`);
    } catch(err) {
      console.error(err);
      alert("Adjustment failed.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <h2 className="text-white font-bold tracking-wide">Stock Adjustment</h2>
      </header>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
        <RoomSelectorCards 
          rooms={storeRooms} 
          selectedRoomId={roomId} 
          onSelect={setRoomId} 
          label="Room" 
        />
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Lot</label>
          <select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg">
            {lots.map((l: any) => <option key={l.id} value={l.id}>{l.categoryId} - {l.variety} (Qty: {l.expectedQty})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Adjustment Quantity (Use +/-)</label>
          <input type="number" value={adjQty || ''} onChange={e => setAdjQty(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg font-bold text-lg" placeholder="-5 or +5" />
        </div>
      </form>
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
          Execute Adjustment
        </button>
      </div>
    </div>
  );
}
