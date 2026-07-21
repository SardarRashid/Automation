import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, List, CheckCircle, LogOut, Package, ScanLine, Settings, AlertTriangle, WifiOff, RefreshCw, Search, ListOrdered } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FirebaseAPI } from '../lib/scanner-firebase';

const DB_URL = "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app";

interface Order {
  orderNumber: string;
  tripNumber: string;
  associateName: string;
  sequence?: string;
  status: 'pending' | 'scanned';
  scanTime?: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'remaining' | 'scanned' | 'lookup'>('remaining');
  const [lookupQuery, setLookupQuery] = useState('');
  const [viewMode, setViewMode] = useState<'associate' | 'trip'>('associate');
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{order: string, name: string, trip: string, sequence: string, status: 'success' | 'already_scanned'} | null>(null);
  const [hardwareInputValue, setHardwareInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [enableCamera, setEnableCamera] = useState(() => localStorage.getItem('scanner_app_camera') === 'true');
  const [enableSound, setEnableSound] = useState(() => localStorage.getItem('scanner_app_sound') !== 'false');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<{barcode: string, time: string, status: string}[]>(() => {
    const saved = localStorage.getItem('scanner_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Hardware Scanner buffer
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0 || isSyncing || !profile?.branch) return;
    setIsSyncing(true);
    
    const today = new Date().toISOString().split('T')[0];
    const newQueue = [...syncQueue];
    
    for (let i = newQueue.length - 1; i >= 0; i--) {
      const item = newQueue[i];
      try {
        const updates = { status: item.status, scanTime: item.time };
        await fetch(`${DB_URL}/scanner_trips/${profile.branch}/${today}/orders/${item.barcode}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        newQueue.splice(i, 1);
      } catch (e) {
        console.error("Failed to sync", item.barcode);
      }
    }
    
    setSyncQueue([...newQueue]);
    localStorage.setItem('scanner_sync_queue', JSON.stringify(newQueue));
    setIsSyncing(false);
  }, [isOnline, syncQueue, isSyncing, profile]);

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline, syncQueue.length, syncOfflineQueue]);

  useEffect(() => {
    const savedUser = localStorage.getItem('scanner_app_user');
    const savedProfile = localStorage.getItem('scanner_app_profile');
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    if (!profile || !profile.branch) return;
    
    const fetchOrders = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `orders_${profile.branch}_${today}`;
        
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setOrders(prev => prev.length === 0 ? JSON.parse(cached) : prev);
        }

        if (!navigator.onLine) return;

        const res = await fetch(`${DB_URL}/scanner_trips/${profile.branch}/${today}/orders.json`);
        const data = await res.json();
        
        if (data) {
          let orderList = Object.keys(data).map(k => ({ ...data[k], orderNumber: k }));
          
          setSyncQueue(queue => {
            if (queue.length > 0) {
              const queueBarcodes = queue.map(q => q.barcode);
              orderList = orderList.map(o => 
                queueBarcodes.includes(String(o.orderNumber)) ? { ...o, status: 'scanned' } : o
              );
            }
            return queue;
          });

          setOrders(orderList);
          localStorage.setItem(cacheKey, JSON.stringify(orderList));
        } else {
          setOrders([]);
          localStorage.setItem(cacheKey, JSON.stringify([]));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
    const intv = setInterval(fetchOrders, 10000);
    return () => clearInterval(intv);
  }, [profile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const authData = await FirebaseAPI.signIn(email, password);
      const profData = await FirebaseAPI.getUserProfile(email, authData.idToken);
      
      if (profData?.app_role !== 'scanner' && profData?.role !== 'scanner' && !profData?.allowedApps?.scanner) {
          throw new Error("Access Denied: You are not registered as a Scanner User.");
        }
      if (profData?.blocked) {
        throw new Error("Account is blocked.");
      }

      setUser(authData);
      setProfile(profData);
      
      if (rememberMe) {
        localStorage.setItem('scanner_app_user', JSON.stringify(authData));
        localStorage.setItem('scanner_app_profile', JSON.stringify(profData));
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('scanner_app_user');
    localStorage.removeItem('scanner_app_profile');
  };

  const playBeep = (type: 'success' | 'warning' | 'error') => {
    if (!enableSound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'warning') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1); // Drop to E4
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio not supported or permitted");
    }
  };

  const handleScanCode = async (barcode: string) => {
    if (!profile?.branch) return;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if order exists in current orders
    const targetOrder = orders.find(o => String(o.orderNumber) === barcode);
    if (!targetOrder) {
      playBeep('error');
      alert(`Order ${barcode} not found in today's trips!`);
      return;
    }
    
    if (targetOrder.status === 'scanned') {
      playBeep('warning');
      setLastScanned({
        order: barcode,
        name: targetOrder.associateName || 'No Associate',
        trip: targetOrder.tripNumber || 'No Trip',
        sequence: targetOrder.sequence || '',
        status: 'already_scanned'
      });
      return;
    }

    try {
      const scanTime = new Date().toISOString();
      const updates = { status: 'scanned', scanTime };
      
      // Optimistic update
      setOrders(prev => prev.map(o => String(o.orderNumber) === barcode ? { ...o, status: 'scanned' } : o));

      if (navigator.onLine) {
        fetch(`${DB_URL}/scanner_trips/${profile.branch}/${today}/orders/${barcode}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }).catch(() => {
          // Push to queue if fetch fails
          const newQueue = [...syncQueue, { barcode, time: scanTime, status: 'scanned' }];
          setSyncQueue(newQueue);
          localStorage.setItem('scanner_sync_queue', JSON.stringify(newQueue));
        });
      } else {
        const newQueue = [...syncQueue, { barcode, time: scanTime, status: 'scanned' }];
        setSyncQueue(newQueue);
        localStorage.setItem('scanner_sync_queue', JSON.stringify(newQueue));
      }
      
      playBeep('success');
      
      setLastScanned({ 
        order: barcode, 
        name: targetOrder.associateName || 'No Associate', 
        trip: targetOrder.tripNumber || 'No Trip',
        sequence: targetOrder.sequence || '',
        status: 'success'
      });
      // Removed setTimeout so success message stays visible
      
    } catch (err) {
      alert('Failed to save scan.');
    }
  };

  // Global Keyboard Listener for Hardware Scanners
  useEffect(() => {
    if (!user) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // If they are explicitly typing in the search/input box, ignore
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.keyCode === 13) {
        if (barcodeBuffer.current.length > 0) {
          handleScanCode(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
        e.preventDefault();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.keyCode === 13) return; // Handled by keydown

      const now = Date.now();
      // Reset buffer if more than 300ms since last keypress (human vs scanner typing speed)
      if (now - lastKeyTime.current > 300) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key && e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [user, orders, profile, viewMode]);

  // Camera Scanner Setup
  useEffect(() => {
    if (scanning && document.getElementById('reader')) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 }
          // Removed strict videoConstraints to allow the scanner UI to fallback to native dropdowns
        }, 
        false
      );
      scanner.render((text) => {
        handleScanCode(text);
        scanner.clear();
        setScanning(false);
      }, () => {});
      return () => { scanner.clear().catch(()=>{}); };
    }
  }, [scanning, orders, profile, viewMode]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100 z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full">
              <ScanLine className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Scanner Login</h2>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 outline-none focus:border-emerald-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 outline-none focus:border-emerald-500" />
            <label className="flex items-center gap-2 text-slate-600 text-sm py-2">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              Remember Me
            </label>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50">
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

    const pendingOrders = orders.filter(o => o.status !== 'scanned');
    const scannedOrders = orders.filter(o => o.status === 'scanned');

    const uniqueTrips = Array.from(new Set(orders.map(o => o.tripNumber).filter(Boolean))).sort();
    const uniqueAssociates = Array.from(new Set(orders.map(o => o.associateName).filter(Boolean))).sort();

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <nav className="bg-emerald-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6" />
          <div>
            <h1 className="font-bold leading-tight">Scanner App</h1>
            <p className="text-xs text-emerald-200">{profile?.branch} Branch</p>
          </div>
        </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-emerald-700/50 rounded-full hover:bg-emerald-700 active:scale-90"><Settings className="w-5 h-5" /></button>
            <button onClick={handleLogout} className="p-2 bg-emerald-700/50 rounded-full hover:bg-emerald-700 active:scale-90"><LogOut className="w-5 h-5" /></button>
          </div>
        </nav>
  
        {!isOnline && (
          <div className="bg-red-500 text-white p-2 text-center text-xs font-bold flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" /> OFFLINE MODE - Scans will sync when connected
          </div>
        )}
        
        {isSyncing && (
          <div className="bg-amber-500 text-white p-2 text-center text-xs font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> SYNCING OFFLINE SCANS...
          </div>
        )}
  
        {showSettings && (
          <div className="bg-white p-4 shadow-md border-b border-slate-200 space-y-4">
            <label className="flex items-center gap-3 font-semibold text-slate-700">
              <input type="checkbox" checked={enableCamera} onChange={e => {
                setEnableCamera(e.target.checked);
                localStorage.setItem('scanner_app_camera', String(e.target.checked));
              }} className="w-5 h-5 accent-emerald-600" />
              Enable Camera Scanner Option
            </label>

            <label className="flex items-center gap-3 font-semibold text-slate-700">
              <input type="checkbox" checked={enableSound} onChange={e => {
                setEnableSound(e.target.checked);
                localStorage.setItem('scanner_app_sound', String(e.target.checked));
              }} className="w-5 h-5 accent-emerald-600" />
              Enable Scan Sounds
            </label>
            
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Mode</p>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('associate')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'associate' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                >
                  By Associate
                </button>
                <button 
                  onClick={() => setViewMode('trip')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'trip' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                >
                  By Trip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Last Scanned Status */}
        {lastScanned && (
          <div className={`flex flex-col items-center justify-center p-6 text-white shadow-inner mb-2 ${lastScanned.status === 'already_scanned' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
            <div className="flex items-center gap-2 mb-1">
              {lastScanned.status === 'already_scanned' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              <h2 className="text-3xl font-black">{lastScanned.order}</h2>
            </div>
            <p className="text-xl font-bold opacity-90">{lastScanned.status === 'already_scanned' ? 'ALREADY SCANNED' : 'SUCCESSFULLY SCANNED'}</p>
            <div className="text-center mt-3 leading-tight">
              <p className="text-2xl font-black">{lastScanned.name}</p>
              <p className="text-2xl font-black">{lastScanned.trip}</p>
              {lastScanned.sequence && <p className="text-xl font-bold mt-1 text-white/90">Seq: {lastScanned.sequence}</p>}
            </div>
          </div>
        )}

        {/* Main Scanner Action Area */}
        <div className="p-4 bg-white shadow-sm border-b border-slate-200 text-center relative">
        <div className="flex justify-around mb-2">
          <div className="text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Remaining</p>
            <p className="text-2xl font-black text-amber-500">{pendingOrders.length}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Scanned</p>
            <p className="text-2xl font-black text-emerald-600">{scannedOrders.length}</p>
          </div>
        </div>
        
        {!scanning ? (
            <div className="space-y-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (hardwareInputValue.trim()) {
                    handleScanCode(hardwareInputValue.trim());
                    setHardwareInputValue('');
                  }
                }}
                className="w-full max-w-sm mx-auto flex items-center gap-3"
              >
                <input 
                  type="text" 
                  placeholder="Scan or type order number, then Enter" 
                  className="flex-1 bg-white text-slate-800 font-semibold py-3 px-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                  value={hardwareInputValue}
                  onChange={(e) => setHardwareInputValue(e.target.value)}
                />
                <button type="submit" className="rounded-xl bg-emerald-600 text-white px-4 py-3 text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors">
                  Submit
                </button>
              </form>

              {enableCamera && (
                <>
                  <div className="text-slate-400 text-sm font-bold text-center">- OR -</div>
    
                  <button onClick={() => setScanning(true)} className="w-full max-w-sm mx-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95">
                    <Camera className="w-6 h-6" /> Open Camera Scanner
                  </button>
                </>
              )}
            </div>
          ) : (
          <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-black shadow-inner">
            <div id="reader" className="w-full"></div>
            <button onClick={() => setScanning(false)} className="w-full bg-slate-800 text-white py-3 text-sm font-bold">Close Camera</button>
          </div>
          )}
        </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'lookup' ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" /> Sequence Lookup
              </h2>
              <div className="flex gap-2 mb-4">
                <select 
                  className="w-1/2 bg-slate-50 text-slate-800 font-semibold py-3 px-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition-all"
                  value={lookupQuery.startsWith('trip:') ? lookupQuery.replace('trip:', '') : ''}
                  onChange={(e) => setLookupQuery(e.target.value ? `trip:${e.target.value}` : '')}
                >
                  <option value="">Select Trip...</option>
                  {uniqueTrips.map(t => <option key={t} value={t as string}>{t}</option>)}
                </select>
                <select 
                  className="w-1/2 bg-slate-50 text-slate-800 font-semibold py-3 px-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition-all"
                  value={lookupQuery.startsWith('assoc:') ? lookupQuery.replace('assoc:', '') : ''}
                  onChange={(e) => setLookupQuery(e.target.value ? `assoc:${e.target.value}` : '')}
                >
                  <option value="">Select Associate...</option>
                  {uniqueAssociates.map(a => <option key={a} value={a as string}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders
                  .filter(o => {
                    if (!lookupQuery) return false;
                    if (lookupQuery.startsWith('trip:')) {
                      return o.tripNumber === lookupQuery.replace('trip:', '');
                    }
                    if (lookupQuery.startsWith('assoc:')) {
                      return o.associateName === lookupQuery.replace('assoc:', '');
                    }
                    return false;
                  })
                  .sort((a, b) => {
                    const seqA = parseInt(a.sequence || '99999');
                    const seqB = parseInt(b.sequence || '99999');
                    return seqA - seqB;
                  })
                  .map(o => (
                    <div key={o.orderNumber} className={`p-3 rounded-xl border flex items-center justify-between ${o.status === 'scanned' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <p className="font-bold text-slate-800">{o.orderNumber}</p>
                        <p className="text-xs text-slate-500">{o.tripNumber} - {o.associateName}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-slate-800 text-white text-xs font-black px-2 py-1 rounded-md">
                          Seq: {o.sequence || 'N/A'}
                        </span>
                        <div className="mt-1">
                          {o.status === 'scanned' ? 
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex justify-end items-center gap-1"><CheckCircle className="w-3 h-3"/> SCANNED</span> : 
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex justify-end items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div> PENDING</span>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                {lookupQuery && orders.filter(o => {
                    if (lookupQuery.startsWith('trip:')) return o.tripNumber === lookupQuery.replace('trip:', '');
                    if (lookupQuery.startsWith('assoc:')) return o.associateName === lookupQuery.replace('assoc:', '');
                    return false;
                  }).length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-sm font-semibold">No orders found for this selection.</p>
                )}
                {!lookupQuery && (
                  <p className="text-center text-slate-400 py-4 text-sm">Choose a Trip Number or Associate from the dropdowns above to see their sequences.</p>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'remaining' ? (
          <div className="space-y-3">
            {pendingOrders.map(o => (
              <div key={o.orderNumber} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    {o.orderNumber}
                    {o.sequence && <span className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-md">Seq: {o.sequence}</span>}
                  </h3>
                  <p className="text-slate-500 text-sm">{viewMode === 'associate' ? (o.associateName || 'No Associate') : (o.tripNumber || 'No Trip')}</p>
                </div>
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            ))}
            {pendingOrders.length === 0 && <p className="text-center text-slate-400 mt-10">No pending orders!</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {scannedOrders.map(o => (
              <div key={o.orderNumber} className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center opacity-80">
                <div>
                  <h3 className="font-bold text-emerald-800 text-lg line-through decoration-emerald-300 flex items-center gap-2">
                    {o.orderNumber}
                    {o.sequence && <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md no-underline">Seq: {o.sequence}</span>}
                  </h3>
                  <p className="text-emerald-600 text-sm">{viewMode === 'associate' ? (o.associateName || 'No Associate') : (o.tripNumber || 'No Trip')}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            ))}
            {scannedOrders.length === 0 && <p className="text-center text-slate-400 mt-10">Nothing scanned yet.</p>}
          </div>
        )}
      </div>

            {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex h-16 pb-safe">
        <button onClick={() => setActiveTab('remaining')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'remaining' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <List className="w-6 h-6" />
          <span className="text-[10px] font-bold">Remaining</span>
        </button>
        <button onClick={() => setActiveTab('scanned')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'scanned' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <CheckCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold">Scanned</span>
        </button>
        <button onClick={() => setActiveTab('lookup')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'lookup' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <ListOrdered className="w-6 h-6" />
          <span className="text-[10px] font-bold">Sequence</span>
        </button>
      </div>
      </div>
  );
}



