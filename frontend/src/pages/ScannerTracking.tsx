import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Package, CheckCircle, Clock, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { firebaseConfig, auth, database } from '../lib/firebase';
import { ref, get, set, update, remove } from 'firebase/database';

const DB_URL = "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app";

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = token ? `${url}${separator}auth=${token}` : url;
  return fetch(finalUrl, options);
};


interface Order {
  tripNumber: string;
  associateName: string;
  status: 'pending' | 'scanned';
  scanTime?: string;
  orderNumber: string;
  _branchName?: string;
}

export default function ScannerTracking() {
  const user = { email: 'admin@company.com' };
  const [loading, setLoading] = useState(false);

  const [uploadBranch, setUploadBranch] = useState('Dammam');
  const [stats, setStats] = useState({ pending: 0, scanned: 0, total: 0, avgTime: '0s' });
  const [branchStats, setBranchStats] = useState<{[key: string]: { scanned: number, total: number }}>({});
  const [orders, setOrders] = useState<Order[]>([]);

  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Add User State
  const [nuName, setNuName] = useState('');
  const [nuEmail, setNuEmail] = useState('');
  const [nuPassword, setNuPassword] = useState('');
  const [nuRole, setNuRole] = useState('scanner');
  const [nuBranch, setNuBranch] = useState('Dammam');
  const [nuStatus, setNuStatus] = useState('');

  // Manual Order State
  const [manualOrder, setManualOrder] = useState('');
  const [manualTrip, setManualTrip] = useState('');
  const [manualAssoc, setManualAssoc] = useState('');
  const [manualTerritory, setManualTerritory] = useState('');
  const [manualSeq, setManualSeq] = useState('');
  const [manualStatus, setManualStatus] = useState('');

  // Auth Effect
  useEffect(() => {
    //
    //
  }, []);

  // Silent Auto-Cleanup on Mount (only runs once per session)
  useEffect(() => {
    //
    const performSilentCleanup = async () => {
      try {
        const branches = ['Dammam', 'Riyadh', 'Jeddah'];
        for (const b of branches) {
          const res = await fetch(`${DB_URL}/scanner_trips/${b}.json`);
          const allDates = await res.json();
          if (allDates) {
            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);
            
            for (const dateStr of Object.keys(allDates)) {
              const d = new Date(dateStr);
              // Delete anything strictly older than today (midnight)
              if (d < todayDate) {
                await fetch(`${DB_URL}/scanner_trips/${b}/${dateStr}.json`, {
                  method: 'DELETE'
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Silent cleanup failed", err);
      }
    };
    performSilentCleanup();
  }, [user]);

  // Polling Effect
  useEffect(() => {
    //
    
    const fetchOrders = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        let orderList: any[] = [];
        
        const allBranches = ['Dammam', 'Riyadh', 'Jeddah'];
        for (const b of allBranches) {
          const snapshot = await get(ref(database, `scanner_trips/${b}/${today}/orders`));
          const data = snapshot.val();
          if (data) {
            const bList = Object.keys(data).map(k => ({ ...data[k], orderNumber: k, _branchName: b }));
            orderList = orderList.concat(bList);
          }
        }
        
        if (orderList.length > 0) {
          setOrders(orderList);
          
          let p = 0, s = 0, scanTimes: number[] = [];
          const bStats: {[key: string]: { scanned: number, total: number }} = {
            'Dammam': { scanned: 0, total: 0 },
            'Riyadh': { scanned: 0, total: 0 },
            'Jeddah': { scanned: 0, total: 0 }
          };

          orderList.forEach((o: any) => {
            const b = o._branchName || 'Dammam';
            if (!bStats[b]) bStats[b] = { scanned: 0, total: 0 };
            bStats[b].total++;

            if (o.status === 'scanned') {
              s++;
              bStats[b].scanned++;
              if (o.scanTime && o.uploadTime) {
                const diff = new Date(o.scanTime).getTime() - new Date(o.uploadTime).getTime();
                if (diff > 0) scanTimes.push(diff);
              }
            } else {
              p++;
            }
          });
          
          let avg = '0s';
          if (scanTimes.length > 0) {
            const avgMs = scanTimes.reduce((a, b) => a + b, 0) / scanTimes.length;
            avg = `${(avgMs / 1000).toFixed(1)}s`;
          }
          
          setStats({ pending: p, scanned: s, total: p + s, avgTime: avg });
          setBranchStats(bStats);
        } else {
          setOrders([]);
          setStats({ pending: 0, scanned: 0, total: 0, avgTime: '0s' });
          setBranchStats({});
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
    const intv = setInterval(fetchOrders, 3000);
    return () => clearInterval(intv);
  }, [user]);

  

  

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const processExcelData = (data: any[]) => {
      if (data.length === 0) return {};
      
      const firstRow = data[0];
      const keys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      const orderKey = keys.find(k => k === 'orderno');
      const assocKey = keys.find(k => k === 'deliveryassociate');
      const territoryKey = keys.find(k => k === 'territory');
      const sequenceKey = keys.find(k => k === 'ordersequence');
      const tripKey = keys.find(k => k === 'tripno');

      if (!orderKey) {
        throw new Error('MISSING_COLUMNS: Could not find an "Order No." column in the uploaded file. Found columns: ' + keys.join(', '));
      }

      const uploadTime = new Date().toISOString();
      let updates: any = {};

      data.forEach((row: any) => {
        const cleanRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          if (typeof key === 'string') {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            cleanRow[cleanKey] = value;
          }
        }

        // Clean the value of Excel formula strings like =("645720")
        const cleanVal = (val: any) => {
          if (val == null) return '';
          let str = String(val).trim();
          if (str.startsWith('=') && str.includes('"')) {
            str = str.replace(/^[=()"]+|[()"]+$/g, '');
          }
          return str;
        };

        const orderNum = orderKey ? cleanVal(cleanRow[orderKey]) : '';
        const assocName = assocKey ? cleanVal(cleanRow[assocKey]) : '';
        const territory = territoryKey ? cleanVal(cleanRow[territoryKey]) : '';
        const sequence = sequenceKey ? cleanVal(cleanRow[sequenceKey]) : '';
        const tripNum = tripKey ? cleanVal(cleanRow[tripKey]) : '';
        
        if (orderNum && orderNum !== '') {
          updates[orderNum] = {
            tripNumber: tripNum,
            associateName: assocName,
            territoryName: territory,
            sequence: sequence,
            status: 'pending',
            uploadTime: uploadTime
          };
        }
      });
      return updates;
    };

    try {
      let finalUpdates: any = {};
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
          if (!zipEntry.dir && filename.match(/\.(xlsx|xls|csv)$/i)) {
            const fileData = await zipEntry.async("binarystring");
            const wb = XLSX.read(fileData, { type: 'binary', raw: true });
            const wsname = wb.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname], {defval: '', raw: true});
            
            const updates = processExcelData(data as any[]);
            finalUpdates = { ...finalUpdates, ...updates };
          }
        }
      } else {
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.onerror = reject;
          reader.readAsBinaryString(file);
        });
        
        const wb = XLSX.read(fileData, { type: 'binary', raw: true });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname], {defval: '', raw: true});
        
        finalUpdates = processExcelData(data as any[]);
      }

      if (Object.keys(finalUpdates).length > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if there are any existing orders for the selected branch
        const existingBranchOrders = orders.filter(o => o._branchName === uploadBranch);
        
        let isReplace = false;
        if (existingBranchOrders.length > 0) {
          isReplace = window.confirm(
            `Do you want to REPLACE today's entire list for ${uploadBranch}? \n\nClick 'OK' to DELETE existing data and replace it.\nClick 'Cancel' to APPEND these orders.`
          );
        }

        if (!isReplace) {
          // Filter out any orders that already exist in the database for today
          const existingOrderNums = new Set(orders.map(o => String(o.orderNumber)));
          const filteredUpdates: any = {};
          for (const key of Object.keys(finalUpdates)) {
            if (!existingOrderNums.has(String(key))) {
              filteredUpdates[key] = finalUpdates[key];
            }
          }
          finalUpdates = filteredUpdates;
        }

        if (Object.keys(finalUpdates).length === 0) {
          alert("All orders in this file already exist in the system. No new orders were appended.");
          setLoading(false);
          e.target.value = '';
          return;
        }

        if (isReplace) {
          await set(ref(database, `scanner_trips/${uploadBranch}/${today}/orders`), finalUpdates);
        } else {
          await update(ref(database, `scanner_trips/${uploadBranch}/${today}/orders`), finalUpdates);
        }
        alert(`Successfully ${isReplace ? 'replaced' : 'appended'} ${Object.keys(finalUpdates).length} orders for ${uploadBranch}!`);
      } else {
        alert('EMPTY_FILE: No valid orders found in the file.');
      }
    } catch (err: any) {
      alert("UPLOAD_ERROR: " + err.message);
    }
    
    setLoading(false);
    e.target.value = '';
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to delete all trips older than 2 days?')) return;
    
    setLoading(true);
    try {
      const snapshot = await get(ref(database, `scanner_trips/${uploadBranch}`));
      const allDates = snapshot.val();
      if (allDates) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        for (const dateStr of Object.keys(allDates)) {
          const d = new Date(dateStr);
          if (d < twoDaysAgo) {
            await remove(ref(database, `scanner_trips/${uploadBranch}/${dateStr}`));
          }
        }
        alert("Cleanup complete!");
      }
    } catch(err) {
      alert("Cleanup failed.");
    }
    setLoading(false);
  };

  const handleMasterWipe = async () => {
    setLoading(true);
    try {
      await remove(ref(database, `scanner_trips/${uploadBranch}`));
      alert(`All data for ${uploadBranch} has been permanently deleted.`);
      setShowWipeConfirm(false);
    } catch(err) {
      alert("Wipe failed.");
    }
    setLoading(false);
  };

  const handleAddManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrder) return;
    setLoading(true);
    setManualStatus('Adding...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const updates = {
        [manualOrder]: {
          tripNumber: manualTrip,
          associateName: manualAssoc,
          territoryName: manualTerritory,
          sequence: manualSeq,
          status: 'pending',
          uploadTime: new Date().toISOString()
        }
      };
      await update(ref(database, `scanner_trips/${uploadBranch}/${today}/orders`), updates);
      setManualStatus(`Order ${manualOrder} added!`);
      setManualOrder(''); setManualTrip(''); setManualAssoc(''); setManualTerritory(''); setManualSeq('');
      setTimeout(() => setManualStatus(''), 3000);
    } catch (err: any) {
      setManualStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuName || !nuEmail || !nuPassword) return;
    setLoading(true);
    setNuStatus('Creating user...');
    try {
      const { createUserWithoutSwitchingSession } = await import('../lib/createUserIsolated');
      
      let createdUser;
      try {
        createdUser = await createUserWithoutSwitchingSession(nuEmail, nuPassword);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('User already exists in Firebase Auth, updating profile');
        } else {
          throw new Error(authError.message || 'Failed to create Firebase Auth user');
        }
      }

      // Add user to database
      const userKey = nuEmail.toLowerCase().replace(/[.#$\[\]]/g, '_');
      
      // Save uid_mapping if createdUser has uid
      if (createdUser && createdUser.uid) {
        await set(ref(database, `uid_mappings/${createdUser.uid}`), userKey);
      }
      const finalBranch = nuRole === 'admin' ? 'All Branches' : nuBranch;
      await update(ref(database, `users/${userKey}`), {
        name: nuName,
        email: nuEmail,
        app_user: true,
        app_role: nuRole,
        branch: finalBranch,
        blocked: false,
        role: 'scanner',
        disabled: false
      });
      setNuStatus('User created successfully!');
      setNuName(''); setNuEmail(''); setNuPassword('');
    } catch (err: any) {
      setNuStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  

  // Generate unique trips for manual entry
  const tripAssocMap: {[key: string]: string} = {};
  const visibleOrders = uploadBranch === 'All Branches' ? orders : orders.filter(o => o._branchName === uploadBranch);
  visibleOrders.forEach(o => {
    if (o.tripNumber && o.associateName) {
      tripAssocMap[o.tripNumber] = o.associateName;
    }
  });
  const uniqueTrips = Object.keys(tripAssocMap).sort();

  return (
    <div className="flex-1 bg-slate-50/50 flex flex-col h-full overflow-hidden relative">
      <main className="w-full h-full p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-slate-700">Action Branch:</label>
            <select value={uploadBranch} onChange={e => setUploadBranch(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg p-2 min-w-[200px] outline-none focus:border-emerald-500">
              <option>All Branches</option>
              <option>Dammam</option>
              <option>Riyadh</option>
              <option>Jeddah</option>
            </select>
          </div>
          
          {uploadBranch !== 'All Branches' && (
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors bg-emerald-600 hover:bg-emerald-700 text-white">
                <Upload className="w-5 h-5" />
                Upload Order File
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
              
              <button onClick={handleCleanup} disabled={loading} className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 border transition-colors bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200">
                <Trash2 className="w-5 h-5" />
                Auto-Cleanup
              </button>
              
              <button onClick={() => setShowWipeConfirm(true)} disabled={loading} className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="w-5 h-5" />
                Wipe All Data
              </button>
            </div>
          )}
          {uploadBranch === 'All Branches' && (
            <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              Select a specific branch to enable upload and delete actions.
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-slate-500 font-medium mb-1">Total Assigned Orders</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-amber-600 font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4"/> Remaining Scans</p>
            <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
            <p className="text-emerald-700 font-medium mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Scanned Today</p>
            <p className="text-3xl font-bold text-emerald-800">{stats.scanned}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-center">
            <p className="text-slate-400 font-medium mb-1">Avg Time to Scan</p>
            <p className="text-3xl font-bold text-white">{stats.avgTime}</p>
          </div>
        </div>

        {/* Branch Progress Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Package className="w-5 h-5 text-emerald-600"/> Branch Progress</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Dammam', 'Riyadh', 'Jeddah'].map(b => {
              const s = branchStats[b] || { scanned: 0, total: 0 };
              const percent = s.total > 0 ? Math.round((s.scanned / s.total) * 100) : 0;
              return (
                <div key={b} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-800 text-lg">{b}</h4>
                    <span className="text-sm font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Scanned: <span className="font-bold text-emerald-700">{s.scanned}</span></span>
                    <span>Total: <span className="font-bold text-slate-800">{s.total}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Order Entry */}
        {uploadBranch !== 'All Branches' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-lg">Add Single Order ({uploadBranch})</h3>
            </div>
            <form onSubmit={handleAddManualOrder} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Order No. *</label>
                <input type="text" value={manualOrder} onChange={e => setManualOrder(e.target.value)} required className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500" placeholder="e.g. 12345678" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Trip #</label>
                <select 
                  value={manualTrip} 
                  onChange={e => {
                    setManualTrip(e.target.value);
                    if (tripAssocMap[e.target.value]) {
                      setManualAssoc(tripAssocMap[e.target.value]);
                    }
                  }} 
                  className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                >
                  <option value="">Select or Type...</option>
                  {uniqueTrips.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Assoc</label>
                <input type="text" value={manualAssoc} onChange={e => setManualAssoc(e.target.value)} className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500" placeholder="Optional" />
              </div>
              <div className="w-full md:w-auto">
                <button type="submit" disabled={loading} className="w-full px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-50 h-[46px] bg-emerald-600 hover:bg-emerald-700 text-white">
                  Add Order
                </button>
              </div>
            </form>
            {manualStatus && <p className="mt-4 text-sm font-semibold text-emerald-600">{manualStatus}</p>}
          </div>
        )}

        {/* Order List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center justify-between">
              <span>Live Scanning Feed ({uploadBranch})</span>
              <span className="text-sm bg-slate-200 text-slate-700 px-3 py-1 rounded-full">{visibleOrders.length} Orders</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-slate-600 text-sm">
                  <th className="p-4 font-semibold border-b border-slate-200">Order #</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Branch</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Trip #</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Assigned To</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No orders uploaded for {uploadBranch === 'All Branches' ? 'today' : uploadBranch} yet.
                    </td>
                  </tr>
                ) : (
                  visibleOrders.map(o => (
                    <tr key={o.orderNumber + (o._branchName || '')} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{o.orderNumber}</td>
                      <td className="p-4 text-slate-600 font-bold">{o._branchName}</td>
                      <td className="p-4 text-slate-600">{o.tripNumber}</td>
                      <td className="p-4 text-slate-600">{o.associateName}</td>
                      <td className="p-4">
                        {o.status === 'scanned' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle className="w-3 h-3" /> Scanned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Scanner User Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-green-700" />
            <h3 className="font-bold text-slate-800 text-lg">Add Scanner User</h3>
          </div>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input type="text" value={nuName} onChange={e => setNuName(e.target.value)} required className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-green-600" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input type="email" value={nuEmail} onChange={e => setNuEmail(e.target.value)} required className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-green-600" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input type="password" value={nuPassword} onChange={e => setNuPassword(e.target.value)} required minLength={6} className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-green-600" placeholder="Minimum 6 characters" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select value={nuRole} onChange={e => setNuRole(e.target.value)} className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-green-600">
                  <option value="scanner">Scanner User</option>
                  <option value="admin">Admin User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Branch</label>
                <select value={nuBranch} onChange={e => setNuBranch(e.target.value)} className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-green-600">
                  <option value="Dammam">Dammam</option>
                  <option>Riyadh</option>
                  <option>Jeddah</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 pt-2 flex items-center justify-between">
              <span className={`text-sm ${nuStatus.includes('Error') ? 'text-rose-600' : 'text-emerald-600'} font-medium`}>{nuStatus}</span>
              <button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-50">
                Create Account
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Wipe Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2"><Trash2 /> DANGER: Wipe All Data</h3>
            <p className="text-slate-700 mb-6">Are you absolutely sure you want to wipe ALL data for the <strong>{uploadBranch}</strong> branch? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowWipeConfirm(false)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">Cancel</button>
              <button onClick={handleMasterWipe} disabled={loading} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">{loading ? 'Wiping...' : 'Yes, Wipe Data'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

