import os

# Customers.tsx
customers_code = """import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Check, X, FileDown, UploadCloud } from 'lucide-react';
import { useSalesmanAdmin } from '../SalesmanAdminContext';
import { fbService } from '../services/firebaseService';
import { Customer } from '../../../types/SalesmanAdmin';
import { exportToCSV } from '../../../utils/exportExcel';

export default function Customers() {
  const { customers } = useSalesmanAdmin();

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustName, setNewCustName] = useState('');
  const [newCustShop, setNewCustShop] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustBalance, setNewCustBalance] = useState('0');

  const handleAddCustomer = async () => {
    if (!newCustName || !newCustShop) return alert("Fill required fields");
    const c: Customer = {
      id: '',
      name: newCustName,
      shopName: newCustShop,
      phone: newCustPhone,
      address: newCustAddress,
      remainingBalance: Number(newCustBalance)
    };
    await fbService.addCustomer(c);
    setNewCustName('');
    setNewCustShop('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustBalance('0');
  };

  const handleEditCustomer = async () => {
    if (editingCustomer) {
      await fbService.updateCustomer(editingCustomer);
      setEditingCustomer(null);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Are you sure?")) {
      await fbService.deleteCustomer(id);
    }
  };

  const handleExportCustomers = () => {
    const headers = ['id', 'name', 'phone', 'address', 'totalDebt', 'remainingBalance', 'creditLimit'];
    exportToCSV('sales_customers', customers, headers);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Customer Registration Form */}
      <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm self-start">
        <h3 className="font-bold text-slate-800 text-sm mb-1">Onboard Client</h3>
        <p className="text-xs text-slate-400 mb-4">Register new shops for field sales.</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Owner/Contact Name</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. Ahmed Ali"
              value={newCustName} onChange={e => setNewCustName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Shop/Business Name</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. Al-Madina Supermarket"
              value={newCustShop} onChange={e => setNewCustShop(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Phone</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="05X XXX XXXX"
                value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Opening Balance</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="0.00"
                value={newCustBalance} onChange={e => setNewCustBalance(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Address</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Street, District, City"
              value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddCustomer}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors mt-2"
          >
            <Plus className="w-5 h-5" />
            <span>Register Client</span>
          </button>
        </div>
      </div>

      {/* Active Customers Table */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800">Client Directory</h3>
            <p className="text-xs text-slate-400">Manage shops and view outstanding balances.</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={handleExportCustomers} className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 hover:bg-slate-50">
              <FileDown className="w-3 h-3" />
              <span>Export</span>
            </button>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{customers.length} Clients</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Shop Details</th>
                <th className="px-5 py-4">Contact Person</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Current Bal.</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    {editingCustomer?.id === c.id ? (
                      <input className="border rounded p-1 w-full text-sm" value={editingCustomer.shopName} onChange={e => setEditingCustomer({...editingCustomer, shopName: e.target.value})} />
                    ) : (
                      <div className="font-bold text-slate-800">{c.shopName}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingCustomer?.id === c.id ? (
                      <div className="space-y-1">
                        <input className="border rounded p-1 w-full text-sm" value={editingCustomer.name} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} />
                        <input className="border rounded p-1 w-full text-sm" value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-slate-700">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.phone}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingCustomer?.id === c.id ? (
                      <input className="border rounded p-1 w-full text-sm" value={editingCustomer.address} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} />
                    ) : (
                      <div className="text-slate-600 text-xs truncate max-w-[150px]" title={c.address}>{c.address}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingCustomer?.id === c.id ? (
                      <input className="border rounded p-1 w-20 text-sm" type="number" value={editingCustomer.remainingBalance} onChange={e => setEditingCustomer({...editingCustomer, remainingBalance: Number(e.target.value)})} />
                    ) : (
                      <div className={`font-bold ${Number(c.remainingBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(c.remainingBalance).toFixed(2)} SAR
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {editingCustomer?.id === c.id ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={handleEditCustomer} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingCustomer(null)} className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setEditingCustomer(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No clients onboarded.
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

with open(r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\components\Customers.tsx", "w", encoding="utf-8") as f:
    f.write(customers_code)

print("Customers.tsx built")
