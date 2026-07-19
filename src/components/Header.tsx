import React from "react";
import { Cloud, CloudLightning, Apple, Globe, Sparkles, Sun, Moon } from "lucide-react";
import SyncStatusIndicator from "./SyncStatusIndicator";

interface HeaderProps {
  currentDate: string;
  isOnline: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Header({ currentDate, isOnline, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-green-800 via-emerald-905 to-green-900 text-white shadow-lg border-b-4 border-yellow-450">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
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

        {/* Status Indicators & Branding */}
        <div className="flex flex-wrap items-center gap-3">
          {/* HIGH-CONTRAST THEME SWITCHER */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.03] active:scale-[0.98] ${
              theme === "dark"
                ? "bg-yellow-450 hover:bg-yellow-400 text-green-950 border-yellow-350"
                : "bg-slate-900 hover:bg-slate-850 text-white border-slate-700"
            }`}
            title={theme === "dark" ? "Switch to Office Bright Light Mode" : "Switch to Coldroom Dark High-Contrast Mode"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-green-950 stroke-[2.5]" />
                <span>Office Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-yellow-350 fill-yellow-350 stroke-[2]" />
                <span>Coldroom Dark</span>
              </>
            )}
          </button>

          {/* Cloud Auto-Save Status */}
          <SyncStatusIndicator />

          {/* Current Date Display */}
          <div className="bg-green-950/60 px-4 py-1.5 rounded-lg border border-green-700/50 text-yellow-350 text-sm font-semibold flex items-center gap-2">
            <span className="text-xs text-green-300 uppercase font-mono tracking-wider">Audit Date:</span>
            <span>{currentDate}</span>
          </div>
        </div>

      </div>
    </header>
  );
}

