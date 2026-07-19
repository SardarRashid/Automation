import React, { useState, useEffect } from 'react';
import { ArrowLeft } from "lucide-react";
import type { StockLot } from "../../types";
import { getActiveLotsInRoom } from "../../services/movementService";
import { RoomSelectorCards } from "./RoomSelectorCards";

export function RoomInventoryView({ storeRooms, onBack }: any) {
  const [roomId, setRoomId] = useState(storeRooms[0]?.id || "");
  const [lots, setLots] = useState<(StockLot & { expectedQty: number })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    async function load() {
      setLoading(true);
      const roomLots = await getActiveLotsInRoom(roomId);
      setLots(roomLots as any[]);
      setLoading(false);
    }
    load();
  }, [roomId]);

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <h2 className="text-white font-bold tracking-wide">Room Inventory</h2>
      </header>
      <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <RoomSelectorCards 
          rooms={storeRooms} 
          selectedRoomId={roomId} 
          onSelect={setRoomId} 
          label="Select Room" 
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? <div className="text-white text-center">Loading...</div> : lots.length === 0 ? <div className="text-slate-500 text-center">Empty Room</div> : lots.map(l => (
          <div key={l.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
            <div>
              <div className="font-bold text-white">{l.categoryId} - {l.variety}</div>
              <div className="text-xs text-slate-400">Size: {l.size}</div>
            </div>
            <div className="text-emerald-400 font-bold text-xl">{l.expectedQty}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
