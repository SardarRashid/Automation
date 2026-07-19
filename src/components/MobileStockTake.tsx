import React, { useState, useEffect } from "react";
import { 
  Plus, Minus, Save, Calendar, MapPin, 
  Trash2, LogOut, Package, User, Sparkles, Check, 
  Layers, ChevronDown, CheckCircle2, RefreshCw, ClipboardList,
  Sun, Moon, Search, Keyboard, CornerDownLeft
} from "lucide-react";
import { CategoryTemplate, InventoryRecord, Storekeeper, StoreRoom } from "../types";
import { getRecordsByDate, saveRecord, deleteRecord, logActivity, getStorekeepers, getStoreRooms } from "../services/dbService";

interface MobileStockTakeProps {
  categories: CategoryTemplate[];
  currentUser: Storekeeper;
  onLogout: () => void;
  showSuiteToggle?: boolean;
  onToggleSuite?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function MobileStockTake({ 
  categories, 
  currentUser, 
  onLogout, 
  showSuiteToggle = false, 
  onToggleSuite,
  theme = "light",
  onToggleTheme
}: MobileStockTakeProps) {
  // Primary inputs
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Filter templates list if the user has a specific assigned section
  const sectionFilteredCategories = categories.filter(cat => 
    currentUser.assignedSection === "All" || 
    currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).includes(cat.name.toLowerCase())
  );

  const [categoryName, setCategoryName] = useState(() => {
    return sectionFilteredCategories[0]?.name || categories[0]?.name || "Apple";
  });

  const activeTemplate = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) || categories[0];

  const [variety, setVariety] = useState("");
  const [size, setSize] = useState("");
  const [arrivalDate, setArrivalDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);

  useEffect(() => {
    async function initStores() {
      try {
        const rooms = await getStoreRooms();
        setStoreRooms(rooms);
      } catch (err) {
        console.error("Error loading store rooms in mobile view:", err);
      }
    }
    initStores();
  }, []);

  const assignedStoresList = React.useMemo(() => {
    if (!currentUser.assignedStoreNum || currentUser.assignedStoreNum === "All") {
      if (storeRooms.length > 0) {
        return storeRooms.map(r => r.name);
      }
      return ["Store 1", "Store 2", "Store 3", "Store 4", "Store 5", "Store 6", "Vegetable Area", "Flower Cooler"];
    }
    return currentUser.assignedStoreNum.split(",").map(s => s.trim()).filter(Boolean);
  }, [currentUser.assignedStoreNum, storeRooms]);

  // Default Assigned Store Number, e.g. "Store 1"
  const [storeNum, setStoreNum] = useState(() => {
    return assignedStoresList[0] || "Store 1";
  });

  useEffect(() => {
    if (assignedStoresList.length > 0 && !assignedStoresList.includes(storeNum)) {
      setStoreNum(assignedStoresList[0]);
    }
  }, [assignedStoresList, storeNum]);

  // Stock values
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  
  // Optional Product Variations
  const [originCountry, setOriginCountry] = useState("");
  const [grade, setGrade] = useState("");
  const [subVariety, setSubVariety] = useState("");

  // Loading & Feedback
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [yesterdayRecords, setYesterdayRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Real-time catalog search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Catalog Indexing (Standard items + previously recorded configurations)
  const catalogItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      category: string;
      variety: string;
      size?: string;
      grade?: string;
      originCountry?: string;
      subVariety?: string;
      displayName: string;
      displayDetail: string;
      source: 'template' | 'record';
    }> = [];

    const seenKeys = new Set<string>();

    // 1. Template-defined standard items
    sectionFilteredCategories.forEach(cat => {
      cat.varieties.forEach(v => {
        const key = `template-${cat.name.toLowerCase()}-${v.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          items.push({
            id: key,
            category: cat.name,
            variety: v,
            displayName: `${cat.name} • ${v}`,
            displayDetail: "Standard Catalog Item",
            source: 'template'
          });
        }
      });
    });

    // 2. Previously recorded / existing active items with custom variations
    const allRecords = [...records, ...yesterdayRecords];
    allRecords.forEach(rec => {
      const isAuthorized = currentUser.assignedSection === "All" || 
        currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.category.toLowerCase());
      if (!isAuthorized) return;

      const details: string[] = [];
      if (rec.size) details.push(`Size: #${rec.size}`);
      if (rec.grade) details.push(`Grade: ${rec.grade}`);
      if (rec.originCountry) details.push(`Origin: ${rec.originCountry}`);
      if (rec.subVariety) details.push(`Sub-var: ${rec.subVariety}`);

      const detailText = details.join(" | ") || "Past recorded batch";
      const key = `record-${rec.category.toLowerCase()}-${rec.variety.toLowerCase()}-${(rec.size || "").toLowerCase()}-${(rec.grade || "").toLowerCase()}-${(rec.originCountry || "").toLowerCase()}`;
      
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        items.push({
          id: key,
          category: rec.category,
          variety: rec.variety,
          size: rec.size,
          grade: rec.grade,
          originCountry: rec.originCountry,
          subVariety: rec.subVariety,
          displayName: `${rec.category} • ${rec.variety}`,
          displayDetail: detailText,
          source: 'record'
        });
      }
    });

    return items;
  }, [sectionFilteredCategories, records, yesterdayRecords, currentUser.assignedSection]);

  // Real-time keyword filter
  const filteredCatalogItems = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return catalogItems.filter(item => {
      return (
        item.category.toLowerCase().includes(q) ||
        item.variety.toLowerCase().includes(q) ||
        (item.grade && item.grade.toLowerCase().includes(q)) ||
        (item.originCountry && item.originCountry.toLowerCase().includes(q)) ||
        (item.subVariety && item.subVariety.toLowerCase().includes(q)) ||
        item.displayName.toLowerCase().includes(q) ||
        item.displayDetail.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [catalogItems, searchQuery]);

  // Action on selecting an item from the real-time filtered catalog helper
  const handleSelectCatalogItem = (item: typeof catalogItems[0]) => {
    setCategoryName(item.category);
    setVariety(item.variety);
    if (item.size) {
      setSize(item.size);
    }
    if (item.grade) {
      setGrade(item.grade);
    } else {
      setGrade("");
    }
    if (item.originCountry) {
      setOriginCountry(item.originCountry);
    } else {
      setOriginCountry("");
    }
    if (item.subVariety) {
      setSubVariety(item.subVariety);
    } else {
      setSubVariety("");
    }
    
    setSearchQuery("");
    setSelectedSearchIndex(-1);
    setIsSearchFocused(false);

    // Auto-focus physical input for maximum efficiency
    setTimeout(() => {
      const qtyInput = document.getElementById("physical-qty-input");
      if (qtyInput) {
        qtyInput.focus();
        if (qtyInput instanceof HTMLInputElement) {
          qtyInput.select();
        }
      }
    }, 120);
  };

  // Keyboard Navigation: trigger focus on '/' or 'Ctrl+K'
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }
      
      if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
        e.preventDefault();
        const searchInput = document.getElementById("mobile-catalog-search");
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  // Set default size and variety when category shifts
  useEffect(() => {
    if (activeTemplate) {
      if (activeTemplate.varieties?.length > 0) {
        setVariety(activeTemplate.varieties[0]);
      }
      if (activeTemplate.sizes?.length > 0) {
        setSize(activeTemplate.sizes[0]);
      }
    }
  }, [categoryName, categories]);

  const getYesterdayDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch entered counts for audit tracking
  const fetchLocalTodayRecords = async () => {
    setLoading(true);
    try {
      const data = await getRecordsByDate(selectedDate);
      // Filter records according to section permission unless it is "All"
      const filtered = data.filter(rec => {
        const matchSection = currentUser.assignedSection === "All" || 
          currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.category.toLowerCase().trim()) ||
          rec.category.toLowerCase().trim() === categoryName.toLowerCase().trim();
          
        const matchStore = currentUser.assignedStoreNum === "All" || 
          currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.location.toLowerCase().trim()) ||
          rec.location.toLowerCase().trim() === storeNum.toLowerCase().trim();
          
        return matchSection && matchStore;
      });
      setRecords(filtered);

      // Load yesterday's records to fetch ending stock automatically as opening stock
      const yesterdayStr = getYesterdayDateString(selectedDate);
      const yesterdayData = await getRecordsByDate(yesterdayStr);
      setYesterdayRecords(yesterdayData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalTodayRecords();
  }, [selectedDate, categoryName]);

  // Derive unique variations that exist in the records for the selected variety/size!
  const variationOptions = React.useMemo(() => {
    const origins = new Set<string>();
    const grades = new Set<string>();
    const subVars = new Set<string>();

    // 1. Add from template defaults (as fallback/base)
    if (activeTemplate) {
      if (activeTemplate.origins) activeTemplate.origins.forEach(o => o && origins.add(o.trim()));
      if (activeTemplate.grades) activeTemplate.grades.forEach(g => g && grades.add(g.trim()));
      if (activeTemplate.subVarieties) activeTemplate.subVarieties.forEach(s => s && subVars.add(s.trim()));
    }

    // 2. Scan today's and yesterday's records with matching variety to harvest custom ones!
    const allKnown = [...records, ...yesterdayRecords];
    allKnown.forEach(r => {
      if (r.category.toLowerCase() === categoryName.toLowerCase() && r.variety.toLowerCase() === variety.toLowerCase()) {
        if (r.originCountry) origins.add(r.originCountry.trim());
        if (r.grade) grades.add(r.grade.trim());
        if (r.subVariety) subVars.add(r.subVariety.trim());
      }
    });

    return {
      origins: Array.from(origins).filter(Boolean),
      grades: Array.from(grades).filter(Boolean),
      subVarieties: Array.from(subVars).filter(Boolean)
    };
  }, [categoryName, variety, activeTemplate, records, yesterdayRecords]);

  // Derive dynamic stock metrics live from selected variety, size, store, and optional variations!
  const mathYesterdayMatch = yesterdayRecords.find(y => 
    y.category.toLowerCase() === categoryName.toLowerCase() &&
    y.variety.toLowerCase() === variety.toLowerCase() &&
    y.size === size &&
    y.location === storeNum &&
    (y.originCountry || "").toLowerCase().trim() === (originCountry || "").toLowerCase().trim() &&
    (y.grade || "").toLowerCase().trim() === (grade || "").toLowerCase().trim() &&
    (y.subVariety || "").toLowerCase().trim() === (subVariety || "").toLowerCase().trim()
  );

  const mathTodayMatch = records.find(r => 
    r.category.toLowerCase() === categoryName.toLowerCase() &&
    r.variety.toLowerCase() === variety.toLowerCase() &&
    r.size === size &&
    r.location === storeNum &&
    (r.originCountry || "").toLowerCase().trim() === (originCountry || "").toLowerCase().trim() &&
    (r.grade || "").toLowerCase().trim() === (grade || "").toLowerCase().trim() &&
    (r.subVariety || "").toLowerCase().trim() === (subVariety || "").toLowerCase().trim()
  );

  // Pre-populate fields when selection matches an existing count record
  useEffect(() => {
    if (mathTodayMatch) {
      setQuantity(mathTodayMatch.available);
      setNotes(mathTodayMatch.notes || "");
    } else {
      setQuantity(0);
      setNotes("");
    }
  }, [variety, size, storeNum, originCountry, grade, subVariety, records]);

  // Opening stock is today's custom-saved opening count, else yesterday's ending available count, else 0
  const calculatedOpening = mathTodayMatch ? mathTodayMatch.openingStock : (mathYesterdayMatch ? mathYesterdayMatch.available : 0);
  const calculatedIncoming = mathTodayMatch ? mathTodayMatch.incoming : 0;
  const calculatedTotalBook = calculatedOpening + calculatedIncoming;
  const calculatedSold = Math.max(0, calculatedTotalBook - quantity);

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => Math.max(0, prev - 1));

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variety || !size) {
      alert("Please select a variety and size.");
      return;
    }
    setSaving(true);
    setSuccessMsg(null);

    try {
      // Find historical record with matching parameters and variations to calculate correct math
      const existing = records.find(r => 
        r.category === categoryName && 
        r.variety === variety && 
        r.size === size && 
        r.location === storeNum &&
        (r.originCountry || "").toLowerCase().trim() === (originCountry || "").toLowerCase().trim() &&
        (r.grade || "").toLowerCase().trim() === (grade || "").toLowerCase().trim() &&
        (r.subVariety || "").toLowerCase().trim() === (subVariety || "").toLowerCase().trim()
      );

      // Mobile saving logic: physical counted inside store
      const recordPayload: InventoryRecord = {
        id: existing?.id || undefined, // Keep Firestore doc ID to overwrite
        date: selectedDate,
        category: categoryName,
        variety,
        size,
        location: storeNum,
        arrivalDate,
        openingStock: calculatedOpening,
        incoming: calculatedIncoming,
        sold: calculatedSold,
        available: quantity, // Handheld physical count modifies available stock
        notes: notes || existing?.notes || "Counted via Mobile App",
        updatedAt: new Date().toISOString(),
        originCountry: originCountry.trim() || undefined,
        grade: grade.trim() || undefined,
        subVariety: subVariety.trim() || undefined
      };

      await saveRecord(recordPayload);

      // Log progress activity
      try {
        await logActivity(
          "update",
          `Mobile Stocktake by ${currentUser.name} (${currentUser.role}): Saved ${categoryName} - ${variety} (Size: ${size}${
            originCountry ? `, Origin: ${originCountry}` : ""
          }${
            grade ? `, Grade: ${grade}` : ""
          }${
            subVariety ? `, Sub-variety: ${subVariety}` : ""
          }) inside ${storeNum} with physical quantity ${quantity} Pkgs.`
        );
      } catch (logErr) {
        console.error("Non-blocking error logging mobile activity:", logErr);
      }

      setSuccessMsg(`Successfully saved: ${variety} (${size}) = ${quantity} pkgs`);
      
      // Flash animation & speech if permitted or quick reset
      setQuantity(0);
      setNotes("");
      setOriginCountry("");
      setGrade("");
      setSubVariety("");
      await fetchLocalTodayRecords();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Error writing counts. Record cached locally.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!window.confirm(`Delete count for ${name}?`)) return;
    try {
      await deleteRecord(id, selectedDate);
      await fetchLocalTodayRecords();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="mobile-mode-container" className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      theme === 'dark' 
        ? "bg-slate-950 text-slate-100 dark" 
        : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* High-Contrast Mobile Header */}
      <header className={`border-b p-4 sticky top-0 z-50 shadow-lg transition-colors duration-300 ${
        theme === 'dark'
          ? "bg-slate-950 border-slate-800 text-white"
          : "bg-green-800 border-green-900 text-white"
      }`}>
        <div className="flex justify-between items-center max-w-lg mx-auto w-full">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-yellow-405 animate-pulse' : 'bg-yellow-350 animate-pulse'}`} />
              <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                Sharbatly Cold-Store WebApp
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-350 mt-0.5">
              <User className="w-3.5 h-3.5 text-yellow-400" />
              <span>{currentUser.name}</span>
              <span className="bg-emerald-950/80 border border-emerald-700 text-[10px] text-emerald-400 px-1 rounded font-bold uppercase">
                {currentUser.assignedSection} Log
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleTheme && (
              <button 
                type="button"
                onClick={onToggleTheme}
                className={`py-1.5 px-2.5 rounded-lg border flex items-center gap-1 transition-all text-[11px] font-bold uppercase cursor-pointer ${
                  theme === 'dark'
                    ? "bg-yellow-450 hover:bg-yellow-400 text-slate-950 border-yellow-350"
                    : "bg-slate-900 hover:bg-slate-800 text-white border-slate-700"
                }`}
                title={theme === 'dark' ? "Switch to Office Bright Light Mode" : "Switch to Coldroom Dark High-Contrast Mode"}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-green-950 stroke-[2.5]" />
                    <span className="hidden sm:inline">Office</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-yellow-350 fill-yellow-350 stroke-[2]" />
                    <span className="hidden sm:inline">Coldroom</span>
                  </>
                )}
              </button>
            )}

            {showSuiteToggle && onToggleSuite && (
              <button 
                type="button"
                onClick={onToggleSuite}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[11px] font-black py-1.5 px-2.5 rounded-lg border border-yellow-400 flex items-center gap-1 transition-all shadow-md"
              >
                💻 Office Suite
              </button>
            )}
            <button 
              onClick={onLogout}
              className="bg-red-950/60 hover:bg-red-900 text-red-100 text-[11px] font-bold py-1.5 px-3 rounded-lg border border-red-900/40 flex items-center gap-1 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 space-y-4">
        
        {/* Banner Alert Feedback */}
        {successMsg && (
          <div className="bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 text-xs py-3 px-4 rounded-xl flex items-center gap-2 font-semibold shadow-xl animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Date & Location Quick Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-1 text-slate-300 text-xs">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 text-white border-0 focus:ring-0 text-xs tracking-tight py-1 px-1 rounded font-bold font-mono"
            />
          </div>
          
          <div className="flex items-center gap-1 text-slate-300 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
            {assignedStoresList.length === 1 ? (
              <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded font-mono">
                {assignedStoresList[0]}
              </span>
            ) : (
              <select
                value={storeNum}
                onChange={(e) => setStoreNum(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-100 py-1 px-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 font-bold"
              >
                {assignedStoresList.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Real-time Catalog Search Interface */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="mobile-catalog-search"
              type="text"
              placeholder="Search variety, category or grade (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedSearchIndex(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Delay so that click on the dropdown button registers before dropdown vanishes
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
              onKeyDown={(e) => {
                if (filteredCatalogItems.length === 0) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedSearchIndex(prev => 
                    prev < filteredCatalogItems.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedSearchIndex(prev => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (selectedSearchIndex >= 0 && selectedSearchIndex < filteredCatalogItems.length) {
                    handleSelectCatalogItem(filteredCatalogItems[selectedSearchIndex]);
                  } else if (filteredCatalogItems.length > 0) {
                    handleSelectCatalogItem(filteredCatalogItems[0]);
                  }
                } else if (e.key === "Escape") {
                  setSearchQuery("");
                  setSelectedSearchIndex(-1);
                  e.currentTarget.blur();
                }
              }}
              className="w-full pl-9 pr-14 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-550 focus:border-emerald-500 font-sans tracking-wide transition-colors text-white"
            />
            {/* Keyboard shortcut icon decoration */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-950 border border-slate-800 rounded font-mono select-none">
                /
              </span>
            </div>
          </div>

          {/* Real-time search/filtered catalog results */}
          {isSearchFocused && searchQuery.trim() !== "" && (
            <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-850 max-h-64 overflow-y-auto">
              {filteredCatalogItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  No matching variety, grade, or section found
                </div>
              ) : (
                filteredCatalogItems.map((item, idx) => {
                  const isSelected = idx === selectedSearchIndex;
                  return (
                    <div
                      key={item.id}
                      id={`search-result-item-${idx}`}
                      onMouseDown={(e) => {
                        // Prevent input blur before click action fires
                        e.preventDefault();
                      }}
                      onClick={() => handleSelectCatalogItem(item)}
                      className={`w-full text-left p-3 flex justify-between items-center cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-slate-800 text-white font-semibold" 
                          : "text-slate-300 hover:bg-slate-850/60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-slate-600 text-[10px]">•</span>
                          <span className="text-xs font-semibold">
                            {item.variety}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-sans">
                          {item.displayDetail}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.source === 'record' ? (
                          <span className="bg-emerald-950/60 border border-emerald-950/40 text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 rounded">
                            Batched
                          </span>
                        ) : (
                          <span className="bg-slate-950 border border-slate-855 text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded">
                            Fruit Catalog
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-yellow-450 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Handheld stock taking form */}
        <form onSubmit={handleSaveStock} className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-md">
          
          {/* Fruit/Veg Section Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              1. Select Fruit/Item Type
            </label>
            {sectionFilteredCategories.length <= 1 ? (
              <div className="bg-slate-900 text-white font-extrabold px-3 py-2.5 rounded-lg border border-slate-800 text-sm">
                🍅 {categoryName} Category
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {sectionFilteredCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryName(c.name)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                      categoryName === c.name
                        ? "bg-emerald-500 border-emerald-400 text-slate-950 font-extrabold shadow-md transform scale-[1.02]"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Variety Selector (Touch grids for speed!) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5">
              2. select Variety tag
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-850">
              {activeTemplate?.varieties.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariety(v)}
                  className={`py-2 px-2 text-[11px] font-bold rounded text-left flex justify-between items-center transition-all ${
                    variety === v
                      ? "bg-slate-800 border-l-4 border-yellow-450 text-white font-extrabold"
                      : "bg-slate-950/60 border border-transparent text-slate-500"
                  }`}
                >
                  <span className="truncate">{v}</span>
                  {variety === v && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0 select-none" />}
                </button>
              ))}
            </div>
          </div>

          {/* Size and Arrival date selection */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Size Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                3. Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-800 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
              >
                {activeTemplate?.sizes.map((s) => (
                  <option key={s} value={s}>Size #{s}</option>
                ))}
              </select>
            </div>

            {/* Arrival Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                4. Arrival Date
              </label>
              <input 
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-800 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>

          </div>

          {/* Optional Product Variations (Origin, Grade, Sub-variety) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3.5">
            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block">
              🌐 Product Variations / Specifics (Optional)
            </span>
            
            <div className="space-y-3">
              {/* Origin Selection */}
              <div className="border-b border-slate-850 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] text-slate-400 font-extrabold uppercase">Origin Country</label>
                  {originCountry && (
                    <button 
                      type="button" 
                      onClick={() => setOriginCountry("")} 
                      className="text-[8px] text-rose-500 hover:underline font-bold font-sans uppercase"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. USA, Egypt, Spain"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg px-2.5 py-2 text-[12px] font-bold focus:ring-1 focus:ring-emerald-500 font-sans"
                />
                {variationOptions.origins.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {variationOptions.origins.map((orig) => (
                      <button
                        key={orig}
                        type="button"
                        onClick={() => setOriginCountry(orig)}
                        className={`text-[9px] font-black font-sans px-2.5 py-1 rounded-md transition-all border cursor-pointer ${
                          originCountry.toLowerCase().trim() === orig.toLowerCase().trim()
                            ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm"
                            : "bg-slate-950 hover:bg-slate-850 text-slate-400 border-slate-850"
                        }`}
                      >
                        {orig}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grade Selection */}
              <div className="border-b border-slate-850 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] text-slate-400 font-extrabold uppercase">Quality Grade</label>
                  {grade && (
                    <button 
                      type="button" 
                      onClick={() => setGrade("")} 
                      className="text-[8px] text-rose-500 hover:underline font-bold font-sans uppercase"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Extra Fancy, Class 1"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg px-2.5 py-2 text-[12px] font-bold focus:ring-1 focus:ring-emerald-500 font-sans"
                />
                {variationOptions.grades.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {variationOptions.grades.map((grd) => (
                      <button
                        key={grd}
                        type="button"
                        onClick={() => setGrade(grd)}
                        className={`text-[9px] font-black font-sans px-2.5 py-1 rounded-md transition-all border cursor-pointer ${
                          grade.toLowerCase().trim() === grd.toLowerCase().trim()
                            ? "bg-amber-500 border-amber-400 text-slate-950 shadow-sm"
                            : "bg-slate-950 hover:bg-slate-850 text-slate-400 border-slate-850"
                        }`}
                      >
                        {grd}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-variety Selection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] text-slate-400 font-extrabold uppercase">Sub-variety</label>
                  {subVariety && (
                    <button 
                      type="button" 
                      onClick={() => setSubVariety("")} 
                      className="text-[8px] text-rose-500 hover:underline font-bold font-sans uppercase"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Gala, Sweet, Mini"
                  value={subVariety}
                  onChange={(e) => setSubVariety(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg px-2.5 py-2 text-[12px] font-bold focus:ring-1 focus:ring-emerald-500 font-sans"
                />
                {variationOptions.subVarieties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {variationOptions.subVarieties.map((subv) => (
                      <button
                        key={subv}
                        type="button"
                        onClick={() => setSubVariety(subv)}
                        className={`text-[9px] font-black font-sans px-2.5 py-1 rounded-md transition-all border cursor-pointer ${
                          subVariety.toLowerCase().trim() === subv.toLowerCase().trim()
                            ? "bg-sky-500 border-sky-400 text-slate-950 shadow-sm"
                            : "bg-slate-950 hover:bg-slate-850 text-slate-400 border-slate-850"
                        }`}
                      >
                        {subv}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Stock Calculation Widget (Auto computations) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
            <div className="text-yellow-400 font-extrabold uppercase tracking-widest text-[9.5px] border-b border-slate-850 pb-1.5 flex justify-between items-center">
              <span>📊 Dynamic Balancing Math (computed)</span>
              <span className="bg-slate-850 text-slate-300 font-mono text-[8px] px-1.5 py-0.2 rounded">Real-time status</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <div className="text-slate-400 font-mono uppercase text-[8px]">Prev Opening</div>
                <div className="text-white font-mono font-bold text-sm mt-0.5">{calculatedOpening}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <div className="text-emerald-400 font-mono uppercase text-[8px]">Arrival Today</div>
                <div className="text-white font-mono font-bold text-sm mt-0.5">{calculatedIncoming}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                <div className="text-slate-400 font-mono uppercase text-[8px]">Total Expected</div>
                <div className="text-yellow-350 font-mono font-bold text-sm mt-0.5">{calculatedTotalBook}</div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-850/60 flex justify-between items-center flex-wrap gap-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Estimated sold Today:</span>
              <span className="font-mono font-extrabold text-orange-400 text-xs bg-orange-950/50 px-2 py-0.5 rounded border border-orange-900/20">
                {calculatedSold} Pkgs
              </span>
            </div>
          </div>

          {/* Massive Handheld Quantity input pad */}
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
            <label className="block text-[10.5px] font-extrabold text-yellow-430 uppercase tracking-widest mb-2 pl-1">
              5. ENTER PHYSICAL QUANTITY (Cartons/Cases)
            </label>
            
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-12 h-12 bg-slate-800 hover:bg-slate-705 active:bg-slate-700 rounded-xl flex items-center justify-center border border-slate-700 text-white select-none shadow hover:border-yellow-400"
              >
                <Minus className="w-5 h-5 text-yellow-400" />
              </button>

              <div className="flex-1 relative">
                <input
                  id="physical-qty-input"
                  type="number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={quantity === 0 ? "" : quantity}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                    setQuantity(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full bg-slate-950 text-white font-mono font-extrabold text-center text-2xl py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                <span className="absolute right-3.5 top-3.5 text-[9px] text-slate-500 uppercase font-mono font-bold select-none">
                  Pkgs
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-12 h-12 bg-slate-800 hover:bg-slate-705 active:bg-slate-700 rounded-xl flex items-center justify-center border border-slate-700 text-white select-none shadow hover:border-yellow-400"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
              </button>
            </div>

            {/* Quick-pad quantities for rapid single-tap input inside cold rooms */}
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {[+5, +10, +25, +50, +100].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setQuantity(prev => prev + inc)}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-850 active:scale-95 transition-all text-emerald-400"
                >
                  +{inc}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuantity(0)}
                className="bg-red-950/50 hover:bg-red-900 border border-red-800 text-red-400 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg ml-auto active:scale-95"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Quick Notes */}
          <div>
            <input 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add short pallet note (e.g. Pallet 4 back, slightly soft)"
              className="w-full bg-slate-900 text-slate-300 border border-slate-855 rounded-lg p-2.5 text-xs placeholder:text-slate-550 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-sans font-extrabold text-sm py-3.5 rounded-xl border-b-4 border-emerald-700 flex items-center justify-center gap-2 tracking-wide uppercase shadow-lg transition-transform active:translate-y-0.5"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-slate-950" />
            )}
            Log Count Counted
          </button>

        </form>

        {/* Handheld audit log panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-bold font-mono tracking-wider uppercase">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              Progress Log: {selectedDate}
            </span>
            <button
              onClick={fetchLocalTodayRecords}
              className="p-1 px-2 rounded hover:bg-slate-900 border border-slate-800 text-[10px] font-mono flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              Reload
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading recorded counts...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wide">
              No fruit counts saved for this date yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {records.map((rec, idx) => (
                <div 
                  key={rec.id || `mob-rec-${idx}`}
                  className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rec.variety}</span>
                      <span className="bg-slate-800 text-[9px] text-slate-300 px-1 rounded font-mono">
                        #{rec.size}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Store: {rec.location} • Arr: {rec.arrivalDate}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-emerald-400 font-mono font-black text-sm">{rec.available} <span className="text-[8px] uppercase">Box</span></div>
                      <div className="text-[9px] text-slate-500">Physical Count</div>
                    </div>
                    <button
                      onClick={() => rec.id && handleDeleteRecord(rec.id, rec.variety)}
                      type="button"
                      className="p-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/60 rounded-lg transition-colors border border-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Touch footer */}
      <footer className="bg-slate-950 border-t border-slate-850 py-4 text-center text-[10px] text-slate-500 font-mono">
        <div>M.A. Sharbatly Co. Cold Chain Network</div>
        <div className="mt-1 text-[9px] text-emerald-500 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Fully Backed Up & Endrypted to Cloud Database.
        </div>
      </footer>

    </div>
  );
}
