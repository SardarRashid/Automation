
import { 
  Users, UserPlus, Trash2, Edit2, Shield, 
  Check, Lock, ChevronRight, RefreshCw, Mail, 
  Warehouse, Layers, AlertCircle, UploadCloud, Download
} from "lucide-react";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Storekeeper, StoreRoom } from "../types";
import { exportToCSV, parseCSV } from "../../utils/csv";
import { getStorekeepers, saveStorekeeper, deleteStorekeeper, getStoreRooms } from "../services/dbService";
import { ref, set } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useToast } from '../../components/ui/ToastNotification';

interface AdminConsoleProps {
  categories: { id: string; name: string }[];
}

export function AdminConsole({ categories }: AdminConsoleProps) {
  const [storekeepers, setStorekeepers] = useState<Storekeeper[]>([]);
  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addToast } = useToast();

  // Form states
  const [isEditing, setIsEditing] = useState<string | null>(null); // Id of storekeeper being edited
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>(["All"]);
  const [selectedStores, setSelectedStores] = useState<string[]>(["All"]);
  const [role, setRole] = useState<'it_admin' | 'manager' | 'supervisor' | 'storekeeper'>("storekeeper");
  const [hasMobileAccess, setHasMobileAccess] = useState(true);

  // Load storekeepers and store-rooms dynamically
  const loadUsersAndStores = async () => {
    setLoading(true);
    try {
      const data = await getStorekeepers();
      setStorekeepers(data);
      const rooms = await getStoreRooms();
      setStoreRooms(rooms);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load storekeeper and cold room records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndStores();
  }, []);

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !pin) {
      setErrorMsg("Please fill in all mandatory fields (Name, Username/Email, password/PIN).");
      return;
    }

    try {
      const newUserId = isEditing || (role === 'it_admin' ? "admin_" : role === 'manager' ? "manager_" : role === 'supervisor' ? "super_" : "keeper_") + Math.random().toString(36).substring(2, 9);
      
      const finalSections = selectedSections.length === 0 ? "All" : selectedSections.join(",");
      const finalStores = selectedStores.length === 0 ? "All" : selectedStores.join(",");

      const payload: Storekeeper = {
        id: newUserId,
        name,
        email,
        pin,
        assignedSection: finalSections,
        assignedStoreNum: finalStores,
        role,
        hasMobileAccess: hasMobileAccess
      };

      await saveStorekeeper(payload);
      triggerFeedback(isEditing ? "User profile & permissions updated!" : "New staff member successfully registered!");
      
      // Reset form
      setIsEditing(null);
      setName("");
      setEmail("");
      setPin("");
      setSelectedSections(["All"]);
      setSelectedStores(["All"]);
      setRole("storekeeper");
      setHasMobileAccess(true);
      setErrorMsg(null);
      // Reload
      await loadUsersAndStores();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error saving storekeeper. Insufficient permission or connection loss.");
    }
  };

  const handleStartEdit = (keeper: Storekeeper) => {
    setIsEditing(keeper.id);
    setName(keeper.name);
    setEmail(keeper.email);
    setPin(keeper.pin);
    
    // Parse assignedSection (can be comma-separated or e.g. "Apple")
    if (keeper.assignedSection === "All") {
      setSelectedSections(["All"]);
    } else {
      setSelectedSections(keeper.assignedSection.split(","));
    }

    // Parse assignedStoreNum
    if (keeper.assignedStoreNum === "All") {
      setSelectedStores(["All"]);
    } else {
      setSelectedStores(keeper.assignedStoreNum.split(","));
    }

    setRole(keeper.role);
    setHasMobileAccess(keeper.hasMobileAccess !== false); // default to true
    setErrorMsg(null);
  };

  const handleCancelEditing = () => {
    setIsEditing(null);
    setName("");
    setEmail("");
    setPin("");
    setSelectedSections(["All"]);
    setSelectedStores(["All"]);
    setRole("storekeeper");
    setHasMobileAccess(true);
    setErrorMsg(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete staff account "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteStorekeeper(id);
      triggerFeedback(`Staff account "${name}" deleted.`);
      await loadUsersAndStores();
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to delete user.");
    }
  };

  // Helper for Section (Fruit/Item Category) checkbox selection
  const isAllSectionsSelected = selectedSections.includes("All");
  
  const handleSectionCheckboxChange = (sectionName: string) => {
    if (sectionName === "All") {
      if (isAllSectionsSelected) {
        setSelectedSections([]);
      } else {
        setSelectedSections(["All"]);
      }
    } else {
      if (isAllSectionsSelected) {
        // If "All" was checked, unchecking this specific one means compiling the rest
        const active = categories.map(c => c.name).filter(x => x !== sectionName);
        setSelectedSections(active);
      } else {
        const isSelected = selectedSections.includes(sectionName);
        if (isSelected) {
          setSelectedSections(prev => prev.filter(x => x !== sectionName));
        } else {
          setSelectedSections(prev => {
            const next = [...prev.filter(x => x !== "All"), sectionName];
            const allNames = categories.map(c => c.name);
            const isAllNow = allNames.every(x => next.includes(x));
            return isAllNow ? ["All"] : next;
          });
        }
      }
    }
  };

  // Helper for Cold Room checkbox selection
  const isAllStoresSelected = selectedStores.includes("All");
  const availableRoomsList = storeRooms.length > 0 
    ? storeRooms.map(r => r.name) 
    : ["Store 1", "Store 2", "Store 3", "Store 4", "Store 5", "Store 6", "Vegetable Area", "Flower Cooler"];

  const handleStoreCheckboxChange = (roomName: string) => {
    if (roomName === "All") {
      if (isAllStoresSelected) {
        setSelectedStores([]);
      } else {
        setSelectedStores(["All"]);
      }
    } else {
      if (isAllStoresSelected) {
        // If "All" was checked, unchecking this specific one means compiling the rest
        const active = availableRoomsList.filter(x => x !== roomName);
        setSelectedStores(active);
      } else {
        const isSelected = selectedStores.includes(roomName);
        if (isSelected) {
          setSelectedStores(prev => prev.filter(x => x !== roomName));
        } else {
          setSelectedStores(prev => {
            const next = [...prev.filter(x => x !== "All"), roomName];
            const isAllNow = availableRoomsList.every(x => next.includes(x));
            return isAllNow ? ["All"] : next;
          });
        }
      }
    }
  };


  const handleExportStaff = () => {
    const headers = ['name', 'email', 'pin', 'role', 'assignedSection', 'assignedStoreNum'];
    exportToCSV('inventory_staff', localStorekeepers, headers);
  };

  const handleImportStaff = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.email) continue; // Skip empty rows
        const newSk: Storekeeper = {
          id: 'sk_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name: row.name || '',
          email: row.email || '',
          pin: row.pin || '1234',
          role: row.role || 'storekeeper',
          assignedStoreRooms: [],
          assignedSection: row.assignedSection || 'All',
          assignedStoreNum: row.assignedStoreNum || 'All',
          assignedLocation: 'All'
        };
        await saveStorekeeper(newSk);
      }
      addToast('success', 'Staff imported successfully!');
      refreshData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to import CSV');
    }
  };

  const handleClearAllInventory = async () => {
    if (window.confirm("Are you absolutely SURE you want to clear ALL inventory records? This action is irreversible.")) {
      try {
        await set(ref(database, 'inventory_records'), null);
        addToast('success', "All inventory data cleared.");
      } catch (e) {
        console.error(e);
        addToast('error', "Failed to clear data.");
      }
    }
  };
  return (
    <div id="admin-console-root" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-green-705" />
            Storekeeper & Access Control Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Create storekeeper accounts, assign physical cold rooms, and grant section permissions instantly.
          </p>
        </div>
        {feedback && (
          <div className="bg-green-50 text-green-900 text-xs px-3.5 py-2 rounded-lg border border-yellow-350 flex items-center gap-1.5 font-sans font-semibold animate-pulse">
            <Check className="w-4 h-4 text-green-700" />
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 text-red-900 text-xs px-3.5 py-2 rounded-lg border border-red-200 flex items-center gap-1.5 font-sans font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600" />
            {errorMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Creation / Edit Panel */}
        <div className="lg:col-span-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 shadow-xs">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-green-750" />
            {isEditing ? "Edit Keyholder Account" : "Register Storekeeper Account"}
          </h3>

          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            
             {/* Role & Access Controls */}
             <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Staff Authority Designation
              </label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole("storekeeper");
                    setHasMobileAccess(true);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center border transition-all ${
                    role === "storekeeper"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Storekeeper (Mobile)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("supervisor")}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center border transition-all ${
                    role === "supervisor"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Supervisor (Both Apps)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("manager");
                    setHasMobileAccess(true);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center border transition-all ${
                    role === "manager"
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Master Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("it_admin");
                    setHasMobileAccess(true);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center border transition-all ${
                    role === "it_admin"
                      ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  IT / Security Admin
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Staff Member Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Syed Muhammad"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-green-500 font-sans"
              />
            </div>

            {/* Email / Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Security Login Username (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. syed@sharbatly.com"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-green-500 font-sans"
                />
              </div>
            </div>

            {/* PIN / Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Terminal Access PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 1234 or super786"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-mono tracking-wider text-slate-800 focus:outline-green-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Numerical digits or characters.</p>
            </div>

            {/* Configured Section permissions with Checkbox List */}
            <div className="space-y-2 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Assigned Fruit Sections ({isAllSectionsSelected ? "All" : selectedSections.length})
                </label>
              </div>

              {/* Checkboxes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {/* Select All */}
                <label 
                  id="section-checkbox-all-parent"
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg border transition-all text-xs cursor-pointer select-none ${
                    isAllSectionsSelected 
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 font-bold" 
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="section-checkbox-all"
                    checked={isAllSectionsSelected}
                    onChange={() => handleSectionCheckboxChange("All")}
                    className="rounded text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer accent-emerald-600"
                  />
                  <span>Select All Categories</span>
                </label>

                {/* Individual Categories */}
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((c) => {
                    const isSelected = isAllSectionsSelected || selectedSections.includes(c.name);
                  
  const handleExportStaff = () => {
    const headers = ['name', 'email', 'pin', 'role', 'assignedSection', 'assignedStoreNum'];
    exportToCSV('inventory_staff', localStorekeepers, headers);
  };

  const handleImportStaff = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.email) continue; // Skip empty rows
        const newSk: Storekeeper = {
          id: 'sk_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name: row.name || '',
          email: row.email || '',
          pin: row.pin || '1234',
          role: row.role || 'storekeeper',
          assignedStoreRooms: [],
          assignedSection: row.assignedSection || 'All',
          assignedStoreNum: row.assignedStoreNum || 'All',
          assignedLocation: 'All'
        };
        await saveStorekeeper(newSk);
      }
      addToast('success', 'Staff imported successfully!');
      refreshData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to import CSV');
    }
  };
  return (
                      <label
                        key={c.id}
                        id={`section-checkbox-${c.id}-parent`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-xs cursor-pointer select-none ${
                          isSelected
                            ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                            : "bg-white dark:bg-slate-950/10 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`section-checkbox-${c.id}`}
                          checked={isSelected}
                          onChange={() => handleSectionCheckboxChange(c.name)}
                          className="rounded text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                💡 Check off the individual fruit categories this staff is authorized to audit.
              </p>
            </div>

            {/* Configured Store/Room numbers with Checkbox List */}
            <div className="space-y-2 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Assigned Cold Rooms ({isAllStoresSelected ? "All" : selectedStores.length})
                </label>
              </div>

              {/* Checkboxes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {/* Select All */}
                <label 
                  id="store-checkbox-all-parent"
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg border transition-all text-xs cursor-pointer select-none ${
                    isAllStoresSelected 
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 font-bold" 
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="store-checkbox-all"
                    checked={isAllStoresSelected}
                    onChange={() => handleStoreCheckboxChange("All")}
                    className="rounded text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer accent-emerald-600"
                  />
                  <span>Select All Cold Rooms</span>
                </label>

                {/* Individual Rooms */}
                <div className="grid grid-cols-2 gap-1.5">
                  {availableRoomsList.map((room, idx) => {
                    const isSelected = isAllStoresSelected || selectedStores.includes(room);
                  
  const handleExportStaff = () => {
    const headers = ['name', 'email', 'pin', 'role', 'assignedSection', 'assignedStoreNum'];
    exportToCSV('inventory_staff', localStorekeepers, headers);
  };

  const handleImportStaff = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const data = await parseCSV(e.target.files[0]);
      for (const row of data) {
        if (!row.name && !row.email) continue; // Skip empty rows
        const newSk: Storekeeper = {
          id: 'sk_' + Date.now() + Math.random().toString(36).substr(2, 9),
          name: row.name || '',
          email: row.email || '',
          pin: row.pin || '1234',
          role: row.role || 'storekeeper',
          assignedStoreRooms: [],
          assignedSection: row.assignedSection || 'All',
          assignedStoreNum: row.assignedStoreNum || 'All',
          assignedLocation: 'All'
        };
        await saveStorekeeper(newSk);
      }
      addToast('success', 'Staff imported successfully!');
      refreshData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to import CSV');
    }
  };
  return (
                      <label
                        key={room}
                        id={`store-checkbox-${idx}-parent`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-xs cursor-pointer select-none ${
                          isSelected
                            ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                            : "bg-white dark:bg-slate-950/10 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`store-checkbox-${idx}`}
                          checked={isSelected}
                          onChange={() => handleStoreCheckboxChange(room)}
                          className="rounded text-emerald-650 dark:text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                        />
                        <span className="truncate">{room}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                💡 Check off the individual storage room locations this staff is authorized to audit.
              </p>
            </div>

            {/* Grant Handheld App Access */}
            <div className="flex items-center gap-2 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="hasMobileAccessField"
                checked={hasMobileAccess}
                onChange={(e) => setHasMobileAccess(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer accent-emerald-600"
              />
              <label 
                htmlFor="hasMobileAccessField" 
                className="text-xs text-slate-700 font-bold select-none cursor-pointer"
              >
                Grant mobile taking app access
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-green-800 hover:bg-green-900 text-white font-bold text-xs py-2.5 rounded-lg border-b-2 border-yellow-500 transition-colors uppercase shrink-0"
              >
                {isEditing ? "Save Profile Changes" : "Apply Credentials"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-lg border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Right Side: Users Directory Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              Registered Staff Accounts ({storekeepers.length})
            </span>
            <button
              onClick={loadUsersAndStores}
              className="p-1 px-2 hover:bg-slate-100 rounded text-xs flex items-center gap-1 font-mono text-slate-500"
            >
              <RefreshCw className="w-3 h-3" />
              Sync Online
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-sans text-xs">
              <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Retrieving live staff database...
            </div>
          ) : storekeepers.length === 0 ? (
            <div className="py-14 border-2 border-dashed border-slate-150 rounded-2xl flex flex-col items-center text-slate-400">
              <Shield className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No custom users added yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Default backup accounts will be initialized upon logout/restart.</p>
            </div>
          ) : (
            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-4">Name & Access</th>
                    <th className="py-2.5 px-4">Assigned Section</th>
                    <th className="py-2.5 px-4">Cold Store</th>
                    <th className="py-2.5 px-4 text-center">Pin</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-sans">
                  {storekeepers.map((keeper) => (
                    <tr 
                      key={keeper.id} 
                      className={`hover:bg-slate-50/50 ${isEditing === keeper.id ? "bg-amber-50/40" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{keeper.name}</span>
                          {keeper.role === 'it_admin' && (
                            <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-mono font-bold px-1 py-0.5 rounded uppercase">
                              IT Admin
                            </span>
                          )}
                          {keeper.role === 'manager' && (
                            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-mono font-bold px-1 py-0.5 rounded uppercase">
                              Master Manager
                            </span>
                          )}
                          {keeper.role === 'supervisor' && (
                            <span className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-[9px] font-mono font-bold px-1 py-0.5 rounded uppercase">
                              Supervisor
                            </span>
                          )}
                          {keeper.role === 'storekeeper' && (
                            <span className="bg-slate-100 border border-slate-205 text-slate-700 text-[9px] font-mono font-bold px-1 py-0.5 rounded uppercase">
                              Storekeeper
                            </span>
                          )}
                          {keeper.hasMobileAccess && (
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-mono font-bold px-1 py-0.5 rounded uppercase" title="Can log in via mobile layout">
                              📱 Mobile
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{keeper.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {keeper.assignedSection === "All" ? (
                          <span className="bg-slate-100 text-slate-505 text-[10px] font-bold px-1.5 py-0.5 rounded">All Categories</span>
                        ) : (
                          <span className="font-semibold text-green-800 text-[11px] truncate block max-w-[150px]" title={keeper.assignedSection}>
                            {keeper.assignedSection}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {keeper.assignedStoreNum === "All" ? (
                          <span className="bg-slate-100 text-slate-505 text-[10px] font-bold px-1.5 py-0.5 rounded">All Cold Rooms</span>
                        ) : (
                          <span className="font-semibold text-slate-705 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] truncate block max-w-[150px]" title={keeper.assignedStoreNum}>
                            {keeper.assignedStoreNum}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                        {keeper.pin}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleStartEdit(keeper)}
                            className="bg-slate-100 hover:bg-slate-205 text-slate-600 p-1.5 rounded transition-colors"
                            title="Edit credentials"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(keeper.id, keeper.name)}
                            className="bg-red-50 hover:bg-red-105 text-red-600 p-1.5 rounded transition-colors"
                            title="Terminate access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Guidelines info box */}
          <div className="bg-yellow-50/50 rounded-xl p-4 border border-yellow-205/50 flex gap-3 text-xs text-yellow-900 leading-relaxed">
            <Shield className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Operational Policy Reminder:</span> Every cold room storekeeper has two layouts. On standard desktops, the portal loads the main suite containing export reports and template engines. On mobiles/tablets, storekeepers automatically open the high-contrast physical audit form.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
