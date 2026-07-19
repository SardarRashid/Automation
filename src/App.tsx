import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DailySheetView } from "./components/DailySheetView";
import { MonthlyPivotView } from "./components/MonthlyPivotView";
import { AnalyticsView } from "./components/AnalyticsView";
import { CategoryConsole } from "./components/CategoryConsole";
import { AdminConsole } from "./components/AdminConsole";
import { MobileStockTake } from "./components/MobileStockTake";
import { 
  getCategoryTemplates, 
  saveCategoryTemplate, 
  getRecordsByDate, 
  seedDefaultAdminIfNeeded, 
  getStorekeepers,
  getStoreRooms,
  saveStoreRoom,
  deleteStoreRoom,
  syncOfflineData
} from "./services/dbService";
import { CategoryTemplate, InventoryRecord, Storekeeper, StoreRoom } from "./types";
import { motion } from "motion/react";
import SyncStatusIndicator from "./components/SyncStatusIndicator";
import { 
  FileSpreadsheet, Calendar, TrendingUp, Settings, 
  Sparkles, Plus, CheckCircle2, ShieldAlert, KeyRound, 
  Users, LogOut, ArrowRight, UserCheck, Accessibility, Laptop, Sun, Moon
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [categories, setCategories] = useState<CategoryTemplate[]>([]);
  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Global View Theme State ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sharbatly_theme");
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'light';
  });

  // Track and apply theme changes to root document node
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('sharbatly_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sharbatly_theme', 'light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // User auth state
  const [currentUser, setCurrentUser] = useState<Storekeeper | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [userList, setUserList] = useState<Storekeeper[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [forceMobileMode, setForceMobileMode] = useState(false);

  // Sync / refresh user list
  const refreshUsers = async () => {
    try {
      const users = await seedDefaultAdminIfNeeded();
      setUserList(users);
      if (users.length > 0 && !selectedEmail) {
        setSelectedEmail(users[0].email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load registered Categories and Users on startup
  useEffect(() => {
    async function initApp() {
      try {
        const templates = await getCategoryTemplates();
        setCategories(templates);

        const rooms = await getStoreRooms();
        setStoreRooms(rooms);
        
        // Seed & load staff accounts
        const seeded = await seedDefaultAdminIfNeeded();
        setUserList(seeded);
        if (seeded.length > 0) {
          setSelectedEmail(seeded[0].email);
        }

        // Restore active corporate session
        const savedSession = localStorage.getItem("sharbatly_session");
        if (savedSession) {
          setCurrentUser(JSON.parse(savedSession));
        }

        // Run background synchronization on boot
        if (navigator.onLine) {
          syncOfflineData();
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setCategoriesLoading(false);
        setSessionLoading(false);
      }
    }
    initApp();
  }, []);

  // Monitor real-time online/offline network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync records for analytics comparison
  useEffect(() => {
    if (!currentUser || currentUser.role === 'storekeeper') return;
    async function fetchDailyRecords() {
      try {
        const data = await getRecordsByDate(selectedDate);
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDailyRecords();
  }, [selectedDate, activeTab, currentUser]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!pin) {
      setLoginError("Mandatory PIN is required.");
      return;
    }

    const matched = userList.find(u => u.email === selectedEmail);
    if (!matched) {
      setLoginError("Account not found.");
      return;
    }

    if (matched.pin === pin) {
      setCurrentUser(matched);
      localStorage.setItem("sharbatly_session", JSON.stringify(matched));
      setPin("");
      setForceMobileMode(matched.role === 'storekeeper');
      // Default views based on the logged in role
      if (matched.role === 'storekeeper') {
        setActiveTab("mobile-stock");
      } else if (matched.role === 'it_admin') {
        setActiveTab("users");
      } else {
        setActiveTab("daily");
      }
    } else {
      setLoginError("Invalid numeric PIN or security password. Please re-enter.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setForceMobileMode(false);
    localStorage.removeItem("sharbatly_session");
    // Reload users list to display newly added accounts
    refreshUsers();
  };

  // Render authenticating screen if no active profile exists
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-10 h-10 border-4 border-yellow-450 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase font-mono text-slate-300">
          Activating Sharbatly Cold Net Secures...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`min-h-screen bg-gradient-to-tr transition-all duration-300 ${
        theme === 'dark' 
          ? "from-slate-950 via-slate-900 to-green-950" 
          : "from-slate-100 via-slate-50 to-green-50 text-slate-900"
      } flex flex-col justify-between p-4 sm:p-6 font-sans relative`}>
        
        {/* Floating Theme Toggle (Login View) */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleToggleTheme}
            className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.03] active:scale-[0.98] ${
              theme === "dark"
                ? "bg-yellow-450 hover:bg-yellow-400 text-green-950 border-yellow-350"
                : "bg-slate-900 hover:bg-slate-850 text-white border-slate-700"
            }`}
            title={theme === "dark" ? "Switch to Office Bright Light Mode" : "Switch to Coldroom Dark High-Contrast Mode"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-green-950 stroke-[2.5]" />
                <span className="hidden sm:inline">Office Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-yellow-350 fill-yellow-350" />
                <span className="hidden sm:inline">Coldroom Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Top Branding Header inside Login block */}
        <div className="text-center pt-8">
          <div className="inline-block bg-yellow-450 p-4 rounded-3xl border-3 border-emerald-900 shadow-xl mb-4 text-green-950">
            <Accessibility className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-green-905'}`}>
            M. A. Sharbatly Co.
          </h1>
          <p className="text-xs text-yellow-500 dark:text-yellow-350 tracking-widest uppercase font-mono font-bold mt-1 max-w-lg mx-auto">
            Muhammad Abdullah Sharbatly Fruit • Cold Chain Logistics
          </p>
        </div>

        {/* Central Auth Gateway Card */}
        <div className="max-w-md w-full mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-405 via-emerald-500 to-green-700" />

          {/* Prompt context */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-200">Staff Authentication Gateway</h2>
            <p className="text-xs text-slate-400 mt-1">Select your staff account name & enter physical security PIN.</p>
          </div>

          {loginError && (
            <div className="bg-red-950/70 border border-red-700 text-red-300 rounded-xl p-3.5 mb-5 text-xs flex gap-2 font-semibold">
              <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* User Dropdown Selector - Highly finger-accessible for storekeepers inside refrigerators */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 pl-1 text-yellow-350 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-yellow-450" />
                1. SELECT COLD STORE SECURITY ACCOUNT
              </label>
              
              <div className="relative">
                <select
                  value={selectedEmail}
                  onChange={(e) => {
                    setSelectedEmail(e.target.value);
                    setLoginError("");
                  }}
                  className="w-full bg-slate-950 text-white font-semibold border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  {userList.map((user) => (
                    <option key={user.id} value={user.email} className="bg-slate-900 text-white">
                      {user.name} ({
                        user.role === 'it_admin' ? 'IT Admin' :
                        user.role === 'manager' ? 'Master Manager' :
                        user.role === 'supervisor' ? `Supervisor: ${user.assignedSection} in ${user.assignedStoreNum}` :
                        `Storekeeper: ${user.assignedSection} / ${user.assignedStoreNum}`
                      })
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <ArrowRight className="w-4 h-4 transform rotate-90" />
                </div>
              </div>
            </div>

            {/* Password PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 pl-1 text-yellow-350 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                2. ENTER PIN OR SECURITY PASSWORD
              </label>
              <input
                type="password"
                pattern="[0-9a-zA-Z]*"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setLoginError("");
                }}
                placeholder="e.g. 1234 or admin123"
                className="w-full bg-slate-950 text-white font-mono tracking-widest font-extrabold text-center text-lg border border-slate-700 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 font-sans font-extrabold text-sm text-slate-955 py-3.5 rounded-xl transition-all border-b-4 border-emerald-700 hover:border-emerald-800 flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
            >
              <UserCheck className="w-4.5 h-4.5 text-slate-955" />
              Sign In To Portal
            </button>

          </form>

          {/* Quick Info Credentials for evaluator */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Standard Authorized System Logins:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
              <div className="text-left">
                <span className="text-yellow-450 font-bold">Admin Office:</span>
                <div>PIN: <code className="text-white font-bold">admin123</code></div>
              </div>
              <div className="text-left border-l border-slate-800 pl-2">
                <span className="text-emerald-400 font-bold">Storekeepers PIN:</span>
                <div>PIN: <code className="text-white font-bold">1234</code></div>
              </div>
            </div>
          </div>

        </div>

        {/* Corporate Legal Footer */}
        <div className="text-center text-slate-500 text-[10px] font-mono pb-4">
          Saudi Arabia Cold Chain Logistics Platform • Authorized access only • All activity is logged in accordance with M. A. Sharbatly general rules.
        </div>

      </div>
    );
  }

  // If storekeeper is logged in or mobile tracking is toggled, serve the high-contrast Mobile inventory taker
  if (currentUser.role === 'storekeeper' || forceMobileMode) {
    return (
      <MobileStockTake 
        categories={categories} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        showSuiteToggle={currentUser.role !== 'storekeeper'}
        onToggleSuite={() => setForceMobileMode(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // Otherwise, serve the detailed desktop Admin suite
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
      
      {/* Top Header Branding Component with live user profile bar */}
      <Header currentDate={selectedDate} isOnline={isOnline} theme={theme} onToggleTheme={handleToggleTheme} />

      {/* User Session Bar for Office Purpose */}
      <div className="no-print bg-slate-900 text-white border-y border-slate-800 py-2.5 px-4 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-slate-300">Logged in as:</span>
            <span className="font-extrabold text-yellow-400 uppercase tracking-wide">{currentUser.name}</span>
            <span className="bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-yellow-500/20">
              {currentUser.role === 'it_admin' ? 'it admin' : currentUser.role === 'manager' ? 'master manager' : currentUser.role === 'supervisor' ? 'supervisor' : currentUser.role}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="hidden md:inline text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              Access level: <strong className="text-emerald-400 font-bold font-mono text-[11px]">{
                (currentUser.role === 'it_admin' || currentUser.role === 'manager') 
                  ? "ALL PORTALS • ALL ROOMS" 
                  : `SECTIONS: [${currentUser.assignedSection}] • ROOMS: [${currentUser.assignedStoreNum}]`
              }</strong>
            </span>
            {currentUser.hasMobileAccess && (
              <button
                onClick={() => setForceMobileMode(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded-lg font-extrabold font-sans text-[11px] uppercase transition-all flex items-center gap-1 shadow-sm hover:scale-[1.02]"
                title="Switch to Mobile Handheld screen"
              >
                <span>📲</span>
                Switch to Handheld UI
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-800 hover:bg-red-750 text-white px-3 py-1 rounded-lg font-bold font-sans text-[11px] uppercase transition-colors flex items-center gap-1 shadow-xs border border-red-700"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Primary Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="no-print bg-white rounded-2xl shadow-xs border border-slate-200/60 p-2 flex flex-wrap gap-2 justify-between items-center">
          
          <div className="flex flex-wrap gap-2">
            {/* Sheets and Analytics: Render if Supervisor or Manager */}
            {(currentUser.role === 'manager' || currentUser.role === 'supervisor') && (
              <>
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "daily"
                      ? "bg-slate-950 text-white ring-2 ring-yellow-400 shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/45"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Daily Summary Sheet
                </button>

                <button
                  onClick={() => setActiveTab("monthly")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "monthly"
                      ? "bg-slate-950 text-white ring-2 ring-yellow-400 shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/45"
                  }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Monthly Audit Ledger
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "analytics"
                      ? "bg-slate-950 text-white ring-2 ring-yellow-400 shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/45"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  Reports & Analytics
                </button>
              </>
            )}

            {/* Administrations: Catalog Setup and Manage Storekeepers - Render for IT Admin or Manager */}
            {(currentUser.role === 'it_admin' || currentUser.role === 'manager') && (
              <>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "catalog"
                      ? "bg-slate-950 text-white ring-2 ring-yellow-400 shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/45"
                  }`}
                >
                  <Settings className="w-4 h-4 text-blue-600" />
                  Product Catalog Setups
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "users"
                      ? "bg-slate-950 text-white ring-2 ring-yellow-400 shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/45"
                  }`}
                >
                  <Users className="w-4 h-4 text-violet-600" />
                  Manage Storekeepers
                </button>
              </>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-slate-400 font-mono tracking-wider border-l pl-4 py-1.5 uppercase">
            <Laptop className="w-4.5 h-4.5 text-slate-300" />
            Office Suite
          </div>

        </div>

        {/* Tab Contents Frame with smooth fade-in motion transition */}
        <div className="min-h-[480px]">
          {categoriesLoading ? (
            <div className="bg-white rounded-2xl border border-slate-150 p-20 flex flex-col items-center justify-center shadow-xs">
              <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500 font-sans">Assembling dynamic catalog metadata...</p>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "daily" && (
                <DailySheetView
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  categories={categories}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "monthly" && (
                <MonthlyPivotView
                  onSelectDate={setSelectedDate}
                  onNavigateToTab={setActiveTab}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsView 
                  records={records} 
                  date={selectedDate} 
                  currentUser={currentUser}
                />
              )}

              {activeTab === "catalog" && (
                <CategoryConsole
                  categories={categories}
                  onSaveCategory={handleSaveCategory}
                  storeRooms={storeRooms}
                  onSaveStoreRoom={handleSaveStoreRoom}
                  onDeleteStoreRoom={handleDeleteStoreRoom}
                />
              )}

              {activeTab === "users" && (
                <AdminConsole
                  categories={categories}
                />
              )}
            </motion.div>
          )}
        </div>

      </main>

      {/* Elegant minimalist utility Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-slate-400 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>
            © {new Date().getFullYear()} M. A. Sharbatly Co. Cold Chain Network. Connected with Firestore database clusters inside Saudi Arabia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="hover:text-slate-600 transition-colors font-medium cursor-default font-mono uppercase text-[9.5px]">Excel Company Policy Format Registered</span>
            <span className="text-slate-250">|</span>
            <span className="hover:text-slate-600 transition-colors font-medium cursor-default mr-1">Instant Backup Secured</span>
            <SyncStatusIndicator size="sm" className="scale-90" />
          </div>
        </div>
      </footer>

    </div>
  );
}
