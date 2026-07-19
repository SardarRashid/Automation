import React from 'react';
import { Package } from "lucide-react";
import type { StoreRoom } from "../../types";

interface RoomSelectorCardsProps {
  rooms: StoreRoom[];
  selectedRoomId: string;
  onSelect: (id: string) => void;
  label?: string;
}

export function RoomSelectorCards({ rooms, selectedRoomId, onSelect, label = "Select Room" }: RoomSelectorCardsProps) {
  if (!rooms || rooms.length === 0) {
    return <div className="text-slate-500 text-sm italic py-2">No rooms available</div>;
  }
  
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {rooms.map(r => {
          const isSelected = selectedRoomId === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={`snap-start shrink-0 w-32 p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                isSelected 
                  ? 'bg-emerald-900 border-emerald-500 text-white shadow-md shadow-emerald-900/50' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Package className={`w-6 h-6 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="font-bold text-xs text-center line-clamp-2">{r.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
