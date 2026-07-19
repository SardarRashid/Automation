import React, { useState, useEffect } from 'react';
import { database } from '../../lib/firebase';
import { ref, get, update } from 'firebase/database';
import { Users, Save, ShieldAlert, CheckCircle2, UserCog, Store, Layers } from 'lucide-react';
import type { Storekeeper, CategoryTemplate, StoreRoom } from '../types';

interface StaffManagementViewProps {
  categories: CategoryTemplate[];
  storeRooms: StoreRoom[];
}

export function StaffManagementView({ categories, storeRooms }: StaffManagementViewProps) {
  const [users, setUsers] = useState<Storekeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Edit State
  const [editSections, setEditSections] = useState<string[]>([]);
  const [editStores, setEditStores] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(database, 'users'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsedUsers: Storekeeper[] = [];
        Object.keys(data).forEach(key => {
          const u = data[key];
          // Include users who have inventory access OR storekeeper role
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
              assignedStoreRooms: u.assignedStoreRooms || [],
              assignedSection: u.assignedSection || 'All',
              assignedStoreNum: u.assignedStoreNum || 'All',
              assignedLocation: u.assignedLocation || 'All'
            });
          }
        });
        setUsers(parsedUsers);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: Storekeeper) => {
    setEditingUserId(user.id);
    setEditSections(user.assignedSection && user.assignedSection !== "All" ? user.assignedSection.split(",").map(s => s.trim()) : []);
    setEditStores(user.assignedStoreNum && user.assignedStoreNum !== "All" ? user.assignedStoreNum.split(",").map(s => s.trim()) : []);
    setShowAdvanced(!!(user.assignedSection && user.assignedSection !== "All"));
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditSections([]);
  };

  const handleSave = async (userId: string) => {
    setSaving(true);
    
    try {
      // Update directly in Firebase
      await update(ref(database, `users/${userId}`), {
        assignedSection: editSections.length > 0 ? editSections.join(",") : "All"
      });
      
      setSuccessMsg("Permissions updated successfully!");
      setEditingUserId(null);
      await fetchUsers();
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error("Error updating user:", e);
      alert("Failed to update user permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <UserCog className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            Staff & Permissions Management
          </h2>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
            Manage your storekeepers and assign them to specific store rooms and product sections.
            Only the data they have access to will be shown in their daily sheets and mobile apps.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Storekeeper</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Categories</th>
                <th className="px-6 py-4">Assigned Stores</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'supervisor' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">
                        <ShieldAlert className="w-3 h-3" /> Supervisor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">
                        <Users className="w-3 h-3" /> Storekeeper
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUserId === user.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showAdvanced} 
                            onChange={(e) => {
                              setShowAdvanced(e.target.checked);
                              if (!e.target.checked) setEditSections([]);
                            }}
                            className="rounded border-slate-300 text-emerald-600"
                          />
                          Restrict By Category?
                        </label>
                        {showAdvanced && (
                          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white w-full">
                            {categories.map(c => {
                              const catName = (c as any).category || c.name;
                              const isChecked = editSections.includes(catName);
                              return (
                                <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditSections([...editSections, catName]);
                                      } else {
                                        setEditSections(editSections.filter(s => s !== catName));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  {catName}
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {!showAdvanced && <div className="text-xs text-slate-400 italic">User sees all categories in their assigned rooms.</div>}
                      </div>
                    ) : (
                      <div className="font-medium text-slate-700">
                        {(!user.assignedSection || user.assignedSection === "All") ? (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md">All (Room Based)</span>
                        ) : (
                          user.assignedSection
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <Store className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white w-full">
                          {storeRooms.map(r => {
                            const isChecked = editStores.includes(r.name);
                            return (
                              <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditStores([...editStores, r.name]);
                                    } else {
                                      setEditStores(editStores.filter(s => s !== r.name));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {r.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="font-medium text-slate-700">{user.assignedStoreNum || "All"}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUserId === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(user.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                          disabled={saving}
                        >
                          <Save className="w-3.5 h-3.5" />
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(user)}
                        className="px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                      >
                        Edit Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No storekeepers found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
