import React, { useState, useEffect } from 'react';
import { Save, Settings2, Folder, CloudUpload, FileSpreadsheet, Loader2, CheckCircle2, Key } from 'lucide-react';
import { database } from '../lib/firebase';
import { ref as dbRef, set as dbSet } from 'firebase/database';
import { auth } from '../lib/firebase';
import { updatePassword } from 'firebase/auth';
import { useToast } from '../components/ui/ToastNotification';

export const DEFAULT_PROFILE = {
  branch: 'Dammam',
  plant: 'DM01',
  sloc: 'DHDD',
  sloc2: 'DMHD',
  warehouse: 'Dammam Club',
  cost_center: '1DMECD001',
  sloc_transfer: 'DMHD',
  signature: 'Rashid Saddique',
  manager_name: 'Emad Shahwan.',
  manager_title: 'Dammam Sales Manager.',
  dest_master_path: '',
  po_master_path: '',
  ecom_master_path: '',
  dest_master_url: '',
  po_master_url: '',
  ecom_master_url: ''
};

export function ProfileSettings() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const savedUnified = localStorage.getItem('inventory_profile_v2');
    if (savedUnified) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedUnified) });
      } catch (e) {
        console.error("Failed to parse profile settings.");
      }
    } else {
      const savedDest = localStorage.getItem('inventory_dest_profile');
      const savedPo = localStorage.getItem('inventory_po_profile');
      let merged = { ...DEFAULT_PROFILE };
      if (savedDest) {
        try { merged = { ...merged, ...JSON.parse(savedDest) }; } catch (e) {}
      }
      if (savedPo) {
        try { merged = { ...merged, ...JSON.parse(savedPo) }; } catch (e) {}
      }
      setProfile(merged);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  
  const handleUpdatePassword = async () => {
    if (!newPassword) {
      addToast('error', 'Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Passwords do not match.');
      return;
    }
    if (!auth.currentUser) {
      addToast('error', 'You must be logged in to change your password.');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      addToast('success', 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Password update error:", error);
      if (error.code === 'auth/requires-recent-login') {
        addToast('error', 'For security reasons, please log out and log back in before changing your password.');
      } else {
        addToast('error', `Failed to update password: ${error.message}`);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('inventory_profile_v2', JSON.stringify(profile));
    localStorage.setItem('inventory_dest_profile', JSON.stringify(profile));
    localStorage.setItem('inventory_po_profile', JSON.stringify(profile));
    addToast('success', 'Settings Saved Successfully!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, profileKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [profileKey]: 10 }));

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        // The result is a data URL like "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,..."
        // We just store the base64 part
        const b64 = result.includes(',') ? result.split(',')[1] : result;
        
        setUploading(prev => ({ ...prev, [profileKey]: 50 }));
        
        await dbSet(dbRef(database, `global_master_files/${profileKey}`), {
          name: file.name,
          data: b64,
          updatedAt: Date.now()
        });

        setUploading(prev => ({ ...prev, [profileKey]: 100 }));
        
        setProfile(prev => {
          const updated = { ...prev, [profileKey]: 'cloud-db' };
          localStorage.setItem('inventory_profile_v2', JSON.stringify(updated));
          localStorage.setItem('inventory_dest_profile', JSON.stringify(updated));
          localStorage.setItem('inventory_po_profile', JSON.stringify(updated));
          return updated;
        });
        
        addToast('success', `Successfully uploaded ${file.name} to the global cloud database!`);
      } catch (error: any) {
        console.error("Upload failed:", error);
        addToast('error', `Upload failed: ${error.message}`);
      } finally {
        setUploading(prev => {
          const newUp = { ...prev };
          delete newUp[profileKey];
          return newUp;
        });
      }
    };
    reader.onerror = () => {
      addToast('error', "Error reading file locally");
      setUploading(prev => {
        const newUp = { ...prev };
        delete newUp[profileKey];
        return newUp;
      });
    }
    reader.readAsDataURL(file);
  };

  const renderInput = (label: string, name: string, value: string, placeholder: string = "") => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-colors bg-slate-50 text-slate-900"
      />
    </div>
  );

  const renderCloudUploader = (label: string, profileKey: string, currentUrl: string | undefined) => {
    const isUploading = uploading[profileKey] !== undefined;
    const progress = uploading[profileKey] || 0;

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-700 p-2 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{label}</h3>
              {currentUrl ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Backed up to Cloud
                </span>
              ) : (
                <span className="text-xs text-amber-600 mt-1 block">Not uploaded yet</span>
              )}
            </div>
          </div>
          {currentUrl === 'cloud-db' && (
            <span 
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-lg"
            >
              <CheckCircle2 className="w-4 h-4" /> Shared Globally
            </span>
          )}
        </div>

        <div className="mt-4">
          <label className="relative flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-green-400 hover:bg-green-50/50 transition-colors cursor-pointer group">
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, profileKey)}
              disabled={isUploading}
            />
            <div className="flex items-center gap-3 text-slate-500 group-hover:text-green-700">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-700" />
              ) : (
                <CloudUpload className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {isUploading ? `Uploading... ${Math.round(progress)}%` : "Click to upload new Master File"}
              </span>
            </div>
          </label>
          
          {isUploading && (
            <div className="w-full bg-slate-200 h-1.5 mt-3 rounded-full overflow-hidden">
              <div 
                className="bg-green-700 h-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-green-700" />
              Profile Settings
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Configure your location, signatures, and permanent master files.</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 transition-colors font-bold shadow-md active:scale-95"
          >
            <Save className="w-5 h-5" />
            Save All Settings
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <CloudUpload className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Cloud Master Files (Recommended for Render)</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Upload your master files to the cloud. They will be stored permanently online so you don't need to select them every time, and the cloud backend server can read them automatically.
          </p>
          <div className="space-y-2">
            {renderCloudUploader('Destruction & Transfer Master', 'dest_master_url', profile.dest_master_url)}
            {renderCloudUploader('Standard PO Master', 'po_master_url', profile.po_master_url)}
            {renderCloudUploader('E-Com PO Master', 'ecom_master_url', profile.ecom_master_url)}
            {renderCloudUploader('Material Master', 'material_master_url', profile.material_master_url as any)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <Folder className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Local Master File Paths (For LocalTunnel Only)</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            If you are running the backend locally via LocalTunnel, you can provide paths to files on your hard drive. <b>Note: These will fail if you are using the Render cloud server.</b>
          </p>
          <div className="space-y-4">
            {renderInput('Destruction & Transfer Master Path', 'dest_master_path', profile.dest_master_path, 'e.g., D:\\Files\\Destruction_Master.xlsx')}
            {renderInput('Standard PO Master Path', 'po_master_path', profile.po_master_path, 'e.g., D:\\Files\\PO_Master.xlsx')}
            {renderInput('E-Com PO Master Path', 'ecom_master_path', profile.ecom_master_path, 'e.g., D:\\Files\\Ecom_Master.xlsx')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Location Settings</h2>
            <div className="space-y-4">
              {renderInput('Branch', 'branch', profile.branch)}
              {renderInput('Plant', 'plant', profile.plant)}
              {renderInput('SLoc (Destruction)', 'sloc', profile.sloc)}
              {renderInput('SLoc 2 (PO/E-Com)', 'sloc2', profile.sloc2)}
              {renderInput('Warehouse', 'warehouse', profile.warehouse)}
              {renderInput('Cost Center', 'cost_center', profile.cost_center)}
              {renderInput('SLoc Transfer', 'sloc_transfer', profile.sloc_transfer)}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Signatures</h2>
            <div className="space-y-4">
              {renderInput('Your Signature', 'signature', profile.signature)}
              {renderInput('Manager Name', 'manager_name', profile.manager_name)}
              {renderInput('Manager Title', 'manager_title', profile.manager_title)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Account Security</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Update your account password. For security reasons, you may need to have logged in recently to perform this action.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors bg-slate-50 text-slate-900"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors bg-slate-50 text-slate-900"
              />
            </div>
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={isChangingPassword}
            className="mt-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>

      </div>
    </div>
  );
}
