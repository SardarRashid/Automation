import React, { useState, useEffect } from 'react';
import { ArrowLeft } from "lucide-react";
import { logMovement } from "../../services/movementService";
import { createStockLot } from "../../services/productService";
import { RoomSelectorCards } from "./RoomSelectorCards";

export function ReceiveShipmentForm({ storeRooms, categories, onBack, onSuccess, currentUser }: any) {
  const [roomId, setRoomId] = useState(storeRooms[0]?.id || "");
  const [categoryName, setCategoryName] = useState(categories[0]?.name || "");
  const [variety, setVariety] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);

  const activeTemplate = categories.find((c: any) => c.name === categoryName) || categories[0];

  useEffect(() => {
    if (activeTemplate) {
      if (activeTemplate.varieties?.length) setVariety(activeTemplate.varieties[0]);
      if (activeTemplate.sizes?.length) setSize(activeTemplate.sizes[0]);
    }
  }, [categoryName, activeTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return alert("Please select a room.");
    if (!variety || !size || quantity <= 0) return alert("Please fill all details correctly.");
    setLoading(true);
    
    try {
      // Create lot
      const lot = await createStockLot({
        categoryId: categoryName,
        variety,
        size,
        status: 'Received'
      });
      // Receive it
      await logMovement({
        roomId,
        stockLotId: lot.id,
        quantity,
        type: 'RECEIPT',
        notes: `Received manually by ${currentUser?.name || "Storekeeper"}`,
        createdBy: currentUser?.id || "unknown"
      });
      
      onSuccess(`Successfully received ${quantity} of ${variety} into ${storeRooms.find((r:any)=>r.id===roomId)?.name}`);
    } catch(err) {
      console.error(err);
      alert("Failed to receive shipment.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <h2 className="text-white font-bold tracking-wide">Receive Shipment</h2>
      </header>
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
        <RoomSelectorCards 
          rooms={storeRooms} 
          selectedRoomId={roomId} 
          onSelect={setRoomId} 
          label="Destination Room" 
        />
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
          <select value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg">
            {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Variety</label>
          <select value={variety} onChange={e => setVariety(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg">
            {activeTemplate?.varieties?.map((v: string) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Size</label>
          <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg">
            {activeTemplate?.sizes?.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantity Received</label>
          <input type="number" min="1" value={quantity || ''} onChange={e => setQuantity(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-lg font-bold text-lg" />
        </div>
      </form>
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50">
          Confirm Receipt
        </button>
      </div>
    </div>
  );
}
