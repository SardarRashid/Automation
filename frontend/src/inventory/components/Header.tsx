import React, { useState } from 'react';
import { Cloud, CloudLightning, Apple, Globe, Sparkles, Sun, Moon, LogOut } from "lucide-react";
import SyncStatusIndicator from "./SyncStatusIndicator";
import type { Storekeeper } from '../types';

interface HeaderProps {
  currentUser: Storekeeper;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  forceMobileMode: boolean;
  onToggleMobileMode: () => void;
}

export function Header({ currentUser, onLogout, activeTab, onTabChange, forceMobileMode, onToggleMobileMode }: HeaderProps) {
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-950 text-white shadow-2xl shadow-emerald-900/20 border-b border-emerald-700/50 relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500 opacity-10 blur-3xl mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-emerald-400 opacity-10 blur-2xl mix-blend-screen pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-5 relative z-10">
        
        {/* Title Brand with Golden Fruit Accent & Corporate Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 bg-white rounded-2xl border-2 border-yellow-450 shadow-md flex items-center justify-center p-1 hover:scale-[1.03] transition-transform">
            <img 
              src="https://seeklogo.com/images/S/sharbatly-fruit-logo-A917F9ACDC-seeklogo.com.png" 
              alt="M. A. Sharbatly Co. Logo" 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -top-1 -right-1 bg-green-700 text-[9px] text-yellow-350 font-black px-1.5 py-0.5 rounded-full border border-yellow-400">
              KSA
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-sans font-extrabold tracking-tight text-white drop-shadow-sm">
                M. A. Sharbatly Co.
              </h1>
              <span className="hidden sm:inline-block bg-yellow-450 text-green-950 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full font-sans tracking-wide">
                Sharbatly Fruit
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-green-100 font-medium font-sans">
              <span className="tracking-wider uppercase font-bold text-yellow-350">
                Muhammad Abdullah Sharbatly Fruit
              </span>
              <span className="hidden sm:inline text-green-300/60">|</span>
              <span className="text-green-250 font-sans flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-yellow-400" />
                Saudi Arabia Cold Chain Network (المملكة العربية السعودية)
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - MOVED TO InventoryApp.tsx action bar */}

        {/* Status Indicators & Branding */}
        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 md:mt-0 flex-1 md:flex-none">
          {!forceMobileMode && (
            <button
              onClick={onToggleMobileMode}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg font-extrabold font-sans text-[11px] uppercase transition-all flex items-center gap-1 shadow-sm hover:scale-[1.02]"
              title="Switch to Mobile Handheld screen"
            >
              <span>📱</span>
              Handheld UI
            </button>
          )}

          

          <SyncStatusIndicator />

          {/* Current Date Display */}
          <div className="bg-green-950/60 px-3 py-1.5 rounded-lg border border-green-700/50 text-yellow-350 text-sm font-semibold flex items-center gap-2">
            <span>{currentDate}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg transition-colors text-sm font-semibold border border-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
}
