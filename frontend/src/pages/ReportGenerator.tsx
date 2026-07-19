import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { getBackendUrl } from '../lib/config';

export default function ReportGenerator({ sharedActionFile, setSharedActionFile }: { sharedActionFile: File | null; setSharedActionFile: (f: File | null) => void }) {
  const [reportType, setReportType] = useState('E-Com');
  
  const [loginextFile, setLoginextFile] = useState<File | null>(null);
  const [remainingFile, setRemainingFile] = useState<File | null>(null);
  
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
    if (!sharedActionFile || !loginextFile) {
      setError('SAP and Loginext files are required.');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    
    // Auto-timeout after 5 minutes
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000);

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      
      // Add Profile Settings
      const defaultDestStr = JSON.stringify({ branch: 'Dammam', cost_center: '1DMECD001', sloc: 'DHDD', plant: 'DM01', warehouse: 'Dammam Club', sloc_transfer: 'DMHD', signature: 'Rashid Saddique', manager_name: 'Emad Shahwan.', manager_title: 'Dammam Sales Manager.' });
      const profileStr = localStorage.getItem('inventory_dest_profile') || defaultDestStr;
      formData.append('profile_settings', profileStr);

      formData.append('sap_file', sharedActionFile);
      formData.append('loginext_file', loginextFile);
      if (remainingFile) {
        formData.append('remaining_file', remainingFile);
      }
      formData.append('report_type', reportType);

      const baseUrl = await getBackendUrl();
      const response = await fetch(`${baseUrl}/api/process-report`, {
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

      // Handle the file download
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `report_results_${reportType}.xlsx`;
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800">Sale Report Processor</h3>
        <p className="text-slate-500 mt-1">Upload your daily SAP and Loginext files to generate structured Sale Reports.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Report Type Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
          <div className="grid grid-cols-4 gap-4">
            {['E-Com', 'Montana'].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  reportType === type 
                    ? 'border-green-700 bg-green-50 text-green-800' 
                    : 'border-slate-200 text-slate-600 hover:border-green-300 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">1. SAP File *</label>
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setSharedActionFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${sharedActionFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}`}>
                <FileText className={`w-8 h-8 mb-2 ${sharedActionFile ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium text-slate-700 truncate w-full text-center">
                  {sharedActionFile ? sharedActionFile.name : 'Select SAP File'}
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">2. Loginext File *</label>
            <div className="relative">
              <input 
                type="file" 
                onChange={(e) => setLoginextFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${loginextFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}`}>
                <FileText className={`w-8 h-8 mb-2 ${loginextFile ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium text-slate-700 truncate w-full text-center">
                  {loginextFile ? loginextFile.name : 'Select Loginext File'}
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">3. Remaining Sheet (Optional)</label>
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setRemainingFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${remainingFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}`}>
                <FileText className={`w-8 h-8 mb-2 ${remainingFile ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium text-slate-700 truncate w-full text-center">
                  {remainingFile ? remainingFile.name : 'Select Remaining File'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-50 rounded-lg flex items-start border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Processing Failed</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 rounded-lg flex items-center border border-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Report processed and downloaded successfully!</p>
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
            disabled={isProcessing || !sharedActionFile || !loginextFile}
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
