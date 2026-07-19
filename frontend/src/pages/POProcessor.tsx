import { processSubcontracting } from '../utils/exports/SubcontractingProcessor';
import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { getBackendUrl } from '../lib/config';
import { database } from '../lib/firebase';
import { ref, get } from 'firebase/database';

export default function POProcessor({ sharedActionFile, setSharedActionFile }: { sharedActionFile: File | null; setSharedActionFile: (f: File | null) => void }) {
  const [activeSubTab, setActiveSubTab] = useState('ecom');
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsProcessing(false);
      setError('Processing was cancelled by the user.');
    }
  };

  const handleProcess = async () => {
    if (!sharedActionFile || (activeSubTab === 'dest' && !secondaryFile)) {
      setError('All required files must be uploaded.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    
    // Auto-timeout after 5 minutes (300 seconds)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000);

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      
      // Add Profile Settings based on subtab
      let profileStr = '{}';
      if (activeSubTab === 'to' || activeSubTab === 'dest') {
        const defaultDestStr = JSON.stringify({ branch: 'Dammam', cost_center: '1DMECD001', sloc: 'DHDD', plant: 'DM01', warehouse: 'Dammam Club', sloc_transfer: 'DMHD', signature: 'Rashid Saddique', manager_name: 'Emad Shahwan.', manager_title: 'Dammam Sales Manager.' });
        profileStr = localStorage.getItem('inventory_dest_profile') || defaultDestStr;
      } else if (activeSubTab === 'ecom' || activeSubTab === 'po') {
        const defaultPoStr = JSON.stringify({ branch: 'Dammam', plant: 'DM01', sloc2: 'DMHD', signature: 'Rashid Saddique' });
        profileStr = localStorage.getItem('inventory_po_profile') || defaultPoStr;
      }
      // Force cloud-db to bypass any backend legacy path bugs
      try {
        const pObj = JSON.parse(profileStr);
        pObj.dest_master_url = 'cloud-db';
        pObj.po_master_url = 'cloud-db';
        pObj.ecom_master_url = 'cloud-db';
        profileStr = JSON.stringify(pObj);
      } catch (e) {}

      formData.append('profile_settings', profileStr);

      const baseUrl = await getBackendUrl();
      let endpoint = '';
      if (activeSubTab === 'po') {
        formData.append('po_file', sharedActionFile);
        
        // Fetch PO Master from Firebase to bypass legacy backend limitations
        try {
          const snapshot = await get(ref(database, 'global_master_files/po_master_url'));
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && data.data) {
              const byteCharacters = atob(data.data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
              formData.append('master_file', blob, 'po_master.xlsx');
            }
          }
        } catch (e) {
          console.warn('Failed to fetch PO master from firebase', e);
        }
        
        endpoint = `${baseUrl}/api/process-invoice`;
      } else if (activeSubTab === 'ecom') {
        formData.append('po_file', sharedActionFile);
        formData.append('orientation', 'landscape');
        formData.append('page_size', 'A4');
        
        // Fetch Ecom Master from Firebase to bypass legacy backend limitations
        try {
          const snapshot = await get(ref(database, 'global_master_files/ecom_master_url'));
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && data.data) {
              const byteCharacters = atob(data.data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
              formData.append('master_file', blob, 'ecom_master.xlsx');
            }
          }
        } catch (e) {
          console.warn('Failed to fetch E-com master from firebase', e);
        }
        
        endpoint = `${baseUrl}/api/process-ecom-invoice`;
      } else if (activeSubTab === 'to') {
        formData.append('to_file', sharedActionFile);
        
        // Fetch TO Master from Firebase to bypass legacy backend limitations
        try {
          const snapshot = await get(ref(database, 'global_master_files/dest_master_url'));
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && data.data) {
              const byteCharacters = atob(data.data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
              formData.append('master_file', blob, 'to_master.xlsx');
            }
          }
        } catch (e) {
          console.warn('Failed to fetch TO master from firebase', e);
        }
        
        endpoint = `${baseUrl}/api/process-transfer-order`;
      } else if (activeSubTab === 'dest') {
        formData.append('sap_file', sharedActionFile);
        if (secondaryFile) {
          formData.append('destruction_file', secondaryFile);
        }
        endpoint = `${baseUrl}/api/process-destruction`;
      }

      
      if (activeSubTab === 'subcontracting') {
        try {
          const blob = await processSubcontracting(sharedActionFile);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Subcontracting_Report_${new Date().getTime()}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          clearTimeout(timeoutId);
          setSuccess(true);
        } catch (err: any) {
          setError(err.message || 'Error processing subcontracting file');
        } finally {
          setIsProcessing(false);
          setAbortController(null);
          clearTimeout(timeoutId);
        }
        return;
      }

      const response = await fetch(endpoint, {

        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errStr = 'Processing failed';
        try {
           const errorData = await response.json();
           errStr = errorData.detail || errStr;
           if (typeof errStr === 'object') {
             errStr = JSON.stringify(errStr);
           }
        } catch(e) {}
        throw new Error(errStr);
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${activeSubTab}_results.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError(timeoutId ? 'Request timed out or was cancelled. Please make sure the backend server is running.' : 'Cancelled.');
      } else {
        setError(err.message === 'Failed to fetch' ? 'Failed to connect to backend. Please ensure the local server (port 8000) is running.' : (err.message || 'An unexpected error occurred'));
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
      clearTimeout(timeoutId);
    }
  };

  const getSubTitle = () => {
    if (activeSubTab === 'subcontracting') return 'Process Subcontracting Data.';
    if (activeSubTab === 'po') return 'Process standard POs and Invoices against Master Data.';
    if (activeSubTab === 'ecom') return 'Match E-com Invoices against E-com Master Data.';
    if (activeSubTab === 'to') return 'Process Transfer Orders against Master Data.';
    if (activeSubTab === 'dest') return 'Generate Standard Allocation for Destruction.';
  }

  const getFile1Label = () => {
    if (activeSubTab === 'subcontracting') return '1. Subcontracting File (Excel) *';
    if (activeSubTab === 'po') return '1. PO File (Excel/PDF) *';
    if (activeSubTab === 'ecom') return '1. SAP File (Excel) *';
    if (activeSubTab === 'to') return '1. Transfer Order File (Excel) *';
    if (activeSubTab === 'dest') return '1. SAP Inventory File (Excel) *';
  }



  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">PO & Invoice Processor</h3>
          <p className="text-slate-500 mt-1">{getSubTitle()}</p>
        </div>
        
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg mt-4 sm:mt-0 gap-1">
          <button 
            onClick={() => { setActiveSubTab('ecom'); setSuccess(false); setError(null); }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === 'ecom' ? 'bg-white shadow-sm text-green-800' : 'text-slate-600 hover:text-slate-900'}`}
          >
            E-Com Invoice
          </button>
          <button 
            onClick={() => { setActiveSubTab('to'); setSuccess(false); setError(null); }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === 'to' ? 'bg-white shadow-sm text-green-800' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Transfer Order
          </button>
          <button 
            onClick={() => { setActiveSubTab('dest'); setSuccess(false); setError(null); }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === 'dest' ? 'bg-white shadow-sm text-green-800' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Standard Allocation
          </button>
            <button 
              onClick={() => { setActiveSubTab('po'); setSuccess(false); setError(null); }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === 'po' ? 'bg-white shadow-sm text-green-800' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Standard PO
            </button>
            <button 
              onClick={() => { setActiveSubTab('subcontracting'); setSuccess(false); setError(null); }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSubTab === 'subcontracting' ? 'bg-white shadow-sm text-green-800' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Subcontracting
            </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">{getFile1Label()}</label>
            <div className="relative">
              <input 
                type="file" 
                key={`${activeSubTab}-file1`}
                accept=".xlsx,.xls,.pdf,.csv"
                onChange={(e) => setSharedActionFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${sharedActionFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}`}>
                <FileText className={`w-10 h-10 mb-3 ${sharedActionFile ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium text-slate-700 truncate w-full text-center">
                  {sharedActionFile ? sharedActionFile.name : 'Click or drag file here'}
                </span>
              </div>
            </div>
          </div>

          {activeSubTab === 'dest' && (
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">2. Destruction List (Excel) *</label>
            <div className="relative">
              <input 
                type="file" 
                key={`${activeSubTab}-file2`}
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setSecondaryFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${secondaryFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}`}>
                <FileText className={`w-10 h-10 mb-3 ${secondaryFile ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium text-slate-700 truncate w-full text-center">
                  {secondaryFile ? secondaryFile.name : 'Click or drag file here'}
                </span>
              </div>
            </div>
          </div>
          )}

        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-50 rounded-lg flex items-start border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Processing Failed</h4>
              <p className="text-sm text-red-600 mt-1 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 rounded-lg flex items-center border border-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Files processed and downloaded successfully!</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
          {isProcessing && (
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
            >
              Cancel Processing
            </button>
          )}
          <button
            onClick={handleProcess}
            disabled={isProcessing || !sharedActionFile}
            className="flex items-center px-6 py-3 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate & Download
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
