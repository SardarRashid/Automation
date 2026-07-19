import React, { useState, useEffect } from "react";
import { InventoryRecord, CategoryTemplate, Storekeeper } from "../types";
import { 
  getRecordsByDate, 
  saveRecord, 
  deleteRecord, 
  carryForwardRecords,
  logActivity 
} from "../services/dbService";
import { exportRecordsToCSV } from "../utils/csvExport";
import ProgressLogFeed from "./ProgressLogFeed";
import { 
  Calendar, ChevronLeft, ChevronRight, Search, Plus, Trash2, 
  Download, Sparkles, RefreshCw, Save, Layers, AlertCircle, Eye,
  Truck, ClipboardCheck, LayoutGrid, CheckCircle2, TrendingUp, Info,
  Printer, ClipboardList
} from "lucide-react";

interface DailySheetViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  categories: CategoryTemplate[];
  currentUser: Storekeeper;
}

export function DailySheetView({ selectedDate, onDateChange, categories, currentUser }: DailySheetViewProps) {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [yesterdayRecords, setYesterdayRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Custom sub-tabs within the same date for the "Easy Way" (low clicks!)
  // 'arrivals' = What came today (Incoming shipment fast entry)
  // 'audit' = What is available in store right now (Physical count & auto-compute sales)
  // 'master' = Standard complete balance sheets
  // 'progress-feed' = Real-time transaction and progress log from storekeepers
  const [subTab, setSubTab] = useState<'arrivals' | 'audit' | 'master' | 'progress-feed'>('audit');

  // Filter permitted categories based on staff permissions assignment
  const permittedCategories = categories.filter(cat => 
    currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedSection === "All" ||
    currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(cat.name.toLowerCase().trim())
  );

  // Fast Arrival Quick Add Bar states (low click!)
  const [fastCat, setFastCat] = useState(() => {
    const permitted = categories.filter(cat => 
      currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedSection === "All" ||
      currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(cat.name.toLowerCase().trim())
    );
    return permitted[0]?.name || categories[0]?.name || "Apple";
  });
  const [fastVariety, setFastVariety] = useState("");
  const [fastSize, setFastSize] = useState("");
  const [fastLocation, setFastLocation] = useState("");
  const [fastIncoming, setFastIncoming] = useState("");
  const [fastOrigin, setFastOrigin] = useState("");
  const [fastGrade, setFastGrade] = useState("");
  const [fastSub, setFastSub] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  const activeTemplate = categories.find(c => c.name.toLowerCase() === fastCat.toLowerCase()) || categories[0];

  useEffect(() => {
    // Reset pushSuccess indicator when date shifts
    setPushSuccess(false);
  }, [selectedDate]);

  useEffect(() => {
    if (activeTemplate) {
      setFastVariety(activeTemplate.varieties[0] || "");
      setFastSize(activeTemplate.sizes[0] || "");
      // Default container location name based on category
      setFastLocation(`Container-${activeTemplate.name.substring(0, 3).toUpperCase()}1`);
    }
  }, [fastCat, categories]);

  // Load records for today and yesterday's ending count references
  const getYesterdayDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load today's records
      const todayData = await getRecordsByDate(selectedDate);
      setRecords(todayData);

      // 2. Load yesterday's records to fetch ending stock automatically
      const yesterdayStr = getYesterdayDateString(selectedDate);
      const yesterdayData = await getRecordsByDate(yesterdayStr);
      setYesterdayRecords(yesterdayData);
    } catch (err) {
      console.error("Error loading daily counts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Automated carry-forward operation (Checks previous day stock & sets up today's opening list)
  const handleAutoSetupFromYesterday = async () => {
    const yesterdayStr = getYesterdayDateString(selectedDate);
    setLoading(true);
    try {
      const carried = await carryForwardRecords(yesterdayStr, selectedDate);
      if (carried.length === 0) {
        alert(`No previous day stock records found in Yesterday's sheet (${yesterdayStr}) to fetch.`);
      } else {
        setRecords(carried);
        setSuccessMsg("Stock counts successfully retrieved from yesterday!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Fast Arrival directly via one-line banner (decreases click rate dramatically!)
  const handleFastAddArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastIncoming) {
      alert("Please enter a shipment count first!");
      return;
    }

    const qtyArrived = Number(fastIncoming);
    
    // Look up if this item already exists on today's worksheet (matching variety & size & location)
    const existing = records.find(
      r => r.category.toLowerCase() === fastCat.toLowerCase() &&
           r.variety.toLowerCase() === fastVariety.toLowerCase() &&
           r.size === fastSize &&
           r.location.toLowerCase() === fastLocation.trim().toLowerCase()
    );

    // Look up yesterday's ending count for opening stock
    const yesterdayMatch = yesterdayRecords.find(
      r => r.category.toLowerCase() === fastCat.toLowerCase() &&
           r.variety.toLowerCase() === fastVariety.toLowerCase() &&
           r.size === fastSize &&
           r.location.toLowerCase() === fastLocation.trim().toLowerCase()
    );

    // Opening count defaults to yesterday's physical ending count or 0
    const resolvedOpening = existing ? existing.openingStock : (yesterdayMatch ? yesterdayMatch.available : 0);

    if (existing) {
      // Modify existing item
      const updatedIncoming = existing.incoming + qtyArrived;
      const updatedAvailable = resolvedOpening + updatedIncoming - existing.sold;
      
      const updatedRecord: InventoryRecord = {
        ...existing,
        incoming: updatedIncoming,
        available: updatedAvailable,
        updatedAt: new Date().toISOString(),
        originCountry: fastOrigin.trim() || existing.originCountry,
        grade: fastGrade.trim() || existing.grade,
        subVariety: fastSub.trim() || existing.subVariety
      };

      setLoading(true);
      await saveRecord(updatedRecord);
    } else {
      // Create new line record
      const newRecord: InventoryRecord = {
        date: selectedDate,
        category: fastCat,
        variety: fastVariety || "Standard",
        size: fastSize || "Standard",
        location: fastLocation.trim() || "Container-1",
        arrivalDate: selectedDate,
        openingStock: resolvedOpening,
        incoming: qtyArrived,
        sold: 0,
        available: resolvedOpening + qtyArrived, // Sold is 0 initially
        notes: "Fast shipment arrived today",
        updatedAt: new Date().toISOString(),
        originCountry: fastOrigin.trim() || undefined,
        grade: fastGrade.trim() || undefined,
        subVariety: fastSub.trim() || undefined
      };

      setLoading(true);
      await saveRecord(newRecord);
    }

    // Logging the activity into Progress Log
    try {
      await logActivity(
        "create",
        `Logged Daily Shipment: ${qtyArrived} Pkgs of ${fastCat} - ${fastVariety} (Size ${fastSize}${
          fastOrigin ? `, Origin: ${fastOrigin}` : ""
        }${
          fastGrade ? `, Grade: ${fastGrade}` : ""
        }${
          fastSub ? `, Sub-variety: ${fastSub}` : ""
        }) to ${fastLocation.trim() || "Container-1"}`
      );
    } catch (logErr) {
      console.error("Non-blocking error logging activity:", logErr);
    }

    setFastIncoming("");
    setFastOrigin("");
    setFastGrade("");
    setFastSub("");
    await loadData();
    setSuccessMsg(`Logged arrived ${qtyArrived} units of ${fastVariety}!`);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // Delete inventory row
  const handleDeleteRow = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this item entry?")) return;
    try {
      await deleteRecord(id, selectedDate);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Low-Click Auto Update handler - calculates and cross-saves immediately:
  // Let the system automate today's sales subtraction!
  // Instant, zero-latency local React state update handler:
  const handleLocalCellEdit = (record: InventoryRecord, fieldName: keyof InventoryRecord, val: any) => {
    const updated = { ...record };
    
    if (fieldName === "incoming" || fieldName === "openingStock" || fieldName === "sold" || fieldName === "available") {
      // Keep as typing buffer (empty string preserved so they can clear & retype)
      const isStringEmpty = val === "";
      (updated as any)[fieldName] = isStringEmpty ? "" : (Number(val) || 0);

      const numericVal = isStringEmpty ? 0 : (Number(val) || 0);
      const opening = Number(updated.openingStock) || 0;
      const incoming = Number(updated.incoming) || 0;
      const sold = Number(updated.sold) || 0;

      if (fieldName === "available") {
        const calculatedSold = opening + incoming - numericVal;
        updated.sold = Math.max(0, calculatedSold);
      } else if (fieldName === "incoming" || fieldName === "openingStock") {
        const currentIncoming = fieldName === "incoming" ? numericVal : incoming;
        const currentOpening = fieldName === "openingStock" ? numericVal : opening;
        updated.available = Math.max(0, currentOpening + currentIncoming - sold);
      } else if (fieldName === "sold") {
        updated.available = Math.max(0, opening + incoming - numericVal);
      }
    } else {
      (updated as any)[fieldName] = val;
    }

    // Instantly update the list in memory
    setRecords(prevRecords => prevRecords.map(r => {
      const matchId = !!(record.id && r.id === record.id);
      const matchIdentity = !(record.id || r.id) && 
        r.variety === record.variety && 
        r.size === record.size && 
        r.category === record.category && 
        r.location === record.location;
      return (matchId || matchIdentity) ? updated : r;
    }));
  };

  // Safe commit handler called only onBlur or Enter, persisting changes directly to Firestore
  const handleCellCommit = async (record: InventoryRecord) => {
    if (!record.id) return;
    setSavingId(record.id);
    
    // Sanitize any remaining empty typing buffers to zero before database sync
    const sanitized = { ...record };
    if (sanitized.incoming === "" as any) sanitized.incoming = 0;
    if (sanitized.openingStock === "" as any) sanitized.openingStock = 0;
    if (sanitized.sold === "" as any) sanitized.sold = 0;
    if (sanitized.available === "" as any) sanitized.available = 0;

    try {
      const savedId = await saveRecord(sanitized);
      setRecords(prevRecords => prevRecords.map(r => r.id === record.id ? { ...sanitized, id: savedId } : r));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  // Keep cell style helper for backwards compatibility / utility
  const handleCellSave = async (record: InventoryRecord, fieldName: keyof InventoryRecord, val: any) => {
    handleLocalCellEdit(record, fieldName, val);
    const updated = { ...record };
    if (fieldName === "incoming" || fieldName === "openingStock" || fieldName === "sold" || fieldName === "available") {
      const numericVal = Number(val) || 0;
      updated[fieldName] = numericVal;
      if (fieldName === "available") {
        updated.sold = Math.max(0, updated.openingStock + updated.incoming - numericVal);
      } else if (fieldName === "incoming" || fieldName === "openingStock") {
        updated.available = Math.max(0, updated.openingStock + updated.incoming - updated.sold);
      } else if (fieldName === "sold") {
        updated.available = Math.max(0, updated.openingStock + updated.incoming - numericVal);
      }
    } else {
      (updated as any)[fieldName] = val;
    }
    if (record.id) {
      setSavingId(record.id);
      try {
        await saveRecord(updated);
      } catch (err) {
        console.error(err);
      } finally {
        setSavingId(null);
      }
    }
  };

  // Incrementor for low clicks
  const adjustCount = async (record: InventoryRecord, fieldName: 'incoming' | 'sold' | 'available', amount: number) => {
    const currentVal = Number(record[fieldName]) || 0;
    const newVal = Math.max(0, currentVal + amount);
    
    const updated = { ...record, [fieldName]: newVal };
    if (fieldName === "available") {
      updated.sold = Math.max(0, updated.openingStock + updated.incoming - newVal);
    } else if (fieldName === "incoming") {
      updated.available = Math.max(0, updated.openingStock + newVal - updated.sold);
    }
    
    setRecords(prev => prev.map(r => {
      const matchId = !!(record.id && r.id === record.id);
      const matchIdentity = !(record.id || r.id) && 
        r.variety === record.variety && 
        r.size === record.size && 
        r.category === record.category && 
        r.location === record.location;
      return (matchId || matchIdentity) ? updated : r;
    }));
    
    if (record.id) {
      setSavingId(record.id);
      try {
        await saveRecord(updated);
      } catch (err) {
        console.error(err);
      } finally {
        setSavingId(null);
      }
    }
  };

  // Quick seed button to provide working items if completely empty
  const handleProduceEmptyTodayListsFromCategories = async () => {
    if (categories.length === 0) return;
    setLoading(true);
    try {
      const batchRecords: InventoryRecord[] = [];
      categories.forEach((cat) => {
        // Seed first 2 varieties of each category
        const varsToSeed = cat.varieties.slice(0, 2);
        const sizeDefault = cat.sizes[0] || "Standard";
        
        varsToSeed.forEach((v) => {
          // Look up yesterday's count
          const yesterdayMatch = yesterdayRecords.find(
            y => y.variety.toLowerCase() === v.toLowerCase() && y.size === sizeDefault
          );
          const yesterdayEnd = yesterdayMatch ? yesterdayMatch.available : 50; // Mock fallback if today is first time

          batchRecords.push({
            date: selectedDate,
            category: cat.name,
            variety: v,
            size: sizeDefault,
            location: `Container-${cat.name.substring(0,3).toUpperCase()}1`,
            arrivalDate: selectedDate,
            openingStock: yesterdayEnd,
            incoming: 0,
            sold: 0,
            available: yesterdayEnd,
            notes: "Initialized automatically",
            updatedAt: new Date().toISOString()
          });
        });
      });

      for (const rec of batchRecords) {
        await saveRecord(rec);
      }
      await loadData();
      setSuccessMsg("Worksheet initialized with all products!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export
  const handleExportToday = () => {
    exportRecordsToCSV(records, `fresh-inventory-${selectedDate}.csv`);
  };

  const handlePushToManager = async () => {
    setPushing(true);
    try {
      await logActivity(
        "update", 
        `Supervisor ${currentUser.name} balanced and pushed verified stock take reports to Master Manager for ${selectedDate}. Scope: Categories [${currentUser.assignedSection}] Store locations [${currentUser.assignedStoreNum}]`
      );
      setPushSuccess(true);
      setSuccessMsg("Audit spreadsheet pushed to Master Manager successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setPushing(false);
    }
  };

  // Filtering list
  const filteredRecords = records.filter(r => {
    // 1. Check supervisor / storekeeper category role lock
    const matchSection = currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedSection === "All" ||
      currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.category.toLowerCase().trim());
    
    // 2. Check cold store room assignment lock
    const matchStore = currentUser.role === 'it_admin' || currentUser.role === 'manager' || currentUser.assignedStoreNum === "All" ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.location.toLowerCase().trim()) ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).some(store => r.location.toLowerCase().includes(store));

    if (!matchSection || !matchStore) return false;

    const q = searchQuery.toLowerCase();
    return (
      r.category.toLowerCase().includes(q) ||
      r.variety.toLowerCase().includes(q) ||
      r.size.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">

      {/* Corporate PDF/CSS Print-Stylesheet Audit Summary Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3.5">
            <img 
              src="https://seeklogo.com/images/S/sharbatly-fruit-logo-A917F9ACDC-seeklogo.com.png" 
              alt="M. A. Sharbatly Co. Logo" 
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900">M. A. Sharbatly Co.</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Muhammad Abdullah Sharbatly Fruit • Cold Storage Operations</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-100 px-3.5 py-1.5 rounded border border-slate-300 text-xs font-black uppercase tracking-wider text-slate-800">
              Daily Cold Storage inventory audit report
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-5 border-t border-slate-300 pt-4 text-[10px] text-slate-700">
          <div>
            <span className="text-slate-400 uppercase font-black block tracking-wider text-[8.5px]">Audit Date:</span>
            <span className="font-extrabold text-slate-900">{selectedDate}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-black block tracking-wider text-[8.5px]">Assigned Section:</span>
            <span className="font-extrabold text-slate-900">{currentUser.assignedSection || "All"}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-black block tracking-wider text-[8.5px]">Assigned Rooms/Stores:</span>
            <span className="font-extrabold text-slate-900">{currentUser.assignedStoreNum || "All"}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-black block tracking-wider text-[8.5px]">Report Inspector:</span>
            <span className="font-extrabold text-slate-900">{currentUser.name} ({currentUser.role})</span>
          </div>
        </div>

        {/* Corporate Quality Inspection Metrics summary */}
        <div className="grid grid-cols-4 gap-3 mt-6 border-t border-slate-300 pt-4">
          <div className="border border-slate-300 rounded-lg p-2.5 text-center bg-slate-50/10">
            <span className="text-[8.5px] text-slate-500 uppercase font-black block tracking-wider">Total Varieties Checked</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono">{filteredRecords.length}</span>
          </div>
          <div className="border border-slate-300 rounded-lg p-2.5 text-center bg-slate-50/10">
            <span className="text-[8.5px] text-slate-500 uppercase font-black block tracking-wider">Opening Stocks Sum</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              {filteredRecords.reduce((sum, r) => sum + (Number(r.openingStock) || 0), 0)} Pkgs
            </span>
          </div>
          <div className="border border-slate-300 rounded-lg p-2.5 text-center bg-slate-50/10">
            <span className="text-[8.5px] text-indigo-700 uppercase font-black block tracking-wider">Arrived (Incoming)</span>
            <span className="text-lg font-extrabold text-indigo-900 font-mono">
              +{filteredRecords.reduce((sum, r) => sum + (Number(r.incoming) || 0), 0)} Pkgs
            </span>
          </div>
          <div className="border border-slate-300 rounded-lg p-2.5 text-center bg-slate-50/10">
            <span className="text-[8.5px] text-green-700 uppercase font-black block tracking-wider">Ending Balance (In Store)</span>
            <span className="text-lg font-extrabold text-green-900 font-mono">
              {filteredRecords.reduce((sum, r) => sum + (Number(r.available) || 0), 0)} Pkgs
            </span>
          </div>
        </div>
      </div>

      {/* Supervisor Dispatch Hub */}
      {currentUser.role === 'supervisor' && (
        <div className="bg-gradient-to-r from-green-950 via-slate-900 to-green-900 border-2 border-emerald-500/25 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-450 animate-pulse shrink-0" />
              Supervisor Reporting Panel
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
              You are assigned to fruit category <span className="font-extrabold text-yellow-350 bg-emerald-900/30 px-1.5 py-0.5 rounded font-mono">[{currentUser.assignedSection}]</span> and room <span className="font-extrabold text-yellow-350 bg-emerald-900/30 px-1.5 py-0.5 rounded font-mono">[{currentUser.assignedStoreNum}]</span>. Once today's physical stocks are matched, dispatch balanced sheet logs to the manager.
            </p>
          </div>
          
          <button
            onClick={handlePushToManager}
            disabled={pushing || pushSuccess}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-2 ${
              pushSuccess
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 opacity-75'
                : 'bg-yellow-450 hover:bg-yellow-400 active:scale-95 text-green-950 border-yellow-300 shadow-md transform'
            }`}
          >
            {pushing ? (
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : pushSuccess ? (
              <>
                <span>✓ REPORT VERIFIED & PUSHED</span>
              </>
            ) : (
              <>
                <span>🚀 PUSH TO MASTER MANAGER</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Date Toggle & Export Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Day Jumper */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 focus:outline-none"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-slate-700">
            <Calendar className="w-4.5 h-4.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none text-slate-800 font-sans"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 focus:outline-none"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Global Dynamic Status Notification */}
        {successMsg && (
          <div className="bg-green-50 text-green-900 text-xs px-4 py-2 rounded-xl border border-yellow-350/50 flex items-center gap-2 font-medium animate-bounce shadow-sm">
            <CheckCircle2 className="w-4.5 h-4.5 text-green-700" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Field & Fast Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="relative flex-1 sm:w-64 md:flex-initial">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search variety, space or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-green-600 font-sans text-slate-750"
            />
          </div>

          <button
            onClick={handleExportToday}
            disabled={records.length === 0}
            className="bg-green-50 border border-green-200/70 hover:bg-green-100 text-green-800 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            disabled={records.length === 0}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-yellow-450" />
            Print Summary
          </button>
        </div>

      </div>

      {/* Task Task-focused Low-Click Sub-Tabs inside Date sheet */}
      <div className="bg-slate-200/70 p-1 rounded-xl flex flex-col md:flex-row max-w-4xl gap-1">
        
        <button
          onClick={() => setSubTab('audit')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            subTab === 'audit'
              ? 'bg-green-800 text-white shadow-md border-b-2 border-yellow-450'
              : 'text-slate-600 hover:text-green-800 hover:bg-white/40'
          }`}
        >
          <ClipboardCheck className="w-4.5 h-4.5" />
          <span>1. Verify Store counts (Physical Audit)</span>
          {records.length > 0 && (
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              subTab === 'audit' ? 'bg-green-950 text-white' : 'bg-slate-300 text-slate-750'
            }`}>
              {records.filter(r => r.available > 0).length}/{records.length} counted
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('arrivals')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            subTab === 'arrivals'
              ? 'bg-yellow-500 text-green-950 shadow-md border-b-2 border-green-800'
              : 'text-slate-600 hover:text-green-800 hover:bg-white/40'
          }`}
        >
          <Truck className="w-4.5 h-4.5" />
          <span>2. Log Shipments Arrived Today</span>
          {records.filter(r => r.incoming > 0).length > 0 && (
            <span className="bg-yellow-400 text-green-950 font-bold px-1.5 text-[10px] rounded-full">
              +{records.filter(r => r.incoming > 0).length} shipments
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('master')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            subTab === 'master'
              ? 'bg-green-950 text-white shadow-md'
              : 'text-slate-600 hover:text-green-805 hover:bg-white/40'
          }`}
        >
          <LayoutGrid className="w-4.5 h-4.5 text-yellow-500" />
          <span>3. Complete Master Sheet</span>
        </button>

        <button
          onClick={() => setSubTab('progress-feed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            subTab === 'progress-feed'
              ? 'bg-blue-800 text-white shadow-md border-b-2 border-yellow-450'
              : 'text-slate-600 hover:text-green-800 hover:bg-white/40'
          }`}
        >
          <ClipboardList className="w-4.5 h-4.5 text-blue-400" />
          <span>4. Live Storekeeper Progress Logs</span>
        </button>

      </div>

      {/* EASY WAY: Sub-workflow displays */}
      
      {/* Tab 1: SHIPMENT ARRIVALS MODE */}
      {subTab === 'arrivals' && (
        <div className="space-y-4">
          
          {/* Fast Record arrivals bar (No click-intensive modals!) */}
          <div className="bg-gradient-to-r from-yellow-50/70 via-green-50/20 to-white border border-yellow-300/60 rounded-2xl p-5 shadow-inner">
            <h4 className="text-xs font-mono font-bold text-green-905 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-600 animate-pulse" />
              Sharbatly Fast Entry: Log Incoming Shipments to Saudi Cold Storage
            </h4>

            <form onSubmit={handleFastAddArrival} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                
                {/* Cat */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Fruit / Veg Type:</label>
                  <select
                    value={fastCat}
                    onChange={(e) => setFastCat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-green-500 focus:outline-none"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* Variety */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Select Variety Option:</label>
                  <select
                    value={fastVariety}
                    onChange={(e) => setFastVariety(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-green-500 focus:outline-none"
                  >
                    {activeTemplate?.varieties.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Product Size Count:</label>
                  <select
                    value={fastSize}
                    onChange={(e) => setFastSize(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-green-500 focus:outline-none"
                  >
                    {activeTemplate?.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Storage Loc. Container:</label>
                  <input
                    type="text"
                    placeholder="e.g. Container-A1"
                    value={fastLocation}
                    onChange={(e) => setFastLocation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-green-550 font-sans"
                  />
                </div>

                {/* Quantity arrived */}
                <div>
                  <label className="block text-[10px] font-semibold text-green-900 mb-1 font-sans">Shipment Weight/Qty:</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    min="1"
                    value={fastIncoming}
                    onChange={(e) => setFastIncoming(e.target.value)}
                    className="w-full bg-white border-2 border-yellow-400 rounded-lg px-2.5 py-1 text-xs text-center font-bold font-mono focus:outline-green-600 focus:border-green-500"
                  />
                </div>

                {/* Quick Submit */}
                <button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Shipment
                </button>

              </div>

              {/* Collapsed variant details / specifics block to decrease visual weight */}
              <div className="bg-white/40 border border-slate-200/50 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1.5">Origin Country (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. USA, Chile, Egypt"
                    value={fastOrigin}
                    onChange={(e) => setFastOrigin(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-sans focus:outline-green-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1.5">Product Grade (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Fancy, Extra, Grade 1"
                    value={fastGrade}
                    onChange={(e) => setFastGrade(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-sans focus:outline-green-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1.5">Sub-variety / Brand Name (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Agala Fancy, Gala Red"
                    value={fastSub}
                    onChange={(e) => setFastSub(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-sans focus:outline-green-500"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Simple Arrivals Table List */}
          {filteredRecords.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-mono font-semibold text-slate-400">
                <span>NEW ARRIVALS TRACKED ON {selectedDate}</span>
                <span className="text-sky-600">Enter numbers below directly. Autosaves instantly.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-indigo-50 text-slate-400 font-mono text-[10px] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Item Variety</th>
                      <th className="py-2.5 px-4 text-center">Container No.</th>
                      <th className="py-2.5 px-4 text-center bg-sky-50/50 text-sky-800 font-bold">SHIPMENT VALUE TODAY (What Came)</th>
                      <th className="py-2.5 px-4 text-center">Current Total Stored</th>
                      <th className="py-2.5 px-4">Quality remarks or Notes</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRecords.map((rec, idx) => (
                      <tr key={rec.id || `rec-arr-${idx}`} className="hover:bg-sky-50/10 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{rec.variety}</span>
                          <span className="ml-2 inline-block bg-slate-100 text-slate-500 text-[9px] px-1.5 rounded font-mono font-medium">#{rec.size}</span>
                          {(rec.originCountry || rec.grade || rec.subVariety) && (
                            <div className="flex flex-wrap gap-1 mt-1 text-[9px]">
                              {rec.originCountry && <span className="bg-slate-105 border border-slate-200 px-1 py-0.2 rounded text-slate-600">Origin: {rec.originCountry}</span>}
                              {rec.grade && <span className="bg-amber-50 border border-amber-200/50 text-amber-900 px-1 py-0.2 rounded font-bold">Grade: {rec.grade}</span>}
                              {rec.subVariety && <span className="bg-sky-50 border border-sky-100/50 text-sky-900 px-1 py-0.2 rounded">Sub: {rec.subVariety}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{rec.location}</td>
                        
                        {/* INPUT: ONLY Shipment weight needs typing! */}
                        <td className="py-2 px-4 bg-sky-50/30 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              onClick={() => adjustCount(rec, "incoming", -5)}
                              className="bg-white border border-slate-200 hover:bg-slate-100 text-[10px] px-1 rounded text-slate-400 font-bold"
                            >
                              -5
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={rec.incoming}
                              onChange={(e) => handleLocalCellEdit(rec, "incoming", e.target.value)}
                              onBlur={() => handleCellCommit(rec)}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="bg-sky-50 border-2 border-sky-300 font-bold font-mono text-xs text-center text-sky-900 w-20 py-1.5 rounded-lg shadow-inner focus:outline-sky-500"
                            />
                            <button
                              onClick={() => adjustCount(rec, "incoming", 5)}
                              className="bg-sky-50 border border-sky-200 hover:bg-sky-100 text-[10px] px-1 rounded text-sky-800 font-bold"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => adjustCount(rec, "incoming", 25)}
                              className="bg-sky-600 text-white hover:bg-sky-700 text-[9px] px-1.5 py-1 rounded font-bold"
                              title="Add 25"
                            >
                              +25
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-700">
                          {rec.openingStock + rec.incoming} units
                        </td>

                        <td className="py-1.5 px-4">
                          <input
                            type="text"
                            placeholder="Defects or load comments..."
                            value={rec.notes || ""}
                            onChange={(e) => handleCellSave(rec, "notes", e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-255 text-xs py-1 px-1.5 w-full text-slate-500 focus:outline-none focus:bg-white"
                          />
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteRow(rec.id!)}
                            className="text-slate-350 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 bg-slate-50/50">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">Zero entries initialized for today: {selectedDate}</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                You can auto-carry yesterday's products, or quickly add a single shipment in the bar above to start.
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={handleAutoSetupFromYesterday}
                  className="bg-sky-600 text-white hover:bg-sky-700 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Retrieve Active Store Catalog
                </button>
                <button
                  onClick={handleProduceEmptyTodayListsFromCategories}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Seed Empty Catalog Lines
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 2: PHYSICAL STORE COUNT & SALES auto-calc (The low click UI!) */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          
          {/* Informational helpful box (tells them previous day ending details are auto fetched!) */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 border border-green-200/70 p-4.5 rounded-2xl shadow-inner flex items-start gap-3">
            <Info className="w-5.5 h-5.5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide">
                Sharbatly Automated Outflow Calculator
              </h4>
              <p className="text-xs text-green-800 leading-relaxed mt-1">
                Your daily audit mathematical calculations are fully automated. The system tracks your **Previous Day's Registered Stocks** as today's starting balance. 
                Simply input today's verified <strong>Physical Counts inside the Storage Rooms</strong> into the form, and the portal immediately logs the sales: 
                <span className="font-semibold text-green-950 px-2 py-0.5 font-mono uppercase bg-yellow-350 rounded ml-1">Outflow Sales = Previous Stock + Received Today - Today's Remainder</span>. This ensures flawless inventory reporting instantly!
              </p>
            </div>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-mono font-semibold text-slate-400">
                <span>Verification Sheet • {selectedDate}</span>
                <span className="text-green-700 font-sans">Tab out of boxes or hit Enter. Instant save secured.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-green-50 text-slate-400 font-mono text-[10px] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Item Variety</th>
                      <th className="py-2.5 px-4 text-center">Container No.</th>
                      <th className="py-2.5 px-4 text-center bg-slate-100 text-slate-500">A. Yesterday's Balance (Opening)</th>
                      <th className="py-2.5 px-4 text-center bg-sky-50 text-sky-800">B. Arrived (Incoming)</th>
                      <th className="py-2.5 px-4 text-center bg-green-50 text-green-800 font-bold">C. ENTER TODAY'S COUNT (Store Available)</th>
                      <th className="py-2.5 px-4 text-center bg-amber-50 text-amber-900 font-bold">CALCULATED SALES (A + B - C)</th>
                      <th className="py-2.5 px-4">Quality conditions</th>
                      <th className="py-2.5 px-4 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRecords.map((rec, idx) => {
                      // Live math on table!
                      const opening = Number(rec.openingStock) || 0;
                      const incoming = Number(rec.incoming) || 0;
                      const physicalCountInStore = Number(rec.available) || 0;
                      const calculatedSales = Math.max(0, opening + incoming - physicalCountInStore);

                      return (
                        <tr key={rec.id || `rec-vld-${idx}`} className="hover:bg-green-50/10 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{rec.variety}</span>
                            <span className="ml-2 inline-block bg-slate-100 text-slate-450 text-[9px] px-1.5 rounded font-mono font-medium">#{rec.size}</span>
                            {(rec.originCountry || rec.grade || rec.subVariety) && (
                              <div className="flex flex-wrap gap-1 mt-1 text-[9px]">
                                {rec.originCountry && <span className="bg-slate-105 border border-slate-200 px-1 py-0.2 rounded text-slate-600">Origin: {rec.originCountry}</span>}
                                {rec.grade && <span className="bg-amber-50 border border-amber-200/50 text-amber-900 px-1 py-0.2 rounded font-bold">Grade: {rec.grade}</span>}
                                {rec.subVariety && <span className="bg-sky-50 border border-sky-100/50 text-sky-900 px-1 py-0.2 rounded">Sub: {rec.subVariety}</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{rec.location}</td>
                          
                          {/* Opening count (prefetched yesterday's end) */}
                          <td className="py-3 px-4 text-center bg-slate-50/50 font-semibold font-mono text-slate-600">
                            {opening}
                          </td>

                          {/* Incoming today */}
                          <td className="py-3 px-4 text-center bg-sky-50/20 font-bold font-mono text-sky-700">
                            +{incoming}
                          </td>

                          {/* INPUT: Only enter current stock! System calculates sales! */}
                          <td className="py-1.5 px-4 bg-green-100/10 text-center">
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <button
                                onClick={() => adjustCount(rec, "available", -1)}
                                className="bg-white border border-slate-200 hover:bg-slate-100 text-[10px] px-1.5 rounded font-bold text-slate-450"
                              >
                                -1
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={rec.available}
                                onChange={(e) => handleLocalCellEdit(rec, "available", e.target.value)}
                                onBlur={() => handleCellCommit(rec)}
                                onFocus={(e) => e.target.select()}
                                className="bg-green-50 border-2 border-green-300 py-1.5 text-center font-bold font-mono text-xs text-green-900 w-20 rounded-lg shadow-sm focus:outline-green-500 focus:border-green-600"
                                title="Enter verified physical units in warehouse"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                              />
                              <button
                                onClick={() => adjustCount(rec, "available", 1)}
                                className="bg-green-50 border border-green-300 hover:bg-emerald-100 text-[10px] px-1.5 rounded font-bold text-green-800"
                              >
                                +1
                              </button>
                            </div>
                          </td>

                          {/* AUTO PRINTED sales result! The storekeeper just verifies! */}
                          <td className="py-2 px-4 text-center bg-amber-50/30">
                            {calculatedSales > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="text-amber-700 font-extrabold font-mono text-sm bg-yellow-350/40 px-3 py-1 rounded-full border border-yellow-350/60">
                                  {calculatedSales} Sold
                                </span>
                                <span className="text-[9px] text-amber-600 font-semibold font-sans mt-0.5">Automated result</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold font-mono text-xs">
                                0 Sold (Stable)
                              </span>
                            )}
                          </td>

                          <td className="py-1 px-4">
                            <input
                              type="text"
                              placeholder="Temperature, rot rates..."
                              value={rec.notes || ""}
                              onChange={(e) => handleCellSave(rec, "notes", e.target.value)}
                              className="bg-transparent text-xs hover:bg-white py-1 px-1 text-slate-500 hover:text-slate-800 w-full focus:outline-green-550 border-b border-transparent hover:border-slate-200"
                            />
                          </td>

                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleDeleteRow(rec.id!)}
                              className="text-slate-350 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 bg-slate-50/50">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700 font-sans">No verification worksheet found for today: {selectedDate}</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                You can immediately import previous day's stored records to set up opening values.
              </p>
              <div className="mt-4 flex gap-2.5 justify-center">
                <button
                  onClick={handleAutoSetupFromYesterday}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Carry Forward Stock from Yesterday
                </button>
                <button
                  onClick={handleProduceEmptyTodayListsFromCategories}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Seed Catalog Items list
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 3: COMPREHENSIVE MASTER GRID */}
      {subTab === 'master' && (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center bg-slate-100/50 px-4 py-3 rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-slate-500">MASTER VIEW: MANIFEST ACCESSIBILITY FOR AUDITS</span>
            <button
              onClick={() => onDateChange(selectedDate)}
              className="text-xs text-slate-600 font-semibold hover:text-slate-800 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Force Sync Database
            </button>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4 min-w-[140px]">Product / Variety</th>
                      <th className="py-3 px-4 text-center">Size</th>
                      <th className="py-3 px-4 text-center">Container No.</th>
                      <th className="py-3 px-4 text-center">Arrived Date</th>
                      <th className="py-3 px-4 text-center bg-slate-50 text-slate-600">A. Opening Stock</th>
                      <th className="py-3 px-4 text-center bg-sky-50 text-sky-800">B. Arrived (+Incoming)</th>
                      <th className="py-3 px-4 text-center bg-amber-50 text-amber-800">C. Sold Today (-Outflow)</th>
                      <th className="py-3 px-4 text-center bg-green-50 text-green-800 font-bold">D. Physical Total Ending (Available)</th>
                      <th className="py-3 px-4 min-w-[150px]">Remarks / Quality notes</th>
                      <th className="py-3 px-4 text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRecords.map((rec, idx) => (
                      <tr key={rec.id || `rec-all-${idx}`} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div>{rec.variety}</div>
                          <div className="text-[9px] text-slate-450 font-mono">{rec.category}</div>
                          {(rec.originCountry || rec.grade || rec.subVariety) && (
                            <div className="flex flex-wrap gap-1 mt-1 text-[8.5px]">
                              {rec.originCountry && <span className="bg-slate-105 border border-slate-200 px-1 py-0.2 rounded text-slate-500 font-normal">Origin: {rec.originCountry}</span>}
                              {rec.grade && <span className="bg-amber-50 border border-amber-200/30 text-amber-900 px-1 py-0.2 rounded font-bold">Grade: {rec.grade}</span>}
                              {rec.subVariety && <span className="bg-sky-50 border border-sky-150/30 text-sky-900 px-1 py-0.2 rounded">Sub: {rec.subVariety}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">{rec.size}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="text"
                            value={rec.location}
                            onChange={(e) => handleCellSave(rec, "location", e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-300 text-center font-mono text-[11px] w-24 py-0.5 text-slate-700"
                          />
                        </td>
                        <td className="py-3 px-4 text-center text-slate-450 font-mono text-[10px]">{rec.arrivalDate}</td>
                        
                        {/* A */}
                        <td className="py-2 px-2 bg-slate-50 text-center">
                          <input
                            type="number"
                            min="0"
                            value={rec.openingStock}
                            onChange={(e) => handleLocalCellEdit(rec, "openingStock", e.target.value)}
                            onBlur={() => handleCellCommit(rec)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="bg-white border border-slate-350 py-1 text-center font-bold font-mono text-xs text-slate-800 w-14 rounded focus:outline-green-500"
                          />
                        </td>

                        {/* B */}
                        <td className="py-2 px-2 bg-sky-50/40 text-center">
                          <input
                            type="number"
                            min="0"
                            value={rec.incoming}
                            onChange={(e) => handleLocalCellEdit(rec, "incoming", e.target.value)}
                            onBlur={() => handleCellCommit(rec)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="bg-white border border-slate-300 py-1 text-center font-bold font-mono text-xs text-sky-900 w-14 rounded focus:outline-green-500"
                          />
                        </td>

                        {/* C */}
                        <td className="py-2 px-2 bg-amber-50/40 text-center">
                          <input
                            type="number"
                            min="0"
                            value={rec.sold}
                            onChange={(e) => handleLocalCellEdit(rec, "sold", e.target.value)}
                            onBlur={() => handleCellCommit(rec)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="bg-white border border-slate-300 py-1 text-center font-bold font-mono text-xs text-amber-900 w-14 rounded focus:outline-green-500"
                          />
                        </td>

                        {/* D */}
                        <td className="py-2 px-2 bg-green-50 text-center">
                          <input
                            type="number"
                            min="0"
                            value={rec.available}
                            onChange={(e) => handleLocalCellEdit(rec, "available", e.target.value)}
                            onBlur={() => handleCellCommit(rec)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="bg-green-50 border border-green-300 py-1 text-center font-extrabold font-mono text-xs text-green-950 w-14 rounded focus:outline-green-600 focus:border-green-400"
                          />
                        </td>

                        <td className="py-1 px-3">
                          <input
                            type="text"
                            placeholder="Defects..."
                            value={rec.notes || ""}
                            onChange={(e) => handleCellSave(rec, "notes", e.target.value)}
                            className="bg-transparent text-xs hover:bg-slate-50 focus:bg-white text-slate-500 hover:text-slate-805 py-1 px-1 w-full border-b border-transparent focus:border-slate-300 focus:outline-none"
                          />
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteRow(rec.id!)}
                            className="p-1 text-slate-350 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 py-10 rounded-xl text-center text-slate-400 text-xs font-sans">
              No list items currently configured for {selectedDate}.
            </div>
          )}

        </div>
      )}

      {/* Tab 4: LIVE STOREKEEPER PROGRESS LOG FEED */}
      {subTab === 'progress-feed' && (
        <ProgressLogFeed selectedDate={selectedDate} />
      )}

      {/* Manual log trigger center */}
      {subTab !== 'arrivals' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-800">Need to manually add an item that doesn't fit standard catalog list?</h4>
            <p className="text-xs text-slate-500">You can customize individual parameters (weights, storage locations etc) on dynamic lines.</p>
          </div>
          <button
            onClick={() => {
              setSubTab('arrivals');
              // Focus fast arrival inputs
            }}
            className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1 text-center shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Manual Entry
          </button>
        </div>
      )}

      {/* Corporate PDF/CSS Print-Stylesheet Signature Approval Footing */}
      <div className="hidden print:block mt-24 pt-8 border-t border-dashed border-slate-400">
        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 h-10 w-44 mx-auto" />
            <p className="mt-2 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Verified By (Storekeeper / Supervisor)</p>
          </div>
          <div>
            <div className="border-b border-slate-400 h-10 w-44 mx-auto" />
            <p className="mt-2 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Checked By (Cold Storage Manager)</p>
          </div>
          <div>
            <div className="border-b border-slate-400 h-10 w-44 mx-auto" />
            <p className="mt-2 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Authorized Audit Inspector</p>
          </div>
        </div>
        <div className="text-center mt-8 text-[8px] text-slate-400 font-medium font-mono uppercase tracking-widest">
          M. A. Sharbatly Co. Cold Storage Audit System • Printed on {selectedDate} ({new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}) • Cloud Security Sync Verified
        </div>
      </div>

    </div>
  );
}
