import React, { useState, useEffect } from 'react';
import { database } from '../../lib/firebase';
import { ref, get, update } from 'firebase/database';
import type { CategoryTemplate, StoreRoom, Storekeeper } from '../types';
import { Layers, Warehouse, Users, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AssignmentConsoleProps {
  categories: CategoryTemplate[];
  storeRooms: StoreRoom[];
  onSaveStoreRoom: (room: StoreRoom) => Promise<void>;
}

export function AssignmentConsole({ categories, storeRooms, onSaveStoreRoom }: AssignmentConsoleProps) {
  const [activeTab, setActiveTab] = useState<'store-items' | 'staff-stores'>('store-items');
  const [users, setUsers] = useState<Storekeeper[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Store Items Assignment
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeFeedback, setStoreFeedback] = useState('');

  // State for Staff Assignment
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSaving, setUserSaving] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  
  // Edit Buffers
  const [activeStoreCategories, setActiveStoreCategories] = useState<string[]>([]);
  const [activeUserStores, setActiveUserStores] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(database, 'users'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsedUsers: Storekeeper[] = [];
        Object.keys(data).forEach(key => {
          const u = data[key];
          if (
            u.role === 'storekeeper' || 
            u.role === 'inventory_taking' || 
            u.allowedApps?.inventory_taking || 
            u.permissions?.inventory_mobile
          ) {
            parsedUsers.push({
              id: key,
              name: u.email ? u.email.split('@')[0] : key,
              email: u.email || '',
              pin: u.password || '',
              role: (u.role === 'storekeeper' || u.role === 'inventory_taking') ? 'storekeeper' : 'supervisor',
              assignedStoreNum: u.assignedStoreNum || 'All',
              assignedSection: u.assignedSection || 'All'
            });
          }
        });
        setUsers(parsedUsers);
        if (parsedUsers.length > 0) setSelectedUserId(parsedUsers[0].id);
      }
    } catch (err) {
      console.error("Error fetching users", err);
    }
    setLoading(false);
  };

  // Setup Store Buffer when selected store changes
  useEffect(() => {
    if (selectedStoreId) {
      const room = storeRooms.find(s => s.id === selectedStoreId);
      setActiveStoreCategories(room?.allowedCategories || []);
    } else if (storeRooms.length > 0) {
      setSelectedStoreId(storeRooms[0].id);
    }
  }, [selectedStoreId, storeRooms]);

  // Setup User Buffer when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        if (user.assignedStoreNum === 'All') {
          setActiveUserStores(storeRooms.map(s => s.name));
        } else {
          setActiveUserStores(user.assignedStoreNum.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
    }
  }, [selectedUserId, users, storeRooms]);

  const handleSaveStoreItems = async () => {
    const room = storeRooms.find(s => s.id === selectedStoreId);
    if (!room) return;
    
    setStoreSaving(true);
    setStoreFeedback('');
    try {
      await onSaveStoreRoom({
        ...room,
        allowedCategories: activeStoreCategories
      });
      setStoreFeedback('Store categories saved successfully!');
      setTimeout(() => setStoreFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setStoreFeedback('Error saving store categories.');
    }
    setStoreSaving(false);
  };

  const handleSaveUserStores = async () => {
    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    setUserSaving(true);
    setUserFeedback('');
    try {
      const assignedStoreNum = activeUserStores.length === storeRooms.length ? 'All' : activeUserStores.join(',');
      
      const updates: any = {};
      updates[`users/${user.id}/assignedStoreNum`] = assignedStoreNum;
      
      await update(ref(database), updates);
      
      setUsers(users.map(u => u.id === user.id ? { ...u, assignedStoreNum } : u));
      
      setUserFeedback('Staff store access saved successfully!');
      setTimeout(() => setUserFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setUserFeedback('Error saving staff access.');
    }
    setUserSaving(false);
  };

  const toggleStoreCategory = (catName: string) => {
    setActiveStoreCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const toggleUserStore = (storeName: string) => {
    setActiveUserStores(prev => 
      prev.includes(storeName) ? prev.filter(s => s !== storeName) : [...prev, storeName]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('store-items')}
          className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'store-items' ? 'bg-white text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-5 h-5" />
          Assign Items to Stores
        </button>
        <button
          onClick={() => setActiveTab('staff-stores')}
          className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'staff-stores' ? 'bg-white text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-5 h-5" />
          Assign Stores to Staff
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'store-items' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Store Selector */}
            <div className="col-span-1 bg-slate-50 rounded-lg p-4 border border-slate-200 h-[500px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Warehouse className="w-4 h-4" /> Select Store Room
              </h3>
              <div className="space-y-2">
                {storeRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedStoreId(room.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                      selectedStoreId === room.id 
                        ? 'bg-emerald-500 text-white font-medium shadow-sm' 
                        : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                    }`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Items Grid */}
            <div className="col-span-1 md:col-span-2 flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">
                  Allowed Categories for {storeRooms.find(s => s.id === selectedStoreId)?.name || 'Selected Store'}
                </h3>
                <button
                  onClick={handleSaveStoreItems}
                  disabled={storeSaving || !selectedStoreId}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {storeSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

              {storeFeedback && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {storeFeedback}
                </div>
              )}

              <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">No categories defined yet.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map(cat => {
                      const isSelected = activeStoreCategories.includes(cat.name);
                      return (
                        <label 
                          key={cat.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            checked={isSelected}
                            onChange={() => toggleStoreCategory(cat.name)}
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                            {cat.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff-stores' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Staff Selector */}
            <div className="col-span-1 bg-slate-50 rounded-lg p-4 border border-slate-200 h-[500px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Select Staff Member
              </h3>
              {loading ? (
                <div className="text-center text-slate-500 py-8">Loading staff...</div>
              ) : (
                <div className="space-y-2">
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                        selectedUserId === user.id 
                          ? 'bg-emerald-500 text-white font-medium shadow-sm' 
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                      }`}
                    >
                      <div className="font-semibold">{user.name}</div>
                      <div className={`text-xs mt-1 ${selectedUserId === user.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Role: <span className="capitalize">{user.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Stores Grid */}
            <div className="col-span-1 md:col-span-2 flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">
                  Assigned Stores for {users.find(u => u.id === selectedUserId)?.name || 'Selected Staff'}
                </h3>
                <button
                  onClick={handleSaveUserStores}
                  disabled={userSaving || !selectedUserId}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {userSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

              {userFeedback && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {userFeedback}
                </div>
              )}

              <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-y-auto">
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Staff will only be able to view and manage inventory for the store rooms checked below. If all are checked, they have "All" access.
                  </p>
                </div>

                {storeRooms.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">No store rooms defined yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {storeRooms.map(room => {
                      const isSelected = activeUserStores.includes(room.name);
                      return (
                        <label 
                          key={room.id} 
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            checked={isSelected}
                            onChange={() => toggleUserStore(room.name)}
                          />
                          <div>
                            <div className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                              {room.name}
                            </div>
                            {room.description && (
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{room.description}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
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
