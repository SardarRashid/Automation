import React, { useState, useEffect } from 'react';
import { OfflineIndicator } from '../components/mobile/OfflineIndicator';
import { SuccessOverlay } from '../components/mobile/SuccessOverlay';

import { AIAssistant } from '../components/ui/AIAssistant';
import { Header } from './components/Header';
import { DailySheetView } from './components/DailySheetView';
import { MonthlyPivotView } from './components/MonthlyPivotView';
import { AnalyticsView } from './components/AnalyticsView';
import { InventorySupervisorDashboard } from '../components/dashboards/InventorySupervisorDashboard';
import { CategoryConsole } from './components/CategoryConsole';
import { AssignmentConsole } from './components/AssignmentConsole';
import { MobileStockTake } from './components/MobileStockTake';
import { StaffManagementView } from './components/StaffManagementView';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import { Lock, LogIn, UserCircle, LogOut } from 'lucide-react';

import { getCategoryTemplates, saveCategoryTemplate, getRecordsByDate, saveStoreRoom, deleteStoreRoom, getStoreRooms } from './services/dbService';
import type { CategoryTemplate, InventoryRecord, Storekeeper, StoreRoom } from './types';
import { database } from '../lib/firebase';
import { ref, get } from 'firebase/database';

interface InventoryAppProps {
  currentUser?: Storekeeper; // Optional now, since we use inventorySession
  onLogout?: () => void;
}

export default function InventoryApp({ currentUser: globalUser, onLogout: globalLogout }: InventoryAppProps) {
  const inventorySession = globalUser as any;

  
  // Login Gateway State
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState<CategoryTemplate[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [forceMobileMode, setForceMobileMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    if (!inventorySession) {
      setIsLoading(false); // Not logged in — stop spinner
      return;
    }
    setActiveTab("dashboard");
    setForceMobileMode(false);
  }, [inventorySession]);

  useEffect(() => {
    if (!inventorySession) return;
    async function loadInitialData() {
      try {
        const cats = await getCategoryTemplates();
        setCategories(cats);
        const rooms = await getStoreRooms();
        setStoreRooms(rooms);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false); // Always stop loading
      }
    }
    loadInitialData();
  }, [inventorySession]);

  useEffect(() => {
    if (!inventorySession) return;
    async function fetchDailyRecords() {
      try {
        const data = await getRecordsByDate(selectedDate);
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDailyRecords();
  }, [selectedDate, activeTab, inventorySession]);





  const handleLogout = () => { /* global auth handles this */ };

  const handleSaveCategory = async (updatedCategory: CategoryTemplate) => {
    try {
      await saveCategoryTemplate(updatedCategory);
      setCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === updatedCategory.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedCategory;
          return next;
        } else {
          return [...prev, updatedCategory];
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStoreRoom = async (room: StoreRoom) => {
    try {
      await saveStoreRoom(room);
      setStoreRooms((prev) => {
        const idx = prev.findIndex((r) => r.id === room.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = room;
          return next;
        } else {
          return [...prev, room];
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStoreRoom = async (id: string) => {
    try {
      await deleteStoreRoom(id);
      setStoreRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute animate-ping rounded-full h-16 w-16 bg-emerald-500 opacity-20"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
        <p className="text-emerald-50 font-medium animate-pulse tracking-wide">Initializing Inventory Workspace...</p>
      </div>
    );
  }

  // Gateway removed in V2, relying on global Auth

  // Mobile Stock Take View (When requested by clicking Handheld UI button)
  if (forceMobileMode) {
    return (
      <MobileStockTake 
        categories={categories} 
        currentUser={inventorySession} 
        onLogout={handleLogout} 
        showSuiteToggle={true}
        onToggleSuite={() => setForceMobileMode(false)}
        onBack={() => {
          if (window.location.search.includes('app=inventory_mobile')) {
            window.location.href = '/';
          } else {
            setForceMobileMode(false);
          }
        }}
        theme="light"
        onToggleTheme={() => {}}
      />
    );
  }

  // Supervisor View (Full Access)
  return (
    <div className="min-h-screen w-full bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] font-sans overflow-y-auto print:bg-white print:h-auto print:overflow-visible print:block selection:bg-emerald-500/30">
      <Header 
        currentUser={inventorySession}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        forceMobileMode={forceMobileMode}
        onToggleMobileMode={() => setForceMobileMode(true)}
      />
      
      {/* Secondary Navigation Action Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 py-3 overflow-x-auto items-center justify-between">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'daily'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Daily Sheet
              </button>
              <button
                onClick={() => setActiveTab('pivot')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'pivot'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Monthly Pivot
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Analytics
              </button>
              {inventorySession.role !== 'storekeeper' && (
                <>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'categories'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'assignments'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Assignments
                  </button>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'staff'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Staff
                  </button>
                </>
              )}
            </nav>
            <div className="flex items-center gap-3">
              {/* Note: The SyncStatusIndicator component should be used here if you have it imported */}
            </div>
          </div>
        </div>
      </div>

      <main className="w-full h-full p-4 sm:p-6 space-y-6 print:p-0 print:m-0">
        
        {activeTab === 'mobile-stock' && (
          <MobileStockTake 
            currentUser={inventorySession}
            categories={categories}
            onLogout={handleLogout}
            showSuiteToggle={true}
            onToggleSuite={() => setForceMobileMode(false)}
            onBack={() => {
              if (window.location.search.includes('app=inventory_mobile')) {
                window.location.href = '/';
              } else {
                setActiveTab('dashboard');
                setForceMobileMode(false);
              }
            }}
            theme="light"
            onToggleTheme={() => {}}
          />
        )}
        
        {activeTab === 'daily' && (
          <DailySheetView 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            categories={categories}
            currentUser={inventorySession}
          />
        )}

        {activeTab === 'dashboard' && (
          <InventorySupervisorDashboard onAction={(action, payload) => {
             if (action === 'navigate' && payload) setActiveTab(payload);
          }} />
        )}

        {activeTab === 'pivot' && (
          <MonthlyPivotView onSelectDate={setSelectedDate} onNavigateToTab={setActiveTab} currentUser={inventorySession} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView currentUser={inventorySession} />
        )}

        {activeTab === 'categories' && inventorySession.role !== 'storekeeper' && (
          <CategoryConsole categories={categories} onSaveCategory={handleSaveCategory} storeRooms={storeRooms} onSaveStoreRoom={handleSaveStoreRoom} onDeleteStoreRoom={handleDeleteStoreRoom} />
        )}

        {activeTab === 'assignments' && inventorySession.role !== 'storekeeper' && (
          <AssignmentConsole 
            categories={categories} 
            storeRooms={storeRooms} 
            onSaveStoreRoom={handleSaveStoreRoom} 
          />
        )}

        {activeTab === 'staff' && inventorySession.role !== 'storekeeper' && (
          <StaffManagementView categories={categories} storeRooms={storeRooms} />
        )}

      </main>
        <AIAssistant context="inventory" />
    </div>
  );
}


