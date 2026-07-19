import React from 'react';
import { ArrowLeft } from "lucide-react";

export function HistoryView({ onBack }: any) {
  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <h2 className="text-white font-bold tracking-wide">Activity History</h2>
      </header>
      <div className="flex-1 p-4 flex items-center justify-center text-slate-500">
        Feature coming soon. (History logs)
      </div>
    </div>
  );
}
