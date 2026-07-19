import React, { useState, useEffect } from 'react';
import { 
  Users, Package, TrendingUp, ShoppingBag, DollarSign, FileSpreadsheet, Sun, Moon, LogOut 
} from 'lucide-react';
import { SalesmanAdminProvider } from './SalesmanAdminContext';

import { SalesSupervisorDashboard } from '../../components/dashboards/SalesSupervisorDashboard';
import UsersComponent from './components/Users';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Payments from './components/Payments';
import Reports from './components/Reports';

function SalesmanAdminApp() {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'inventory' | 'customers' | 'orders' | 'finance' | 'sheets'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard HQ', icon: TrendingUp },
    { id: 'users', label: 'Field Agents', icon: Users },
    { id: 'inventory', label: 'Master Inventory', icon: Package },
    { id: 'customers', label: 'Client Directory', icon: Users },
    { id: 'orders', label: 'Orders Hub', icon: ShoppingBag },
    { id: 'finance', label: 'Collections', icon: DollarSign },
    { id: 'sheets', label: 'Reports', icon: FileSpreadsheet },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'} font-sans`}>
      {/* Top Header */}
      <header className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b sticky top-0 z-40 shadow-sm transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'} tracking-tight`}>RouteSales<span className="text-blue-600">Pro</span></h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block -mt-1">HQ Command Center</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={toggleDarkMode} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="flex items-center space-x-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors" onClick={() => window.location.href = '/'}>
              <span>Exit HQ</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm inline-flex">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeSubTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
              id={`${item.id}-tab-btn`}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeSubTab === 'dashboard' && <SalesSupervisorDashboard onAction={(a) => setActiveTab(a)} />}
        {activeSubTab === 'users' && <UsersComponent />}
        {activeSubTab === 'inventory' && <Products />}
        {activeSubTab === 'customers' && <Customers />}
        {activeSubTab === 'orders' && <Orders />}
        {activeSubTab === 'finance' && <Payments />}
        {activeSubTab === 'sheets' && <Reports />}
      </main>
    </div>
  );
}

export default function SalesmanAdmin() {
  return (
    <SalesmanAdminProvider>
      <SalesmanAdminApp />
    </SalesmanAdminProvider>
  );
}
