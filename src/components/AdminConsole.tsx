import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, UserPlus, Trash2, Shield, 
  Check, Lock, RefreshCw, Mail, 
  Warehouse, Layers, AlertCircle, Search, Save, User, ShieldCheck, Database, Settings
} from "lucide-react";
import { Storekeeper, StoreRoom } from "../types";
import { getStorekeepers, saveStorekeeper, deleteStorekeeper, getStoreRooms } from "../services/dbService";

interface AdminConsoleProps {
  categories: { id: string; name: string }[];
}

type TabType = 'details' | 'appAccess' | 'appRoles' | 'permissions' | 'password' | 'advanced';

export function AdminConsole({ categories }: AdminConsoleProps) {
  const [storekeepers, setStorekeepers] = useState<Storekeeper[]>([]);
  const [storeRooms, setStoreRooms] = useState<StoreRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New UI States
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states (binds to selected user, or new user)
  const [isCreatingNew, setIsCreatingNew] = useState(false);
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

  const handleSelectUser = (user: Storekeeper) => {
    setSelectedUserId(user.id);
    setIsCreatingNew(false);
    setName(user.name);
    setEmail(user.email);
    setPin(user.pin);
    
    if (user.assignedSection === "All") {
      setSelectedSections(["All"]);
    } else {
      setSelectedSections(user.assignedSection.split(","));
    }

    if (user.assignedStoreNum === "All") {
      setSelectedStores(["All"]);
    } else {
      setSelectedStores(user.assignedStoreNum.split(","));
    }

    setRole(user.role);
    setHasMobileAccess(user.hasMobileAccess !== false);
    setErrorMsg(null);
    setActiveTab('details');
  };

  const handleAddNewClick = () => {
    setSelectedUserId(null);
    setIsCreatingNew(true);
    setName("");
    setEmail("");
    setPin("");
    setSelectedSections(["All"]);
    setSelectedStores(["All"]);
    setRole("storekeeper");
    setHasMobileAccess(true);
    setErrorMsg(null);
    setActiveTab('details');
  };

  const handleCreateOrUpdate = async () => {
    if (!name || !email || !pin) {
      setErrorMsg("Please fill in all mandatory fields (Name, Username/Email, password/PIN).");
      return;
    }

    try {
      const isEditing = !!selectedUserId;
      const newUserId = isEditing ? selectedUserId! : ((role === 'it_admin' ? "admin_" : role === 'manager' ? "manager_" : role === 'supervisor' ? "super_" : "keeper_") + Math.random().toString(36).substring(2, 9));
      
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
      
      if (!isEditing) {
        setSelectedUserId(newUserId);
        setIsCreatingNew(false);
      }
      
      setErrorMsg(null);
      await loadUsersAndStores();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error saving storekeeper. Insufficient permission or connection loss.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to disable staff account "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteStorekeeper(id);
      triggerFeedback(`Staff account "${name}" disabled.`);
      if (selectedUserId === id) {
        setSelectedUserId(null);
        setIsCreatingNew(false);
      }
      await loadUsersAndStores();
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to disable user.");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return storekeepers;
    return storekeepers.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [storekeepers, searchQuery]);

  // Checkbox helpers
  const isAllSectionsSelected = selectedSections.includes("All");
  const handleSectionCheckboxChange = (sectionName: string) => {
    if (sectionName === "All") {
      setSelectedSections(isAllSectionsSelected ? [] : ["All"]);
    } else {
      if (isAllSectionsSelected) {
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

  const isAllStoresSelected = selectedStores.includes("All");
  const availableRoomsList = storeRooms.length > 0 
    ? storeRooms.map(r => r.name) 
    : ["Store 1", "Store 2", "Store 3", "Store 4", "Store 5", "Store 6", "Vegetable Area", "Flower Cooler"];

  const handleStoreCheckboxChange = (roomName: string) => {
    if (roomName === "All") {
      setSelectedStores(isAllStoresSelected ? [] : ["All"]);
    } else {
      if (isAllStoresSelected) {
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

  const tabs: { id: TabType, label: string }[] = [
    { id: 'details', label: 'User Details' },
    { id: 'appAccess', label: 'Application Access' },
    { id: 'appRoles', label: 'App Roles' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'password', label: 'Password' },
    { id: 'advanced', label: 'Advanced' }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] bg-slate-50 gap-4 overflow-hidden -mx-2 sm:-mx-6 -my-6 p-4 sm:p-6">
      
      {/* LEFT PANEL: USERS DIRECTORY (25-30%) */}
      <div className="w-full lg:w-80 xl:w-96 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
        
        {/* Header & Search */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Users Directory
            </h2>
            <button
              onClick={loadUsersAndStores}
              className="text-slate-400 hover:text-indigo-600 transition-colors"
              title="Refresh Users"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* User List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex justify-center items-center h-20 text-slate-400">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-4 text-slate-400 text-sm">
              No users found.
            </div>
          ) : (
            filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  selectedUserId === user.id && !isCreatingNew
                    ? "bg-indigo-50 border border-indigo-200 shadow-sm"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                  selectedUserId === user.id && !isCreatingNew
                    ? "bg-indigo-600 text-white border-indigo-700"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 text-sm truncate">{user.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {user.role === 'it_admin' && <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">IT</span>}
                      {user.role === 'manager' && <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">MGR</span>}
                      {user.role === 'supervisor' && <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">SUP</span>}
                      <div className={`w-2 h-2 rounded-full ml-1 ${user.role === 'it_admin' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{user.email}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Add User Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleAddNewClick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: USER WORKSPACE (70-75%) */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
        
        {/* Global Feedback Overlays */}
        {feedback && (
          <div className="absolute top-4 right-4 z-50 bg-emerald-50 text-emerald-900 px-4 py-2.5 rounded-lg border border-emerald-200 flex items-center gap-2 font-semibold shadow-lg animate-in fade-in slide-in-from-top-4">
            <Check className="w-5 h-5 text-emerald-600" />
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="absolute top-4 right-4 z-50 bg-red-50 text-red-900 px-4 py-2.5 rounded-lg border border-red-200 flex items-center gap-2 font-semibold shadow-lg animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            {errorMsg}
          </div>
        )}

        {(!selectedUserId && !isCreatingNew) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <Shield className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">User Management Workspace</h3>
            <p className="text-sm text-center max-w-md">
              Select a user from the directory on the left to view and modify their profile, application access, and granular permissions.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Top Header of Workspace */}
            <div className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl border-4 border-white shadow-sm shrink-0">
                  {name ? name.substring(0, 2).toUpperCase() : <User size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                    {name || "Unnamed User"}
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${
                      selectedUserId 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      {selectedUserId ? "Active Profile" : "Draft Profile"}
                    </span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5 font-medium"><Mail className="w-4 h-4 text-slate-400" /> {email || "No email provided"}</span>
                    {selectedUserId && (
                       <span className="flex items-center gap-1.5 font-medium"><ShieldCheck className="w-4 h-4 text-slate-400" /> ID: {selectedUserId}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {selectedUserId && (
                  <button
                    onClick={() => handleDelete(selectedUserId, name)}
                    className="px-5 py-2.5 text-sm font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Disable User
                  </button>
                )}
                <button
                  onClick={handleCreateOrUpdate}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Top-Level Horizontal Navigation Tabs */}
            <div className="px-6 sm:px-8 border-b border-slate-200 bg-slate-50/50">
              <div className="flex gap-2 sm:gap-6 overflow-x-auto scrollbar-hide -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area for Tabs */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/30">
              <div className="max-w-4xl">
                
                {activeTab === 'details' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                      <User className="w-5 h-5 text-indigo-500" />
                      User Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          placeholder="e.g. john@example.com"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appAccess' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                      <Database className="w-5 h-5 text-indigo-500" />
                      Application Access
                    </h3>
                    
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-base">Inventory Mobile App</div>
                          <div className="text-sm text-slate-500 mt-1">Allow this user to log into the mobile stock-taking PWA via tablets or mobile devices.</div>
                        </div>
                        <button
                          onClick={() => setHasMobileAccess(!hasMobileAccess)}
                          className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${hasMobileAccess ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-transform ${hasMobileAccess ? 'left-8' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appRoles' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" />
                      App Roles
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(['it_admin', 'manager', 'supervisor', 'storekeeper'] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                            role === r 
                              ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                              : "border-slate-200 hover:border-slate-300 bg-white shadow-sm"
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            role === r ? "border-indigo-600" : "border-slate-300"
                          }`}>
                            {role === r && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                          </div>
                          <div>
                            <div className={`font-bold text-base ${role === r ? "text-indigo-900" : "text-slate-800"}`}>
                              {r === 'it_admin' ? "IT / Security Admin" : r === 'manager' ? "Master Manager" : r === 'supervisor' ? "Supervisor" : "Storekeeper"}
                            </div>
                            <div className="text-sm text-slate-500 mt-1 leading-relaxed">
                              {r === 'it_admin' && "Full system access to all settings, users, and administrative tools."}
                              {r === 'manager' && "Can manage daily operations, view reports, and configure catalog."}
                              {r === 'supervisor' && "Can oversee standard storekeeper operations and approve basic changes."}
                              {r === 'storekeeper' && "Limited to specific data entry tasks and basic inventory views."}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'permissions' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Categories */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-500" />
                          Product Categories
                        </h3>
                        <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          {isAllSectionsSelected ? "All Selected" : `${selectedSections.length} Selected`}
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <label className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isAllSectionsSelected}
                            onChange={() => handleSectionCheckboxChange("All")}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Grant Access to All Categories</span>
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categories.map((c) => {
                            const isSelected = isAllSectionsSelected || selectedSections.includes(c.name);
                            return (
                              <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isSelected ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white hover:border-slate-300"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSectionCheckboxChange(c.name)}
                                  className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="font-medium text-sm text-slate-700 truncate">{c.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Warehouse className="w-5 h-5 text-indigo-500" />
                          Cold Rooms & Warehouses
                        </h3>
                        <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          {isAllStoresSelected ? "All Selected" : `${selectedStores.length} Selected`}
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <label className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isAllStoresSelected}
                            onChange={() => handleStoreCheckboxChange("All")}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Grant Access to All Locations</span>
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableRoomsList.map((room) => {
                            const isSelected = isAllStoresSelected || selectedStores.includes(room);
                            return (
                              <label key={room} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isSelected ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white hover:border-slate-300"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleStoreCheckboxChange(room)}
                                  className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="font-medium text-sm text-slate-700 truncate">{room}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'password' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                      <Lock className="w-5 h-5 text-indigo-500" />
                      Password & Security
                    </h3>
                    
                    <div className="max-w-md space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Security PIN / Password</label>
                      <input
                        type="text"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono tracking-widest shadow-sm"
                        placeholder="Enter secure PIN"
                      />
                      <p className="text-xs text-slate-400 pl-1">This PIN is used to authenticate at terminals or handheld devices.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                      <Settings className="w-5 h-5 text-indigo-500" />
                      Advanced Settings
                    </h3>
                    
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-center">
                      <Settings className="w-12 h-12 text-slate-300 mb-4" />
                      <h4 className="text-lg font-bold text-slate-700">Advanced Configuration</h4>
                      <p className="text-sm text-slate-500 max-w-sm mt-2">
                        System metadata, session logs, and extended active directory settings will be available here in future updates.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
