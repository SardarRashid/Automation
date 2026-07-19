import { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Trash2, Printer, Download, Loader2, CheckCircle, AlertCircle, FilePlus, X, History, FileText } from 'lucide-react';
import { getBackendUrl } from '../lib/config';
import { database, auth } from '../lib/firebase';
import { ref, push, get, remove } from 'firebase/database';
import * as XLSX from 'xlsx';

interface HistoryItem {
  id: string;
  date: string;
  driverName: string;
  formType: string;
  truckNumber: string;
  amount: number;
}

interface RowItem {
  Date: string;
  Amount: string;
  [key: string]: string; // dynamic fields
}

export default function RequestForms() {
  const [formType, setFormType] = useState('Fuel');
  
  // Custom Form states
  const [customSubject, setCustomSubject] = useState('');
  const [customIntro, setCustomIntro] = useState('');
  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [customColumns, setCustomColumns] = useState<string[]>(['Date', 'Amount']);
  const [newColumnName, setNewColumnName] = useState('');
  
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [headerData, setHeaderData] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<RowItem[]>([
    { Date: new Date().toISOString().split('T')[0], Amount: '' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Default dest settings
  const defaultDestStr = JSON.stringify({ 
    branch: 'Dammam', 
    cost_center: '1DMECD001', 
    sloc: 'DHDD', 
    plant: 'DM01', 
    warehouse: 'Dammam Club', 
    sloc_transfer: 'DMHD', 
    signature: 'Rashid Saddique', 
    manager_name: 'Emad Shahwan.', 
    manager_title: 'Dammam Sales Manager.' 
  });
  const profile = JSON.parse(localStorage.getItem('inventory_dest_profile') || defaultDestStr);

  const formConfigs: Record<string, { headers: string[]; rows: string[] }> = {
    Fuel: { headers: ['Driver Name', 'Van/Truck Number'], rows: ['Date', 'Kilo Meters', 'Amount'] },
    Expenses: { headers: [], rows: ['Date', 'Expense Type', 'Remarks', 'Amount'] },
    Loan: { headers: ['Employee Name'], rows: ['Date', 'Reason', 'Amount'] },
    'Food Allowance': { headers: ['Driver Name', 'Destination'], rows: ['Date', 'Amount'] },
    Transportation: { headers: ['Employee Name', 'Route/Details'], rows: ['Date', 'Amount'] },
    'Airport Parking': { headers: ['Driver Name', 'Customer Name'], rows: ['Date', 'Amount'] },
    'Tires Fix': { headers: ['Driver Name', 'Van Number'], rows: ['Date', 'Amount'] },
    'Club Supplies': { headers: [], rows: ['Date', 'Amount'] },
    'License Upgradation': { headers: ['Employee/Van Name'], rows: ['Date', 'Remarks', 'Amount'] },
    'Custom / Manual': { headers: [], rows: [] } // Handled dynamically
  };

  const isCustom = formType === 'Custom / Manual';
  const currentConfig = isCustom 
    ? { headers: customHeaders, rows: customColumns } 
    : (formConfigs[formType] || { headers: [], rows: ['Date', 'Amount'] });

  useEffect(() => {
    // Reset form fields on type change
    const newHeaders: Record<string, string> = {};
    currentConfig.headers.forEach(h => {
      newHeaders[h] = '';
    });
    setHeaderData(newHeaders);
    
    // Init rows based on config
    const initialRow: any = {};
    currentConfig.rows.forEach(col => {
      if (col === 'Date') initialRow['Date'] = new Date().toISOString().split('T')[0];
      else initialRow[col] = '';
    });
    setRows([initialRow]);
    
    let defDesc = '';
    if (formType === 'Custom / Manual') defDesc = `Please allow the amounts below for ${customSubject || 'Custom'} request.`;
    else if (formType === 'Fuel') defDesc = 'Please allow the amount below as Fuel expenses to Montana Drivers.';
    else if (formType === 'Expenses') defDesc = 'Please allow the amounts below as Expenses.';
    else if (formType === 'Loan') defDesc = `Please allow the amounts below as Loan to ________________.`;
    else if (formType === 'Food Allowance') defDesc = `Please allow below amounts as food allowance to Delivery Associate during trip to ________________.`;
    else if (formType === 'Transportation') defDesc = `Please Allow below amounts as Transportation to ________________.`;
    else if (formType === 'Airport Parking') defDesc = `Please Allow Bellow Amounts as Airport Parking Tickets for offloading to Customer: ________________.`;
    else if (formType === 'Tires Fix') defDesc = `Kindly allow below amounts for the tire Punctures/Fixes for Driver ________________.`;
    else if (formType === 'Club Supplies') defDesc = 'Please allow the amounts below to purchase Club Supplies needed for the team/branch.';
    else if (formType === 'License Upgradation') defDesc = `Please allow the amounts below for License Upgradation for ________________.`;
    
    setDescription(defDesc);

    setError(null);
    setSuccess(false);
  }, [formType, customHeaders, customColumns]);

  const handleHeaderChange = (field: string, value: string) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
    if (field === 'Destination' || field === 'Driver Name') {
      const fType = formType === 'Custom' ? (customSubject || 'Custom') : formType;
      
      // Attempt to preserve the other field if it already exists in the header data
      const dest = field === 'Destination' ? value : (headerData['Destination'] || '');
      const driver = field === 'Driver Name' ? value : (headerData['Driver Name'] || '');
      
      let newDesc = `Please allow the amounts below for ${fType} request`;
      if (dest) newDesc += ` to ${dest}`;
      if (driver) newDesc += ` for driver ${driver}`;
      newDesc += `.`;
      
      setDescription(newDesc);
    }
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const addRow = () => {
    const newRow: any = {};
    currentConfig.rows.forEach(col => {
      if (col === 'Date') newRow['Date'] = new Date().toISOString().split('T')[0];
      else newRow[col] = '';
    });
    setRows([...rows, newRow]);
  };

  const deleteRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    // Total is calculated using the last column (Amount)
    const lastCol = currentConfig.rows[currentConfig.rows.length - 1] || 'Amount';
    return rows.reduce((sum, row) => {
      const val = parseFloat(row[lastCol]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  // Add Custom Header dynamically
  const addCustomHeader = () => {
    const h = newHeaderName.trim();
    if (h && !customHeaders.includes(h)) {
      setCustomHeaders([...customHeaders, h]);
      setNewHeaderName('');
    }
  };

  // Remove Custom Header
  const removeCustomHeader = (name: string) => {
    setCustomHeaders(customHeaders.filter(h => h !== name));
  };

  // Add Custom Column dynamically
  const addCustomColumn = () => {
    const c = newColumnName.trim();
    // Capitalize first letter of column
    const capCol = c.charAt(0).toUpperCase() + c.slice(1);
    if (capCol && !customColumns.includes(capCol)) {
      setCustomColumns([...customColumns, capCol]);
      setNewColumnName('');
    }
  };

  // Remove Custom Column
  const removeCustomColumn = (name: string) => {
    if (name === 'Date' || name === 'Amount') return; // protect basic cols
    setCustomColumns(customColumns.filter(c => c !== name));
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-section');
    if (!printContent) return;

    // Clone the node and preserve input values
    const clone = printContent.cloneNode(true) as HTMLElement;
    const originalInputs = printContent.querySelectorAll('input, textarea, select');
    const clonedInputs = clone.querySelectorAll('input, textarea, select');
    originalInputs.forEach((input: any, index) => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        (clonedInputs[index] as any).checked = input.checked;
        if (input.checked) clonedInputs[index].setAttribute('checked', 'true');
      } else {
        (clonedInputs[index] as any).value = input.value;
        clonedInputs[index].setAttribute('value', input.value);
        if (input.tagName === 'TEXTAREA') {
          clonedInputs[index].innerHTML = input.value;
        }
      }
    });

    const iframe = document.createElement('iframe');
    // Give it real dimensions but hide it off-screen to prevent Chrome rendering bugs with 0x0 iframes
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      // Collect stylesheets
      const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');
      
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Request Form</title>
            ${styleTags}
            <style>
              @page { size: A4 portrait; margin: 0.5cm; }
              body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              #print-section { width: 100% !important; max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
              /* Force Tailwind styles to apply correctly */
              * { overflow: visible !important; }
            </style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      // Wait for rendering
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 800);
    }
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [];
      
      const formTypeTitle = isCustom ? (customSubject || 'Custom') : formType;
      
      wsData.push([`Request Form - ${formTypeTitle}`]);
      wsData.push([]);
      
      // Intro Text
      const introText = description || `Please allow the amounts below for ${formTypeTitle} request.`;
      wsData.push([introText]);
      wsData.push([]);
      
      // Header Data
      Object.entries(headerData).forEach(([k, v]) => {
        wsData.push([k, v]);
      });
      wsData.push([]);
      
      // Columns
      const cols = isCustom ? customColumns : formConfigs[formType]?.headers || [];
      wsData.push(cols);
      
      // Rows
      rows.forEach(r => {
        wsData.push(cols.map(c => r[c] || ''));
      });
      
      // Summary / Signature lines
      wsData.push([]);
      wsData.push(['Prepared By:', '', 'Approved By:']);
      wsData.push([profile?.name || '', '', profile?.manager_name || '']);
      wsData.push([profile?.title || '', '', profile?.manager_title || '']);
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Adjust column widths
      ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(wb, ws, "Request Form");
      
      const filename = `Request_${formTypeTitle.replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);

      try {
        if (auth.currentUser) {
          const totalAmount = calculateTotal();
          const driverName = headerData['Driver Name'] || headerData['Employee Name'] || headerData['Employee/Van Name'] || 'N/A';
          const truckNumber = headerData['Van/Truck Number'] || headerData['Van Number'] || 'N/A';
          
          await push(ref(database, `request_forms_history/${auth.currentUser.uid}`), {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            date: new Date().toISOString(),
            driverName,
            formType: isCustom ? (customSubject || 'Custom') : formType,
            truckNumber,
            amount: totalAmount,
          });
        }
      } catch (err) {
        console.error("Failed to save history:", err);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during form generation.');
    } finally {
      setIsProcessing(false);
    }
  };


  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setLoadingHistory(true);
    try {
      const q = query(collection(db, 'request_forms_history'), where('uid', '==', auth.currentUser.uid), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HistoryItem[];
      setHistoryItems(items);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const deleteHistoryItem = async (id: string) => {
    try {
      await remove(ref(database, `request_forms_history/${auth.currentUser?.uid}/${id}`));
      setHistoryItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all your request form history?')) return;
    try {
      for (const item of historyItems) {
        await remove(ref(database, `request_forms_history/${auth.currentUser?.uid}/${item.id}`));
      }
      setHistoryItems([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 antialiased print:block print:w-full print:p-0">
      
      {/* Dynamic Printing Style overrides */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5cm;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
          }
        }
      `}</style>

      {/* Input Form Controls (Left panel) */}
      <div className="xl:col-span-5 space-y-6 print:hidden">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileSpreadsheet className="w-8 h-8 text-green-700" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Request Form Builder</h3>
              <p className="text-sm text-slate-500">Draft expense sheets and request approvals.</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'builder' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Form Builder
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              History
            </button>
          </div>
          
          {activeTab === 'history' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-800">Your Generated Forms</h4>
                {historyItems.length > 0 && (
                  <button onClick={clearAllHistory} className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                    Clear All History ({historyItems.length} items)
                  </button>
                )}
              </div>
              {loadingHistory ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-700" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                  No history found. Generate a form first!
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {historyItems.map(item => (
                    <div key={item.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
                      <button onClick={() => deleteHistoryItem(item.id)} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-xs font-semibold text-green-700 mb-1">{item.formType}</div>
                      <div className="text-sm font-bold text-slate-800 mb-2">{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div><span className="text-slate-400 block">Driver:</span> {item.driverName}</div>
                        <div><span className="text-slate-400 block">Truck:</span> {item.truckNumber}</div>
                        <div className="col-span-2 mt-1 pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="font-semibold text-slate-500">Total Amount:</span>
                          <span className="font-bold text-emerald-600">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>


          {/* Form Type Select */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Form Type</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 font-medium text-slate-700 transition-colors"
            >
              {Object.keys(formConfigs).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description / Intro Text</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 text-sm text-slate-700 transition-colors resize-y min-h-[60px]"
            />
          </div>

          {/* Custom Form configurations */}
          {isCustom && (
            <div className="space-y-4 mb-6 p-4 bg-green-50/40 rounded-xl border border-green-100">
              <h4 className="text-xs font-bold text-green-900 uppercase tracking-wider flex items-center gap-1">
                <FilePlus className="w-4 h-4" /> Custom Form Setup
              </h4>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject / Title</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Flight Tickets"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>



              {/* Dynamic custom header fields */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Add Header Info Field</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHeaderName}
                    onChange={(e) => setNewHeaderName(e.target.value)}
                    placeholder="e.g. Project Name"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomHeader}
                    className="px-3 bg-green-700 text-white rounded-lg text-xs font-bold hover:bg-green-800"
                  >
                    Add
                  </button>
                </div>
                {customHeaders.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customHeaders.map(ch => (
                      <span key={ch} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600">
                        {ch}
                        <button type="button" onClick={() => removeCustomHeader(ch)} className="text-slate-400 hover:text-rose-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic custom columns */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Table Columns (Last is always Amount)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="e.g. Remarks"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomColumn}
                    className="px-3 bg-green-700 text-white rounded-lg text-xs font-bold hover:bg-green-800"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {customColumns.map(col => (
                    <span key={col} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600">
                      {col}
                      {col !== 'Date' && col !== 'Amount' && (
                        <button type="button" onClick={() => removeCustomColumn(col)} className="text-slate-400 hover:text-rose-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Header Fields (Configured) */}
          {currentConfig.headers.length > 0 && (
            <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Header Information</h4>
              <div className="grid grid-cols-1 gap-4">
                {currentConfig.headers.map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field}</label>
                    <input
                      type="text"
                      value={headerData[field] || ''}
                      onChange={(e) => handleHeaderChange(field, e.target.value)}
                      placeholder={`Enter ${field.toLowerCase()}`}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-colors text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row Items Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Row Items</h4>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1">
              {rows.map((row, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group space-y-3">
                  {rows.length > 1 && (
                    <button
                      onClick={() => deleteRow(index)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors hover:bg-rose-55/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {currentConfig.rows.includes('Date') && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={row.Date || ''}
                          onChange={(e) => handleRowChange(index, 'Date', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    )}
                    {currentConfig.rows.includes('Amount') && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                        <input
                          type="number"
                          value={row.Amount || ''}
                          onChange={(e) => handleRowChange(index, 'Amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Other columns inputs dynamically */}
                  {currentConfig.rows.filter(f => f !== 'Date' && f !== 'Amount').map(col => (
                    <div key={col}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{col}</label>
                      <input
                        type="text"
                        value={row[col] || ''}
                        onChange={(e) => handleRowChange(index, col, e.target.value)}
                        placeholder={`Enter ${col.toLowerCase()}`}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-6 mt-6 border-t border-slate-100">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start text-xs text-rose-700">
                <AlertCircle className="w-4.5 h-4.5 mr-2.5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center text-xs text-emerald-800">
                <CheckCircle className="w-4.5 h-4.5 mr-2.5 flex-shrink-0" />
                <span>Form generated and downloaded successfully!</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Form
              </button>
              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 flex-[2] px-4 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </>
        )}
      </div>
    </div>


      {/* Spreadsheet / Paper Preview Panel (Right panel) */}
      <div className="xl:col-span-7 flex flex-col items-center print:block print:w-full print:p-0">
        <div id="print-section" className="print-paper w-full max-w-[8.5in] bg-white border border-slate-300 shadow-lg rounded-2xl p-[0.6in] min-h-[11in] font-serif relative flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:pt-[200px]">
          
          {/* Document Header */}
          <div className="space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm tracking-wide text-slate-800">TO: {profile.manager_name || 'Emad Shahwan.'}</p>
                <p className="text-xs text-slate-500 font-semibold italic">{profile.manager_title || 'Dammam Sales Manager.'}</p>
                <p className="font-bold text-sm text-slate-800 mt-1">Respected Sir.</p>
              </div>
              <div className="text-right">
                {/* Date Positioned on Row 1 Column D (aligned nicely with Manager name) */}
                <p className="text-sm font-bold text-slate-800 border border-slate-200 px-3 py-1 bg-slate-50 rounded-lg inline-block print:border-none print:bg-transparent">
                  Date: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Subject: {isCustom ? (customSubject || 'Custom') : formType} Request
              </h2>
            </div>
          </div>

          {/* Document Body */}
          <div className="my-8 flex-1">
            <p className="text-sm text-slate-700 leading-relaxed mb-6 font-sans">
              {description}
            </p>

            {/* Header Detail Box (if headers exist) */}
            {currentConfig.headers.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 font-sans grid grid-cols-2 gap-4 print:bg-transparent">
                {currentConfig.headers.map(f => (
                  <div key={f}>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f}</span>
                    <span className="text-sm font-semibold text-slate-800">{headerData[f] || '________________________'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Live Table */}
            {currentConfig.rows.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-x-auto print:overflow-visible font-sans shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 print:bg-transparent">
                      {currentConfig.rows.map(h => (
                        <th key={h} className={`p-3 uppercase tracking-wider whitespace-nowrap ${h === 'Date' ? 'text-left' : h === 'Amount' ? 'text-right' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        {currentConfig.rows.map(field => {
                          let val = row[field];
                          // Format amount as currency
                          const lastCol = currentConfig.rows[currentConfig.rows.length - 1];
                          if (field === lastCol && val) {
                            const parsed = parseFloat(val);
                            if (!isNaN(parsed)) {
                              val = parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            }
                          }
                        

                          return (
                            <td key={field} className={`p-3 text-slate-700 font-medium font-mono align-middle whitespace-nowrap ${field === 'Date' ? 'text-left' : field === 'Amount' ? 'text-right' : 'text-center'}`}>
                              {val || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-slate-50/70 border-t-2 border-slate-200 font-bold text-slate-800 print:bg-transparent">
                      <td className="p-3 text-left font-bold text-slate-800" colSpan={currentConfig.rows.length - 1}>TOTAL</td>
                      <td className="p-3 font-mono font-bold text-right text-slate-900">{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {!isCustom && (formType === 'Expenses' || formType === 'Tires Fix' || formType === 'License Upgradation' || formType === 'Club Supplies') && (
              <p className="text-xs text-slate-400 mt-4 italic font-sans">* Invoices Attached for Reference</p>
            )}
          </div>

          {/* Signatures layout */}
          <div className="border-t border-slate-100 pt-8 font-sans mt-auto mb-4 print:mt-48">
            <div className={`grid ${['Fuel', 'Tires Fix', 'License Upgradation'].includes(formType) ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
              <div className="text-left">
                <div className="h-12 border-b border-black w-24 mb-2"></div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sales Manager</p>
              </div>
              
              {['Fuel', 'Tires Fix', 'License Upgradation'].includes(formType) && (
                <div className="text-center flex flex-col items-center">
                  <div className="h-12 border-b border-black w-24 mb-2"></div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Workshop</p>
                </div>
              )}
              
              <div className="text-center flex flex-col items-center">
                <div className="h-12 border-b border-black w-24 mb-2"></div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Accounting</p>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <div className="h-12 border-b border-black w-24 mb-2"></div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Supervisor</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

