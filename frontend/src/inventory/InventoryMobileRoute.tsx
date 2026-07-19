import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DailySheetView } from './components/DailySheetView';
import { MonthlyPivotView } from './components/MonthlyPivotView';
import { AnalyticsView } from './components/AnalyticsView';
import { CategoryConsole } from './components/CategoryConsole';
import { AssignmentConsole } from './components/AssignmentConsole';
import { MobileStockTake } from './components/MobileStockTake';
import { StaffManagementView } from './components/StaffManagementView';
import SyncStatusIndicator from './components/SyncStatusIndicator';

import { getCategoryTemplates, saveCategoryTemplate, getRecordsByDate, saveStoreRoom, deleteStoreRoom, getStoreRooms } from './services/dbService';
import type { CategoryTemplate, InventoryRecord, Storekeeper, StoreRoom } from './types';
import { database } from '../lib/firebase';
import { ref, get } from 'firebase/database';

interface InventoryAppProps {
  currentUser: Storekeeper;
  onLogout: () => void;
}

export default function InventoryMobileRoute({ currentUser, onLogout }: InventoryAppProps) {
  const [activeTab, setActiveTab] = useState('daily');
  const [categories, setCategories] = useState<CategoryTemplate[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const cats = await getCategoryTemplates();
        setCategories(cats);
        const rooms = await getStoreRooms();
        setStoreRooms(rooms);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function fetchDailyRecords() {
      try {
        const data = await getRecordsByDate(selectedDate);
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDailyRecords();
  }, [selectedDate, activeTab]);

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

  // Mobile Stock Take View (Always On - V1 UI with V2 Backend)
  return (
    <MobileStockTake 
      categories={categories} 
      currentUser={currentUser} 
      onLogout={onLogout} 
      showSuiteToggle={false}
      onToggleSuite={() => {}}
      onBack={() => {
        window.location.href = '/';
      }}
      theme="light"
      onToggleTheme={() => {}}
    />
  );
}
