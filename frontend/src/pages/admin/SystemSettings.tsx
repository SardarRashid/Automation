import { useState, useEffect } from 'react';
import { database } from '../../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useToast } from '../../components/ui/ToastNotification';
import { Building2, Globe, DollarSign, Clock, Shield, Database, Smartphone, Monitor, Bell, Settings as SettingsIcon } from 'lucide-react';

interface SystemSettings {
  companyInfo?: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  localization?: {
    currency: string;
    language: string;
    timezone: string;
    dateFormat: string;
  };
  firebase?: {
    projectId: string;
    databaseUrl: string;
  };
  desktop?: {
    enabled: boolean;
    version: string;
    autoUpdate: boolean;
  };
  mobile?: {
    enabled: boolean;
    version: string;
    biometricAuth: boolean;
  };
  ai?: {
    enabled: boolean;
    model: string;
    apiKey?: string;
  };
  notifications?: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security?: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
  };
}

interface SystemSettingsProps {
  onBack: () => void;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'localization' | 'firebase' | 'desktop' | 'mobile' | 'ai' | 'notifications' | 'security'>('company');
  const { addToast } = useToast();

  useEffect(() => {
    const settingsRef = ref(database, 'system/settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      setSettings(data || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(ref(database, 'system/settings'), settings);
      addToast('success', 'System settings saved successfully.');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      addToast('error', 'Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center space-x-2 text-sm">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-700 transition-colors">
              Dashboard
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">System Settings</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {[
              { id: 'company', label: 'Company Info', icon: Building2 },
              { id: 'localization', label: 'Localization', icon: Globe },
              { id: 'firebase', label: 'Firebase', icon: Database },
              { id: 'desktop', label: 'Desktop', icon: Monitor },
              { id: 'mobile', label: 'Mobile', icon: Smartphone },
              { id: 'ai', label: 'AI Settings', icon: SettingsIcon },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'company' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={settings.companyInfo?.name || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyInfo: { ...settings.companyInfo, name: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Email</label>
                    <input
                      type="email"
                      value={settings.companyInfo?.email || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyInfo: { ...settings.companyInfo, email: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={settings.companyInfo?.phone || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyInfo: { ...settings.companyInfo, phone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={settings.companyInfo?.address || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        companyInfo: { ...settings.companyInfo, address: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'localization' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Localization Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
                    <select
                      value={settings.localization?.currency || 'USD'}
                      onChange={(e) => setSettings({
                        ...settings,
                        localization: { ...settings.localization, currency: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="SAR">SAR (﷼)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
                    <select
                      value={settings.localization?.language || 'en'}
                      onChange={(e) => setSettings({
                        ...settings,
                        localization: { ...settings.localization, language: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Timezone</label>
                    <select
                      value={settings.localization?.timezone || 'UTC'}
                      onChange={(e) => setSettings({
                        ...settings,
                        localization: { ...settings.localization, timezone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                      <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date Format</label>
                    <select
                      value={settings.localization?.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => setSettings({
                        ...settings,
                        localization: { ...settings.localization, dateFormat: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security?.sessionTimeout || 60}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.security?.maxLoginAttempts || 5}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password Min Length</label>
                    <input
                      type="number"
                      value={settings.security?.passwordMinLength || 8}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      checked={settings.security?.twoFactorAuth || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactorAuth: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-medium text-slate-900">Enable Two-Factor Authentication</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Notification Settings</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.emailEnabled || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailEnabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-medium text-slate-900">Email Notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.smsEnabled || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, smsEnabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-medium text-slate-900">SMS Notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.pushEnabled || false}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, pushEnabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-medium text-slate-900">Push Notifications</span>
                  </label>
                </div>
              </div>
            )}

            {['firebase', 'desktop', 'mobile', 'ai'].includes(activeTab) && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab} Settings</h2>
                <p className="text-slate-500">Settings for {activeTab} are managed through Firebase configuration.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={onBack}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
