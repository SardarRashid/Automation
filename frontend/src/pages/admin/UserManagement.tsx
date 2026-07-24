import React, { useState, useEffect } from 'react';
import { database, auth } from '../../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '../../components/ui/ToastNotification';
import { ArrowLeft, Shield, Lock, Key, User, AlertTriangle, CheckCircle2, XCircle, Settings, Smartphone } from 'lucide-react';
import { APPLICATIONS } from '../../config/ApplicationRegistry';
import { getBackendUrl } from '../../lib/config';

interface CustomUser {
  role?: string;
  email?: string;
  disabled?: boolean;
  applicationAccess?: {
    mainAdmin?: boolean;
    salesAdmin?: boolean;
    inventoryAdmin?: boolean;
    storekeeperMobile?: boolean;
    scanner?: boolean;
    scannerMobile?: boolean;
    reports?: boolean;
    poInvoice?: boolean;
    requestForms?: boolean;
    reminders?: boolean;
    notes?: boolean;
    profile?: boolean;
    appHub?: boolean;
    centralReports?: boolean;
    pythonDesktop?: boolean;
    salesmanMobile?: boolean;
    jobPortal?: boolean;
  };
  applicationRoles?: {
    mainAdmin?: string;
    salesAdmin?: string;
    inventoryAdmin?: string;
    storekeeperMobile?: string;
    scanner?: string;
    reports?: string;
    poInvoice?: string;
    requestForms?: string;
    reminders?: string;
    notes?: string;
    profile?: string;
    appHub?: string;
    centralReports?: string;
    pythonDesktop?: string;
    salesmanMobile?: string;
    scannerMobile?: string;
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
  const [newPermissionKey, setNewPermissionKey] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
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

  const handleSetDirectPassword = async () => {
    if (!user?.email || !newDirectPassword) return;
    setSettingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not logged in');
      const idToken = await currentUser.getIdToken();
      const backendUrl = await getBackendUrl();
      
      let response;
      try {
        response = await fetch(`${backendUrl}/api/admin/set-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            target_email: user.email,
            new_password: newDirectPassword
          })
        });
      } catch (networkError) {
        // Backend is unreachable
        console.warn('Backend API unreachable, falling back to password reset email');
        throw new Error('Backend service is unavailable. Please use "Send Password Reset Email" instead.');
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Password update service is not available. Please use "Send Password Reset Email" instead.');
        }
        throw new Error(errData.detail || 'Failed to update password');
      }

      addToast('success', 'Password updated successfully via admin API.');
      setShowSetPasswordModal(false);
      setNewDirectPassword('');
    } catch (err: any) {
      console.error('Error setting direct password:', err);
      addToast('error', err.message || 'Unable to update password.');
    } finally {
      setSettingPassword(false);
    }
  };


  
  const handleForcePasswordChange = async () => {
    if (!user) return;
    try {
      await update(ref(database, `users/${userKey}`), { forcePasswordChange: true });
      setUser({ ...user, forcePasswordChange: true });
      addToast('success', 'User will be required to change password on next login.');
    } catch(err) {
      addToast('error', 'Unable to update password policy.');
    }
  };


  
  const handleLockAccount = async () => {
    if (!user) return;
    if (isSystemAdmin && user.email === currentUserEmail) {
      addToast('error', 'System Admin cannot lock themselves.');
      return;
    }
    try {
      // Update database - AuthContext listener will handle logout
      await update(ref(database, `users/${userKey}`), { locked: true });
      setUser({ ...user, locked: true });
      addToast('success', 'User account locked successfully. They will be logged out on next session refresh.');
    } catch(err) {
      console.error('Error locking account:', err);
      addToast('error', 'Unable to lock account.');
    }
  };

  const handleUnlockAccount = async () => {
    if (!user) return;
    try {
      await update(ref(database, `users/${userKey}`), { locked: false });
      setUser({ ...user, locked: false });
      addToast('success', 'User account unlocked successfully.');
    } catch(err) {
      console.error('Error unlocking account:', err);
      addToast('error', 'Unable to unlock account.');
    }
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

  const handleToggleAppAccess = async (app: string) => {
    if (!user) return;
    
    // Prevent System Admin from removing their own access
    if (isSystemAdmin && user.email === currentUserEmail && app === 'mainAdmin') {
      addToast('error', 'System Admin cannot remove their own Main Admin access.');
      return;
    }
    
    const currentAccess = user.applicationAccess || {};
    const newAccess = {
      ...currentAccess,
      [app]: !currentAccess[app as keyof typeof currentAccess]
    };
    
    setUser({
      ...user,
      applicationAccess: newAccess
    });
    
    // Auto-save to database
    try {
      await update(ref(database, `users/${userKey}`), { applicationAccess: newAccess });
      addToast('success', `Application access updated successfully.`);
    } catch (err) {
      console.error('Error updating application access:', err);
      addToast('error', 'Failed to save application access changes.');
      // Revert local state on error
      setUser({
        ...user,
        applicationAccess: currentAccess
      });
    }
  };

  
  const handleDisableUser = async () => {
    if (!user) return;
    
    // Prevent System Admin from disabling themselves
    if (isSystemAdmin && user.email === currentUserEmail && !user.disabled) {
      addToast('error', 'System Admin cannot disable themselves.');
      setShowDisableModal(false);
      return;
    }
    
    const isDisabling = !user.disabled;
    
    try {
      // First, update the database
      await update(ref(database, `users/${userKey}`), { disabled: isDisabling });
      setUser({ ...user, disabled: isDisabling });
      
      // Try to call backend API to disable Firebase Auth (optional)
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          const backendUrl = await getBackendUrl();
          await fetch(`${backendUrl}/api/admin/disable-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              target_email: user.email,
              disabled: isDisabling
            })
          });
        }
      } catch (backendError) {
        // Backend is optional - database update is sufficient
        console.warn('Backend API unreachable for disable user, database update succeeded');
      }

      addToast('success', isDisabling ? 'User disabled successfully. They will be logged out on next session refresh.' : 'User enabled successfully.');
      setShowDisableModal(false);
    } catch (err) {
      console.error('Error toggling user status:', err);
      addToast('error', 'Unable to update user status.');
      setShowDisableModal(false);
    }
  };


  const handleDeleteUser = async () => {
    if (!user) return;
    if (isSystemAdmin && user.email === currentUserEmail) {
      addToast('error', 'System Admin cannot delete themselves.');
      setShowDeleteModal(false);
      return;
    }
    
    try {
      const dbRef = ref(database, `users/${userKey}`);
      await update(dbRef, { deleted: true, disabled: true, role: 'deleted' });
      addToast('success', 'User profile deleted successfully. (Note: Firebase Auth deletion must be handled manually from Firebase Console).');
      setShowDeleteModal(false);
      onBack();
    } catch (err) {
      console.error('Error deleting user:', err);
      addToast('error', 'Unable to delete user.');
      setShowDeleteModal(false);
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
                  onClick={() => setShowDisableModal(true)}
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
                <p className="text-slate-600">Fine-grained permissions for each enabled application.</p>
                {Object.entries(user.permissions || {}).map(([perm, value]) => {
                  // Only show permissions for enabled applications
                  const appKey = perm.includes('sales') ? 'salesAdmin' : 
                                 perm.includes('inventory') ? 'inventoryAdmin' : 
                                 perm.includes('scanner') ? 'scanner' : 
                                 perm.includes('report') ? 'reports' : null;
                  
                  if (appKey && !user.applicationAccess?.[appKey]) {
                    return null;
                  }
                  
                  return (
                    <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <span className="font-medium text-slate-900 capitalize">{perm.replace(/_/g, ' ')}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {value ? 'Granted' : 'Denied'}
                      </span>
                    </div>
                  );
                })}
                {Object.keys(user.permissions || {}).length === 0 && (
                  <p className="text-slate-500 text-sm italic">No permissions configured. Enable applications first to see their permissions.</p>
                )}
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
                    onClick={() => setShowSetPasswordModal(true)}
                    className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                  >
                    <Lock className="w-6 h-6 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-900">Set Password Directly</p>
                    <p className="text-sm text-slate-500">Instantly change the user's password (requires API)</p>
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
                    onClick={() => setShowDisableModal(true)}
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
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User Account</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this user? This action cannot be undone. Firebase Auth record will need to be deleted manually.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{user.disabled ? 'Enable User Account' : 'Disable User Account'}</h3>
            <p className="text-slate-600 mb-6">{user.disabled ? 'Are you sure you want to enable this user?' : 'Are you sure you want to disable this user? They will not be able to log in.'}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDisableModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableUser}
                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${user.disabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {user.disabled ? 'Yes, Enable' : 'Yes, Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showSetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Set New Password</h3>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
              <input
                type="text"
                value={newDirectPassword}
                onChange={(e) => setNewDirectPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="Enter new password"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSetPasswordModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                disabled={settingPassword}
              >
                Cancel
              </button>
              <button
                onClick={handleSetDirectPassword}
                disabled={settingPassword || !newDirectPassword}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {settingPassword ? 'Saving...' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}
</div>
    </div>
  );
}
