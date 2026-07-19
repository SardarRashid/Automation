import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, ArrowRightLeft, Search, LogOut, Package,
  History, Settings, AppWindow, User, Edit
} from "lucide-react";
import type { CategoryTemplate, Storekeeper, StoreRoom } from "../types";
import { getStoreRooms } from "../services/dbService";

// Import extracted components
import { InventoryCountWorksheet } from "./mobile/InventoryCountWorksheet";
import { ReceiveShipmentForm } from "./mobile/ReceiveShipmentForm";
import { TransferStockForm } from "./mobile/TransferStockForm";
import { AdjustStockForm } from "./mobile/AdjustStockForm";
import { RoomInventoryView } from "./mobile/RoomInventoryView";
import { HistoryView } from "./mobile/HistoryView";
import { MobileErrorBoundary } from "./mobile/MobileErrorBoundary";

type ActiveScreen = 'HUB' | 'RECEIVE' | 'COUNT' | 'TRANSFER' | 'ADJUST' | 'ROOM_INV' | 'HISTORY';

interface MobileStockTakeProps {
  categories: CategoryTemplate[];
  currentUser: Storekeeper;
  onLogout: () => void;
  showSuiteToggle?: boolean;
  onToggleSuite?: () => void;
  onBack?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function MobileStockTake({ 
  categories, 
  currentUser, 
  onLogout, 
  showSuiteToggle = false, 
  onToggleSuite,
  onBack,
  theme = "dark",
  onToggleTheme
}: MobileStockTakeProps) {
  
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('HUB');
  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadRooms() {
      const rooms = await getStoreRooms();
      setStoreRooms(rooms);
    }
    loadRooms();
  }, []);

  const assignedStoresList = React.useMemo(() => {
    if (!currentUser?.assignedStoreNum || currentUser.assignedStoreNum === "All") {
      if (storeRooms.length > 0) return storeRooms;
      return [];
    }
    const assignedIds = currentUser.assignedStoreNum.split(",").map((s: string) => s.trim().toLowerCase());
    return storeRooms.filter((r: any) => assignedIds.includes(r.name.toLowerCase()));
  }, [currentUser?.assignedStoreNum, storeRooms]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setActiveScreen('HUB');
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const HubButton = ({ icon: Icon, label, onClick, primary = false, disabled = false }: any) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl shadow-lg transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800' :
        primary 
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02]' 
          : 'bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${primary ? 'bg-white/20' : 'bg-slate-800'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="font-bold text-lg">{label}</span>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${primary ? 'bg-white/20' : 'bg-slate-800'}`}>
        <span className="text-xl">›</span>
      </div>
    </button>
  );

  const renderHeader = (title: string, backToHub: boolean = false) => (
    <header className="border-b border-slate-800 bg-slate-950 p-4 shrink-0 z-50 shadow-lg">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {showSuiteToggle && activeScreen === 'HUB' && (
          <button onClick={onToggleSuite} className="text-slate-400 hover:text-white p-2 flex items-center gap-2 bg-slate-900 rounded-lg border border-slate-800 transition-colors">
            <AppWindow className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Switch to App</span>
          </button>
        )}
      </div>
    </header>
  );

  return (
    <MobileErrorBoundary>
      <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
        
        {successMsg && (
          <div className="absolute top-4 left-4 right-4 bg-emerald-500 text-white p-4 rounded-xl shadow-2xl z-[100] font-bold text-center animate-bounce">
            {successMsg}
          </div>
        )}

      {activeScreen === 'HUB' && (
        <>
          {renderHeader("Operations Hub")}
          <main className="flex-1 overflow-y-auto w-full p-4">
            <div className="max-w-lg mx-auto space-y-6">
              
              <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{currentUser?.name || "Storekeeper"}</h2>
                  <p className="text-sm text-emerald-400 font-mono">{currentUser?.role?.toUpperCase() || "STOREKEEPER"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Daily Tasks</h3>
                <HubButton icon={Package} label="Receive Shipment" primary onClick={() => setActiveScreen('RECEIVE')} />
                <HubButton icon={ClipboardList} label="Inventory Count" primary onClick={() => setActiveScreen('COUNT')} />
                <HubButton icon={ArrowRightLeft} label="Transfer Stock" onClick={() => setActiveScreen('TRANSFER')} />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Stock Management</h3>
                <HubButton icon={Search} label="Room Inventory" onClick={() => setActiveScreen('ROOM_INV')} />
                <HubButton icon={Edit} label="Stock Adjustment" onClick={() => setActiveScreen('ADJUST')} />
                <HubButton icon={History} label="History & Reports" onClick={() => setActiveScreen('HISTORY')} />
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <button
                  onClick={onLogout}
                  className="w-full bg-slate-900 border border-red-900/50 text-red-400 font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-red-950 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          </main>
        </>
      )}

      {activeScreen === 'RECEIVE' && (
        <ReceiveShipmentForm
          storeRooms={assignedStoresList}
          categories={categories}
          onBack={() => setActiveScreen('HUB')}
          onSuccess={showSuccess}
          currentUser={currentUser}
        />
      )}

      {activeScreen === 'COUNT' && (
        <InventoryCountWorksheet 
          storeRooms={assignedStoresList}
          currentUser={currentUser}
          onBack={() => setActiveScreen('HUB')}
          onSuccess={showSuccess}
        />
      )}

      {activeScreen === 'TRANSFER' && (
        <TransferStockForm
          assignedStores={assignedStoresList}
          storeRooms={storeRooms}
          onBack={() => setActiveScreen('HUB')}
          onSuccess={showSuccess}
          currentUser={currentUser}
        />
      )}

      {activeScreen === 'ADJUST' && (
        <AdjustStockForm
          storeRooms={assignedStoresList}
          onBack={() => setActiveScreen('HUB')}
          onSuccess={showSuccess}
          currentUser={currentUser}
        />
      )}

      {activeScreen === 'ROOM_INV' && (
        <RoomInventoryView
          storeRooms={storeRooms}
          onBack={() => setActiveScreen('HUB')}
        />
      )}

      {activeScreen === 'HISTORY' && (
        <HistoryView
          onBack={() => setActiveScreen('HUB')}
        />
      )}
      
      </div>
    </MobileErrorBoundary>
  );
}
