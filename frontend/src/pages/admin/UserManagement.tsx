import React, { useState, useEffect } from 'react';
import { database, auth } from '../../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '../../components/ui/ToastNotification';
import { ArrowLeft, Shield, Lock, Key, User, AlertTriangle, CheckCircle2, XCircle, Settings, Smartphone } from 'lucide-react';
import { APPLICATIONS } from '../../config/ApplicationRegistry';

interface CustomUser {
  password?: string;
  role?: string;
  email?: string;
  disabled?: boolean;
  applicationAccess?: {
    mainAdmin?: boolean;
    salesAdmin?: boolean;
    inventoryAdmin?: boolean;
    storekeeperMobile?: boolean;
    scanner?: boolean;
    reports?: boolean;
    exportHub?: boolean;
    poInvoice?: boolean;
    requestForms?: boolean;
    reminders?: boolean;
    notes?: boolean;
    profile?: boolean;
    appHub?: boolean;
    centralReports?: boolean;
    inventoryApp?: boolean;
    extensions?: boolean;
    pythonDesktop?: boolean;
    salesmanMobile?: boolean;
    scannerAdmin?: boolean;
    scannerMobile?: boolean;
    spreadsheetWorkspace?: boolean;
    automationTools?: boolean;
    jobPortal?: boolean;
  };
  applicationRoles?: {
    mainAdmin?: string;
    salesAdmin?: string;
    inventoryAdmin?: string;
    storekeeperMobile?: string;
    scanner?: string;
    reports?: string;
    exportHub?: string;
    poInvoice?: string;
    requestForms?: string;
    reminders?: string;
    notes?: string;
    profile?: string;
    appHub?: string;
    centralReports?: string;
    inventoryApp?: string;
    extensions?: string;
    pythonDesktop?: string;
    salesmanMobile?: string;
    scannerAdmin?: string;
    scannerMobile?: string;
    spreadsheetWorkspace?: string;
    automationTools?: string;
    jobPortal?: string;
  };
  permissions?: {
    [key: string]: boolean | undefined;
  };
  name?: string;
  phone?: string;
  employeeId?: string;
  territory?: string;
  department?: string;
  notes?: string;
  sessionTimeout?: number;
  maxDevices?: number;
  maxLoginAttempts?: number;
  accountExpiry?: string;
  isTemporary?: boolean;
  isReadOnly?: boolean;
  forcePasswordChange?: boolean;
  locked?: boolean;
}

interface UserManagementProps {
  userKey: string;
  onBack: () => void;
  currentUserEmail?: string;
  isSystemAdmin?: boolean;
}

export default function UserManagement({ userKey, onBack, currentUserEmail, isSystemAdmin }: UserManagementProps) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'apps' | 'roles' | 'permissions' | 'password' | 'advanced'>('details');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const userRef = ref(database, `users/${userKey}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      setUser(data || null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userKey]);

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      addToast('error', 'User email is required.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      addToast('success', 'Password reset email sent successfully.');
    } catch (err: any) {
      console.error('Error sending password reset:', err);
      addToast('error', 'Unable to send password reset email. Please try again.');
    }
  };

  const handleForcePasswordChange = () => {
    if (!user) return;
    if (!window.confirm('Force this user to change their password on next login?')) {
      return;
    }
    setUser({ ...user, forcePasswordChange: true });
    addToast('success', 'User will be required to change password on next login.');
  };

  const handleLockAccount = () => {
    if (!user) return;
    if (isSystemAdmin && user.email === currentUserEmail) {
      addToast('error', 'System Admin cannot lock themselves.');
      return;
    }
    if (!window.confirm('Lock this user account? They will not be able to log in.')) {
      return;
    }
    setUser({ ...user, locked: true });
    addToast('success', 'User account locked successfully.');
  };

  const handleUnlockAccount = () => {
    if (!user) return;
    setUser({ ...user, locked: false });
    addToast('success', 'User account unlocked successfully.');
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Prevent System Admin from modifying themselves in dangerous ways
    if (isSystemAdmin && user.email === currentUserEmail) {
      if (user.disabled || user.locked) {
        addToast('error', 'System Admin cannot disable or lock themselves.');
        return;
      }
    }

    setSaving(true);
    try {
      await update(ref(database, `users/${userKey}`), user);
      addToast('success', 'User updated successfully.');
    } catch (err: any) {
      console.error('Error updating user:', err);
      addToast('error', 'Unable to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAppAccess = (app: string) => {
    if (!user) return;
    
    // Prevent System Admin from removing their own access
    if (isSystemAdmin && user.email === currentUserEmail && app === 'mainAdmin') {
      addToast('error', 'System Admin cannot remove their own Main Admin access.');
      return;
    }
    
    const currentAccess = user.applicationAccess || {};
    
    setUser({
      ...user,
      applicationAccess: {
        ...currentAccess,
        [app]: !currentAccess[app as keyof typeof currentAccess]
      }
    });
  };

  const handleDisableUser = async () => {
    if (!user) return;
    
    // Prevent System Admin from disabling themselves
    if (isSystemAdmin && user.email === currentUserEmail && !user.disabled) {
      addToast('error', 'System Admin cannot disable themselves.');
      return;
    }
    
    const isDisabling = !user.disabled;
    if (!window.confirm(isDisabling ? 'Are you sure you want to disable this user? They will not be able to log in.' : 'Are you sure you want to enable this user?')) {
      return;
    }
    
    try {
      // Import update and ref at the top if needed, they should be there since onValue and set are used.
      // Wait, let's just use the direct reference
      await set(ref(database, `users/${userKey}/disabled`), isDisabling);
      setUser({ ...user, disabled: isDisabling });
      addToast('success', isDisabling ? 'User disabled successfully.' : 'User enabled successfully.');
    } catch (err) {
      console.error('Error toggling user status:', err);
      addToast('error', 'Unable to update user status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">User not found</div>
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
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Users</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">{user.email?.split('@')[0] || 'User'}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* User Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{user.email?.split('@')[0] || 'User'}</h1>
                <p className="text-slate-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.disabled ? 'bg-red-100 text-red-700' : 
                    user.locked ? 'bg-amber-100 text-amber-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.disabled ? 'Disabled' : user.locked ? 'Locked' : 'Active'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {user.role || 'No Role'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {!isSystemAdmin || user.email !== currentUserEmail ? (
                <button
                  onClick={handleDisableUser}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    user.disabled 
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  {user.disabled ? 'Enable User' : 'Disable User'}
                </button>
              ) : null}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              { id: 'details', label: 'User Details', icon: User },
              { id: 'apps', label: 'Application Access', icon: Smartphone },
              { id: 'roles', label: 'Roles', icon: Shield },
              { id: 'permissions', label: 'Permissions', icon: Key },
              { id: 'password', label: 'Password', icon: Lock },
              { id: 'advanced', label: 'Advanced', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
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
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user.name || ''}
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={user.phone || ''}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Employee ID</label>
                    <input
                      type="text"
                      value={user.employeeId || ''}
                      onChange={(e) => setUser({ ...user, employeeId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Territory</label>
                    <select
                      value={user.territory || ''}
                      onChange={(e) => setUser({ ...user, territory: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="">Not assigned</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="Central">Central</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={user.department || ''}
                      onChange={(e) => setUser({ ...user, department: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={user.notes || ''}
                    onChange={(e) => setUser({ ...user, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Application Access Control</p>
                    <p className="text-sm text-amber-700">Users can only access applications explicitly enabled here. Roles determine permissions WITHIN applications, not access TO applications.</p>
                  </div>
                </div>

                {APPLICATIONS.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <app.icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{app.displayName}</p>
                        <p className="text-sm text-slate-500">
                          {user.applicationAccess?.[app.applicationAccessKey] ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleAppAccess(app.applicationAccessKey)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        user.applicationAccess?.[app.applicationAccessKey]
                          ? 'bg-indigo-600'
                          : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          user.applicationAccess?.[app.applicationAccessKey]
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-4">
                <p className="text-slate-600">Roles define permissions within each enabled application.</p>
                {Object.entries(user.applicationAccess || {}).map(([app, enabled]) => {
                  if (!enabled) return null;
                  return (
                    <div key={app} className="p-4 bg-slate-50 rounded-lg">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                        {app.replace(/([A-Z])/g, ' $1').trim()} Role
                      </label>
                      <select
                        value={(user.applicationRoles?.[app as keyof typeof user.applicationRoles] as string) || ''}
                        onChange={(e) => setUser({
                          ...user,
                          applicationRoles: {
                            ...user.applicationRoles,
                            [app]: e.target.value
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                      >
                        <option value="">Select Role</option>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <p className="text-slate-600">Fine-grained permissions for each application.</p>
                {Object.entries(user.permissions || {}).map(([perm, value]) => (
                  <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900 capitalize">{perm.replace(/_/g, ' ')}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {value ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Password Management</p>
                    <p className="text-sm text-amber-700">Use these options to manage user password security.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleSendPasswordReset}
                    className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                  >
                    <Key className="w-6 h-6 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-900">Send Password Reset Email</p>
                    <p className="text-sm text-slate-500">Send a password reset link to user's email</p>
                  </button>
                  <button
                    onClick={handleForcePasswordChange}
                    className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                  >
                    <Lock className="w-6 h-6 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-900">Force Password Change</p>
                    <p className="text-sm text-slate-500">Require user to change password on next login</p>
                  </button>
                  <button
                    onClick={user.locked ? handleUnlockAccount : handleLockAccount}
                    className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                  >
                    {user.locked ? (
                      <CheckCircle2 className="w-6 h-6 text-slate-600 mb-2" />
                    ) : (
                      <XCircle className="w-6 h-6 text-slate-600 mb-2" />
                    )}
                    <p className="font-semibold text-slate-900">{user.locked ? 'Unlock Account' : 'Lock Account'}</p>
                    <p className="text-sm text-slate-500">{user.locked ? 'Unlock a locked user account' : 'Temporarily lock user account'}</p>
                  </button>
                  <button
                    onClick={handleDisableUser}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      user.disabled ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    <Shield className="w-6 h-6 mb-2" />
                    <p className="font-semibold text-slate-900">{user.disabled ? 'Enable Account' : 'Disable Account'}</p>
                    <p className="text-sm text-slate-500">{user.disabled ? 'Re-enable user account' : 'Disable user account'}</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={user.sessionTimeout || 60}
                      onChange={(e) => setUser({ ...user, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Maximum Devices</label>
                    <input
                      type="number"
                      value={user.maxDevices || 5}
                      onChange={(e) => setUser({ ...user, maxDevices: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={user.maxLoginAttempts || 5}
                      onChange={(e) => setUser({ ...user, maxLoginAttempts: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Account Expiry Date</label>
                    <input
                      type="date"
                      value={user.accountExpiry || ''}
                      onChange={(e) => setUser({ ...user, accountExpiry: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={user.isTemporary || false}
                      onChange={(e) => setUser({ ...user, isTemporary: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-medium text-slate-900">Temporary User</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={user.isReadOnly || false}
                      onChange={(e) => setUser({ ...user, isReadOnly: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-medium text-slate-900">Read Only User</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
