import React, { useState, useEffect } from 'react';
import { ArrowLeft } from "lucide-react";
import type { StockLot } from "../../types";
import { getActiveLotsInRoom, logMovement } from "../../services/movementService";
import { RoomSelectorCards } from "./RoomSelectorCards";

export function TransferStockForm({ storeRooms, assignedStores, onBack, onSuccess, currentUser }: any) {
  const [sourceRoomId, setSourceRoomId] = useState(assignedStores[0]?.id || "");
  const [destRoomId, setDestRoomId] = useState(storeRooms[0]?.id || "");
  const [lots, setLots] = useState<(StockLot & { expectedQty: number })[]>([]);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [transferQty, setTransferQty] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sourceRoomId) return;
    async function load() {
      const roomLots = await getActiveLotsInRoom(sourceRoomId);
      setLots(roomLots as any[]);
      if (roomLots.length > 0) setSelectedLotId(roomLots[0].id);
    }
    load();
  }, [sourceRoomId]);

  const selectedLot = lots.find(l => l.id === selectedLotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRoomId || !destRoomId) return alert("Select rooms.");
    if (!selectedLot || transferQty <= 0 || transferQty > selectedLot.expectedQty) return alert("Invalid transfer quantity.");
    if (sourceRoomId === destRoomId) return alert("Cannot transfer to the same room.");
    
    setLoading(true);
    try {
      // Transfer OUT
      await logMovement({
        roomId: sourceRoomId,
        stockLotId: selectedLotId,
        quantity: -transferQty,
        type: 'TRANSFER_OUT',
        notes: `Transfer by ${currentUser?.name || "Storekeeper"}`,
        createdBy: currentUser?.id || "unknown"
      });
      // Transfer IN
      await logMovement({
        roomId: destRoomId,
        stockLotId: selectedLotId,
        quantity: transferQty,
        type: 'TRANSFER_IN',
        notes: `Transfer by ${currentUser?.name || "Storekeeper"}`,
        createdBy: currentUser?.id || "unknown"
      });
      onSuccess(`Successfully transferred ${transferQty} items.`);
    } catch(err) {
      console.error(err);
      alert("Transfer failed.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <h2 className="text-white font-bold tracking-wide">Transfer Stock</h2>
      </header>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
        <RoomSelectorCards 
          rooms={assignedStores} 
          selectedRoomId={sourceRoomId} 
          onSelect={setSourceRoomId} 
          label="From Room" 
        />
        
        <RoomSelectorCards 
          rooms={storeRooms} 
          selectedRoomId={destRoomId} 
          onSelect={setDestRoomId} 
          label="To Room" 
        />
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Lot</label>
          <select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg">
            {lots.map((l: any) => <option key={l.id} value={l.id}>{l.categoryId} - {l.variety} (Qty: {l.expectedQty})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Transfer Quantity (Max: {selectedLot?.expectedQty || 0})</label>
          <input type="number" min="1" max={selectedLot?.expectedQty || 0} value={transferQty || ''} onChange={e => setTransferQty(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg font-bold text-lg" />
        </div>
      </form>
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
          Execute Transfer
        </button>
      </div>
    </div>
  );
}
