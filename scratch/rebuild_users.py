import os

users_code = """import React, { useState } from 'react';
import { Users as UsersIcon, Plus, Edit2, Trash2, ShieldAlert, Check, X } from 'lucide-react';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { fbService } from '../services/firebaseService';
import { User } from '../../../types/SalesmanAdmin';

export default function Users() {
  const { users } = useSalesmanAdmin();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserTerritory, setNewUserTerritory] = useState('North Territory');
  const [newUserAllowPriceOverride, setNewUserAllowPriceOverride] = useState(false);

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) return alert("Fill required fields");
    const u: User = {
      id: '',
      name: newUserName,
      email: newUserEmail,
      role: 'SALESPERSON',
      territory: newUserTerritory,
      allowPriceOverride: newUserAllowPriceOverride
    };
    try {
      await fbService.addUser(u, newUserPassword);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      alert("User created successfully!");
    } catch(err: any) {
      alert("Failed to create user: " + err.message);
    }
  };

  const handleEditUser = async () => {
    if (editingUser) {
      await fbService.updateUser(editingUser);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure?")) {
      await fbService.deleteUser(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* User Enrollment Form */}
      <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
        <h3 className="font-bold text-slate-800 text-sm mb-1">Enroll Route Salesman</h3>
        <p className="text-xs text-slate-400 mb-4">Register a field salesperson and map their target route zone.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Full Name</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. Abdullah"
              value={newUserName} onChange={e => setNewUserName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Email Address (Login ID)</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="sales1@company.com"
              value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Password (Onboarding)</label>
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Enter secure password"
              value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Assigned Territory</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={newUserTerritory} onChange={e => setNewUserTerritory(e.target.value)}
            >
              <option>North Territory</option>
              <option>South Territory</option>
              <option>East Territory</option>
              <option>West Territory</option>
              <option>Central District</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox" 
              id="priceOverride"
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              checked={newUserAllowPriceOverride} 
              onChange={e => setNewUserAllowPriceOverride(e.target.checked)}
            />
            <label htmlFor="priceOverride" className="text-sm text-slate-600 font-medium">Allow manual price override on POS</label>
          </div>
          <button 
            onClick={handleAddUser}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors mt-2"
          >
            <Plus className="w-5 h-5" />
            <span>Enroll Salesman</span>
          </button>
        </div>
      </div>

      {/* Active Users Table */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800">Active Field Force</h3>
            <p className="text-xs text-slate-400">Manage enrolled salespersons and their permissions.</p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <UsersIcon className="w-3 h-3" />
            <span>{users.filter(u => u.role === 'SALESPERSON').length} Active</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Name / ID</th>
                <th className="px-5 py-4">Contact Info</th>
                <th className="px-5 py-4">Territory Zone</th>
                <th className="px-5 py-4">Permissions</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter(u => u.role === 'SALESPERSON').map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    {editingUser?.id === u.id ? (
                      <input 
                        className="border rounded p-1 w-full text-sm" 
                        value={editingUser.name} 
                        onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                      />
                    ) : (
                      <div>
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">{u.id.substring(0,8)}...</div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingUser?.id === u.id ? (
                      <input 
                        className="border rounded p-1 w-full text-sm" 
                        value={editingUser.email} 
                        onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                      />
                    ) : (
                      <div className="text-slate-600">{u.email}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingUser?.id === u.id ? (
                      <select 
                        className="border rounded p-1 w-full text-sm" 
                        value={editingUser.territory || ''} 
                        onChange={e => setEditingUser({...editingUser, territory: e.target.value})}
                      >
                        <option>North Territory</option>
                        <option>South Territory</option>
                        <option>East Territory</option>
                        <option>West Territory</option>
                        <option>Central District</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {u.territory || 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingUser?.id === u.id ? (
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={editingUser.allowPriceOverride} 
                          onChange={e => setEditingUser({...editingUser, allowPriceOverride: e.target.checked})}
                        />
                        <span className="text-xs">Price Override</span>
                      </label>
                    ) : (
                      u.allowPriceOverride ? (
                        <div className="flex items-center text-amber-600 space-x-1" title="Can override prices on POS">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-xs font-bold">Price Override</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Standard</span>
                      )
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {editingUser?.id === u.id ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={handleEditUser} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingUser(null)} className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setEditingUser(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.filter(u => u.role === 'SALESPERSON').length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No field salespersons enrolled yet.
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
"""

with open(r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components\Users.tsx", "w", encoding="utf-8") as f:
    f.write(users_code)

print("Users.tsx rebuilt successfully!")
