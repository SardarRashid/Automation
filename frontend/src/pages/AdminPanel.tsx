import React, { useState, useEffect } from 'react';
import { database, auth } from '../lib/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';
import { getBackendUrl } from '../lib/config';
import UserManagement from './admin/UserManagement';
import SystemSettings from './admin/SystemSettings';
import AuditLog from './admin/AuditLog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/ToastNotification';
import { 
  LayoutDashboard, Users, ShieldAlert, Key, Clock, AppWindow, 
  Puzzle, Activity, Settings, Bell, X, UserPlus, 
  MoreVertical, CheckCircle2, Smartphone, 
  Monitor, Printer, SearchCode, Search as SearchIcon
} from 'lucide-react';

interface CustomUser {
  password?: string;
  role?: string;
  allowedApps?: {
    desktop?: boolean;
    app?: boolean;
    scanner?: boolean;
    scanner_admin?: boolean;
    salesman?: boolean;
    extension?: boolean;
  };
  email?: string;
  permissions?: {
    reports?: boolean;
    invoices?: boolean;
    request_forms?: boolean;
    reminders?: boolean;
    notes?: boolean;
    profile?: boolean;
    inventory_admin?: boolean;
    inventory_mobile?: boolean;
    app_hub?: boolean;
    scanner_tracking?: boolean;
    salesman_admin?: boolean;
  };
}

type AdminView = 'dashboard' | 'users' | 'roles' | 'permissions' | 'pending' | 'apps' | 'extensions' | 'logs' | 'settings';

export interface SystemApp {
  name: string;
  type: string;
  active: boolean;
}

export interface SystemExtension {
  name: string;
  active: boolean;
}

export interface SystemRole {
  name: string;
  description: string;
}

export interface SystemPermission {
  name: string;
  description: string;
}

export default function AdminPanel() {
  const { user: authUser, isSystemAdmin } = useAuth();
  const [users, setUsers] = useState<Record<string, CustomUser>>({});
  
  // System States
  const [systemApps, setSystemApps] = useState<Record<string, SystemApp>>({});
  const [systemExtensions, setSystemExtensions] = useState<Record<string, SystemExtension>>({});
  const [systemRoles, setSystemRoles] = useState<Record<string, SystemRole>>({});
  const [systemPermissions, setSystemPermissions] = useState<Record<string, SystemPermission>>({});

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserKey, setSelectedUserKey] = useState<string | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [slideoverTab, setSlideoverTab] = useState<'overview' | 'apps' | 'roles' | 'activity'>('apps');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [stagedChanges, setStagedChanges] = useState<Record<string, CustomUser>>({});
  const { addToast } = useToast();
  
  // Modals state for system config
  const [isAddSystemModalOpen, setIsAddSystemModalOpen] = useState<{type: 'app' | 'extension' | 'role' | 'permission', open: boolean}>({type: 'app', open: false});
  const [newSystemItem, setNewSystemItem] = useState({ key: '', name: '', type: 'Web', description: '' });

  // Filter State
  const [filterApp, setFilterApp] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Add User State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState('scanner');

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const appsRef = ref(database, 'system/apps');
    const extRef = ref(database, 'system/extensions');
    const rolesRef = ref(database, 'system/roles');
    const permsRef = ref(database, 'system/permissions');

    const unsubUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val() || {});
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    const unsubApps = onValue(appsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultApps: Record<string, any> = {
        'scanner': { name: 'Scanner App', type: 'Mobile', active: true },
        'scanner_admin': { name: 'Scanner Admin', type: 'Web', active: true },
        'salesman': { name: 'Salesman App', type: 'Mobile', active: true },
        'salesman_admin': { name: 'Sales Admin', type: 'Web', active: true },
        'inventory': { name: 'Inventory App', type: 'Web', active: true },
        'inventory_admin': { name: 'Inventory Admin', type: 'Web', active: true },
        'app': { name: 'Inventory App (Legacy)', type: 'Web', active: true },
        'desktop': { name: 'Desktop Python App', type: 'Web', active: true }
      };
      
      const mergedApps = { ...defaultApps };
      Object.keys(data).forEach(key => {
        mergedApps[key] = { ...(defaultApps[key] || {}), ...data[key] };
      });
      setSystemApps(mergedApps);
    });

    const unsubExt = onValue(extRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultExt: Record<string, any> = {
        'sticker': { name: 'Sticker Printer', active: true },
        'scraper': { name: 'Loginext Scraper', active: false },
        'extension': { name: 'Generic Extension', active: true }
      };
      const mergedExt = { ...defaultExt };
      Object.keys(data).forEach(key => {
        mergedExt[key] = { ...(defaultExt[key] || {}), ...data[key] };
      });
      setSystemExtensions(mergedExt);
    });

    const unsubRoles = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultRoles: Record<string, any> = {
        'scanner': { name: 'Storekeeper / Scanner', description: 'Mobile app access for scanning barcodes.' },
        'salesman': { name: 'Salesman', description: 'Sales mobile app access.' },
        'manager': { name: 'App / Manager', description: 'Inventory desktop app access with advanced management.' },
        'admin': { name: 'IT Admin', description: 'Super admin access to all apps.' },
        'extension': { name: 'Sticker Printer Extension', description: 'Access for sticker printing extension' }
      };
      const mergedRoles = { ...defaultRoles };
      Object.keys(data).forEach(key => {
        mergedRoles[key] = { ...(defaultRoles[key] || {}), ...data[key] };
      });
      setSystemRoles(mergedRoles);
    });

    const unsubPerms = onValue(permsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultPerms: Record<string, any> = {
        'reports': { name: 'reports', description: 'Can view sale reports.' },
        'invoices': { name: 'invoices', description: 'Can process POs and invoices.' },
        'request_forms': { name: 'request_forms', description: 'Can create and manage request forms.' },
        'reminders': { name: 'reminders', description: 'Can create system reminders.' },
        'inventory_admin': { name: 'inventory_admin', description: 'Can administrate the inventory app.' },
        'salesman_admin': { name: 'salesman_admin', description: 'Can manage salesmen.' }
      };
      const mergedPerms = { ...defaultPerms };
      Object.keys(data).forEach(key => {
        mergedPerms[key] = { ...(defaultPerms[key] || {}), ...data[key] };
      });
      setSystemPermissions(mergedPerms);
    });

    return () => {
      unsubUsers();
      unsubApps();
      unsubExt();
      unsubRoles();
      unsubPerms();
    };
  }, []);

  const handleSaveUser = async (userKey: string, instantChanges?: any) => {
    const changes = instantChanges || stagedChanges[userKey];
    if (!changes) return;
    try {
      await update(ref(database, `users/${userKey}`), changes);
      
      // Support for Barcode Sticker Printer Extension's comma-formatted keys
      if (changes.allowedApps?.extension && changes.email) {
        const extensionKey = changes.email.toLowerCase().replace(/\./g, ',');
        if (extensionKey !== userKey) {
          await update(ref(database, `users/${extensionKey}`), changes).catch(console.error);
        }
      }
      setStagedChanges(prev => {
        const next = { ...prev };
        delete next[userKey];
        return next;
      });
      if (!instantChanges) addToast('success', 'Changes saved successfully!');
    } catch (err: any) {
      addToast('error', 'Error saving user: ' + err.message);
    }
  };

  const handleInstantRoleChange = async (userKey: string, newRole: string) => {
    const user = users[userKey];
    if (!user) return;
    
    const newAllowedApps: Record<string, boolean> = {};
    const ALL_APPS = ['desktop', 'app', 'scanner', 'scanner_admin', 'salesman', 'extension', 'jobPortal'];
    ALL_APPS.forEach(appKey => {
      newAllowedApps[appKey] = (newRole === 'admin' || appKey === newRole || (newRole === 'manager' && appKey === 'app'));
    });

    const newPermissions: Record<string, boolean> = {};
    if (newRole === 'manager' || newRole === 'admin') {
      newPermissions.salesman_admin = true;
      newPermissions.reports = true;
      newPermissions.invoices = true;
      newPermissions.request_forms = true;
      newPermissions.inventory_app = true;
      if (newRole === 'admin') {
        newPermissions.notes = true;
        newPermissions.reminders = true;
        newPermissions.profile = true;
        newPermissions.scanner_tracking = true;
        newPermissions.app_hub = true;
        newPermissions.inventory_admin = true;
      }
    }

    const updatedUser = {
      ...user,
      role: newRole === 'manager' ? 'app' : newRole,
      allowedApps: newAllowedApps,
      permissions: newPermissions
    };

    // Staged for UI instantly
    handleLocalChange(userKey, updatedUser);
    
    // Push to database instantly
    await handleSaveUser(userKey, updatedUser);
    addToast('success', 'User role updated and permissions adjusted automatically.');
  };

  const handleLocalChange = (userKey: string, newUserData: CustomUser) => {
    setStagedChanges(prev => ({ ...prev, [userKey]: newUserData }));
  };

  const toggleAppAccess = (userKey: string, user: CustomUser, appKey: keyof NonNullable<CustomUser['allowedApps']>) => {
    const changes = stagedChanges[userKey] || user;
    const currentApps = changes.allowedApps || {};
    handleLocalChange(userKey, {
      ...changes,
      allowedApps: {
        ...currentApps,
        [appKey]: !currentApps[appKey]
      }
    });
  };

  const togglePermission = (userKey: string, user: CustomUser, permKey: keyof NonNullable<CustomUser['permissions']>) => {
    const changes = stagedChanges[userKey] || user;
    const currentPerms = changes.permissions || {};
    handleLocalChange(userKey, {
      ...changes,
      permissions: {
        ...currentPerms,
        [permKey]: !currentPerms[permKey]
      }
    });
  };

  const handleAddSystemItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystemItem.key || !newSystemItem.name) return;
    
    let basePath = '';
    let dataToSave: any = { name: newSystemItem.name };
    
    if (isAddSystemModalOpen.type === 'app') {
      basePath = `system/apps/${newSystemItem.key}`;
      dataToSave = { ...dataToSave, type: newSystemItem.type, active: true };
    } else if (isAddSystemModalOpen.type === 'extension') {
      basePath = `system/extensions/${newSystemItem.key}`;
      dataToSave = { ...dataToSave, active: true };
    } else if (isAddSystemModalOpen.type === 'role') {
      basePath = `system/roles/${newSystemItem.key}`;
      dataToSave = { ...dataToSave, description: newSystemItem.description };
    } else if (isAddSystemModalOpen.type === 'permission') {
      basePath = `system/permissions/${newSystemItem.key}`;
      dataToSave = { ...dataToSave, description: newSystemItem.description };
    }

    try {
      await set(ref(database, basePath), dataToSave);
      setIsAddSystemModalOpen({ type: 'app', open: false });
      setNewSystemItem({ key: '', name: '', type: 'Web', description: '' });
      addToast('success', `${isAddSystemModalOpen.type} added successfully!`);
    } catch (err: any) {
      addToast('error', `Error adding ${isAddSystemModalOpen.type}: ` + err.message);
    }
  };

  const handleToggleSystemItem = async (type: 'apps' | 'extensions', key: string, currentStatus: boolean) => {
    try {
      await update(ref(database, `system/${type}/${key}`), { active: !currentStatus });
      addToast('success', `${type.slice(0, -1)} toggled successfully.`);
    } catch (err: any) {
      addToast('error', `Error toggling ${type}: ` + err.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPass) {
      addToast('error', 'Please fill in all required fields');
      return;
    }
    
    const userKey = newUserEmail.toLowerCase().replace(/[.#$\[\]]/g, '_');
    
    try {
      let createdUid = null;
      let alreadyExisted = false;

      // Try backend API first
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Not logged in');
        const idToken = await currentUser.getIdToken();
        const backendUrl = await getBackendUrl();

        const res = await fetch(`${backendUrl}/api/admin/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ email: newUserEmail, password: newUserPass })
        });

        if (res.ok) {
          const createdData = await res.json();
          createdUid = createdData.uid;
          alreadyExisted = createdData.already_existed || false;
        } else if (res.status === 404) {
          throw new Error('Backend service unavailable');
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to create user in Firebase Auth');
        }
      } catch (backendError) {
        // Backend unavailable - fallback to client-side Firebase Auth
        console.warn('Backend API unreachable, falling back to client-side Firebase Auth');
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPass);
          createdUid = userCredential.user.uid;
          
          // Sign out the newly created user so admin stays logged in
          await signOut(auth);
          
          // Sign admin back in
          const adminEmail = auth.currentUser?.email;
          // Note: We can't automatically sign back in without password
          // This is a limitation of client-side user creation
          addToast('warning', 'User created via client-side. You may need to re-login to continue admin operations.');
        } catch (firebaseError: any) {
          if (firebaseError.code === 'auth/email-already-in-use') {
            // User already exists in Firebase Auth, just create profile
            addToast('info', 'User already exists in Firebase Auth. Creating profile only.');
            alreadyExisted = true;
          } else {
            throw new Error(firebaseError.message || 'Failed to create user in Firebase Auth');
          }
        }
      }

      // Use modern applicationAccess structure from ApplicationRegistry
      const { getDefaultApplicationAccess } = await import('../config/ApplicationRegistry');
      const defaultAccess = getDefaultApplicationAccess();
      
      const newApplicationAccess: Record<string, boolean> = { ...defaultAccess };
      
      // Map role to application access (using cleaned ApplicationRegistry keys)
      if (newUserRole === 'admin') {
        newApplicationAccess.mainAdmin = true;
        newApplicationAccess.salesAdmin = true;
        newApplicationAccess.inventoryAdmin = true;
        newApplicationAccess.scanner = true;
        newApplicationAccess.reports = true;
        newApplicationAccess.poInvoice = true;
        newApplicationAccess.requestForms = true;
        newApplicationAccess.reminders = true;
        newApplicationAccess.notes = true;
        newApplicationAccess.profile = true;
        newApplicationAccess.appHub = true;
        newApplicationAccess.pythonDesktop = true;
      } else if (newUserRole === 'manager' || newUserRole === 'app') {
        newApplicationAccess.salesAdmin = true;
        newApplicationAccess.inventoryAdmin = true;
        newApplicationAccess.reports = true;
      } else if (newUserRole === 'scanner' || newUserRole === 'scanner_admin') {
        newApplicationAccess.scanner = true;
      } else if (newUserRole === 'salesman') {
        newApplicationAccess.salesmanMobile = true;
      } else if (newUserRole === 'storekeeper') {
        newApplicationAccess.inventoryAdmin = true;
        newApplicationAccess.storekeeperMobile = true;
      }
      
      const userData = {
        email: newUserEmail,
        role: newUserRole === 'manager' ? 'app' : newUserRole,
        applicationAccess: newApplicationAccess,
        applicationRoles: {},
        permissions: {},
        disabled: false,
        locked: false,
        createdAt: new Date().toISOString()
      };

      await set(ref(database, `users/${userKey}`), userData);
      
      // Store uid_mappings so Firebase rules can resolve auth.uid → userKey
      if (createdUid) {
        await set(ref(database, `uid_mappings/${createdUid}`), userKey);
      }
      
      setNewUserEmail('');
      setNewUserPass('');
      setNewUserRole('scanner');
      setIsAddUserModalOpen(false);
      addToast('success', alreadyExisted ? 'User already existed in Auth — profile updated successfully.' : 'User created successfully!');
    } catch (err: any) {
      console.error('Error adding user:', err);
      addToast('error', err.message || 'Unable to create user. Please try again.');
    }
  };

  const handleDeleteUser = async (userKey: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await remove(ref(database, `users/${userKey}`));
        if (selectedUserKey === userKey) setSelectedUserKey(null);
        addToast('success', 'User deleted successfully');
      } catch (err: any) {
        console.error('Error deleting user:', err);
        addToast('error', 'Unable to delete user. Please try again.');
      }
    }
  };

  // Derived Stats
  const totalUsers = Object.keys(users).length;
  const pendingUsers = Object.values(users).filter(u => u.role === 'pending').length;
  const activeUsers = totalUsers - pendingUsers;

  const filteredUsers = Object.entries(users).filter(([key, user]) => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = !searchStr || 
      (user.email?.toLowerCase().includes(searchStr) ?? false) || 
      (user.name?.toLowerCase().includes(searchStr) ?? false);
    
    let matchesRole = true;
    if (filterRole !== 'All') {
      matchesRole = user.role === filterRole;
    }

    let matchesStatus = true;
    if (filterStatus === 'Active') {
      matchesStatus = user.role !== 'pending';
    } else if (filterStatus === 'Pending') {
      matchesStatus = user.role === 'pending';
    }

    let matchesApp = true;
    if (filterApp !== 'All') {
      const appKey = filterApp.toLowerCase().replace(' ', '_');
      // special mapping for the filter values if needed, otherwise just check allowedApps
      matchesApp = !!user.allowedApps?.[appKey as keyof typeof user.allowedApps];
    }

    return matchesSearch && matchesRole && matchesStatus && matchesApp;
  });

  const selectedUser = selectedUserKey ? (stagedChanges[selectedUserKey] || users[selectedUserKey]) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-slate-50 font-sans overflow-x-auto flex-col">
      {/* Sidebar */}
      <div className="w-full bg-[#0f172a] text-slate-300 flex flex-row items-center flex-shrink-0 overflow-x-auto shadow-md z-20">
        <div className="flex items-center px-6 border-r border-slate-800 h-16 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Admin</span>
          </div>
        </div>

        <div className="flex-1 flex flex-row items-center overflow-x-auto px-4 gap-6">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <button onClick={() => setActiveView('dashboard')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
          </div>

          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <button onClick={() => { setActiveView('users'); setSelectedUserKey(null); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'users' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Users className="w-5 h-5" /> Users
            </button>
            <button onClick={() => setActiveView('roles')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'roles' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <ShieldAlert className="w-5 h-5" /> Roles
            </button>
            <button onClick={() => setActiveView('permissions')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'permissions' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Key className="w-5 h-5" /> Permissions
            </button>
            <button onClick={() => setActiveView('pending')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'pending' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Clock className="w-5 h-5" /> Pending Approvals
              {pendingUsers > 0 && <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingUsers}</span>}
            </button>
          </div>

          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <button onClick={() => setActiveView('apps')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'apps' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <AppWindow className="w-5 h-5" /> Applications
            </button>
            <button onClick={() => setActiveView('extensions')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'extensions' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Puzzle className="w-5 h-5" /> Extensions
            </button>
            
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setActiveView('logs')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'logs' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Activity className="w-5 h-5" /> Activity Logs
            </button>
            <button onClick={() => setActiveView('settings')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Settings className="w-5 h-5" /> Settings
              </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-x-auto relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' && 'Dashboard'}
              {activeView === 'users' && 'Users'}
                {activeView === 'settings' && 'Settings'}
                {activeView === 'logs' && 'Activity Logs'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                A
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-slate-700 leading-tight">Admin User</p>
                <p className="text-slate-500 text-xs">Super Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          {activeView === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Users</p>
                    <h3 className="text-3xl font-bold text-slate-800">{totalUsers}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
                    <h3 className="text-3xl font-bold text-slate-800">{pendingUsers}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Active Users</p>
                    <h3 className="text-3xl font-bold text-slate-800">{activeUsers}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Super Admins</p>
                    <h3 className="text-3xl font-bold text-slate-800">{Object.values(users).filter(u => u.role === 'admin').length}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <AppWindow className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Applications</p>
                    <h3 className="text-3xl font-bold text-slate-800">{Object.keys(systemApps).length}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                      <Puzzle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Extensions</p>
                    <h3 className="text-3xl font-bold text-slate-800">{Object.keys(systemExtensions).length}</h3>
                  </div>
                </div>
              </div>

              {/* Apps Grid */}
              <h3 className="text-lg font-bold text-slate-800">Applications Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(systemApps).map(([key, app]) => (
                  <div 
                    key={key} 
                    onClick={() => setActiveView('apps')}
                    className="bg-white p-5 rounded-xl border border-slate-200 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-3`}>
                      <AppWindow className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{app.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${app.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span> {app.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'users' && (
  selectedUserKey ? (
    <UserManagement 
      userKey={selectedUserKey} 
      onBack={() => setSelectedUserKey(null)} 
    />
  ) : (
            <div className="max-w-7xl mx-auto flex flex-col h-full pb-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-slate-500">Manage users and their access</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <select 
                      value={filterApp}
                      onChange={(e) => setFilterApp(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="All">All Applications</option>
                      <option value="jobPortal">Job Portal</option>
                        <option value="Scanner">Scanner App</option>
                      <option value="App">Inventory App</option>
                      <option value="Salesman">Salesman App</option>
                    </select>
                    <select 
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="All">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="salesman">Salesman</option>
                      <option value="scanner">Scanner</option>
                      <option value="storekeeper">Storekeeper</option>
                    </select>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
                  >
                    <UserPlus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto flex-1 relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role / Title</th>
                      <th className="px-6 py-4">Application Access</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(([key, u]) => (
                      <tr 
                        key={key} 
                        onClick={() => setSelectedUserKey(key)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedUserKey === key ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 flex-shrink-0">
                              {u.email?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{u.email?.split('@')[0] || 'Unknown User'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md capitalize">
                            {u.role || 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {u.allowedApps?.scanner && <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center" title="Scanner Mobile"><Smartphone className="w-3.5 h-3.5" /></div>}
                            {u.allowedApps?.app && <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Inventory App"><Monitor className="w-3.5 h-3.5" /></div>}
                            {u.allowedApps?.salesman && <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center" title="Salesman App"><Smartphone className="w-3.5 h-3.5" /></div>}
                            {u.allowedApps?.extension && <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center" title="Extension"><Puzzle className="w-3.5 h-3.5" /></div>}
                            {Object.keys(u.allowedApps || {}).filter(k => u.allowedApps?.[k as keyof typeof u.allowedApps]).length === 0 && (
                              <span className="text-xs text-slate-400">No Access</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex w-fit items-center gap-1.5 ${u.role === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.role === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            {u.role === 'pending' ? 'Pending' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuKey(openMenuKey === key ? null : key); 
                            }} 
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openMenuKey === key && (
                            <div 
                              className="absolute right-8 top-10 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
                              onMouseLeave={() => setOpenMenuKey(null)}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUserKey(key); setOpenMenuKey(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Edit User
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuKey(null); handleDeleteUser(key); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Delete User
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
)}

            {activeView === 'roles' && (
            <div className="max-w-7xl mx-auto flex flex-col h-full pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">System Roles</h2>
                <button 
                  onClick={() => setIsAddSystemModalOpen({ type: 'role', open: true })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Role
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Role Name</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(systemRoles).map(([key, role]) => (
                      <tr key={key} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{role.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{role.description}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'permissions' && (
            <div className="max-w-7xl mx-auto flex flex-col h-full pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">System Permissions</h2>
                <button 
                  onClick={() => setIsAddSystemModalOpen({ type: 'permission', open: true })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Permission
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Permission Key</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(systemPermissions).map(([key, perm]) => (
                      <tr key={key} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{key}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{perm.description}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'apps' && (
            <div className="max-w-7xl mx-auto flex flex-col h-full pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Manage Applications</h2>
                <button 
                  onClick={() => setIsAddSystemModalOpen({ type: 'app', open: true })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Application
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Application</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Access Type</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(systemApps).map(([key, app]) => (
                      <tr key={key} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600`}>
                              <AppWindow className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-800">{app.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleSystemItem('apps', key, app.active)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${app.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${app.active ? 'translate-x-6' : 'translate-x-1'}`}></div>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{app.type}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Settings</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'extensions' && (
            <div className="max-w-7xl mx-auto flex flex-col h-full pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Manage Extensions</h2>
                <button 
                  onClick={() => setIsAddSystemModalOpen({ type: 'extension', open: true })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Extension
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Extension</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(systemExtensions).map(([key, ext]) => (
                      <tr key={key} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600`}>
                              <Puzzle className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-800">{ext.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleSystemItem('extensions', key, ext.active)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${ext.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${ext.active ? 'translate-x-6' : 'translate-x-1'}`}></div>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Settings</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* User Slide-over Removed to prevent duplication */}
      </div>
      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-x-auto animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Add New User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email / Username</label>
                <input
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 placeholder-slate-400 transition-shadow"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 placeholder-slate-400 transition-shadow"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Initial Role Setup</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none bg-white text-slate-800 cursor-pointer"
                >
                  <option value="admin">Super Admin</option>
                  <option value="manager">Sales Manager (Preset)</option>
                  <option value="desktop">Desktop App</option>
                  <option value="app">Inventory Admin & Mobile App</option>
                  <option value="scanner">Scanner Mobile App</option>
                  <option value="scanner_admin">Scanner Admin Dashboard</option>
                  <option value="salesman">Salesman Mobile App</option>
                  <option value="extension">Sticker Printer Extension</option>
                    <option value="applicant">Job Portal Applicant</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        
        {/* System Item Modal */}
      {isAddSystemModalOpen.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-x-auto transform scale-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 capitalize">Add {isAddSystemModalOpen.type}</h3>
              <button onClick={() => setIsAddSystemModalOpen({ type: 'app', open: false })} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSystemItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Key / ID</label>
                <input 
                  type="text" 
                  value={newSystemItem.key}
                  onChange={(e) => setNewSystemItem(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow"
                  placeholder="e.g., my_app, scanner_admin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Display Name</label>
                <input 
                  type="text" 
                  value={newSystemItem.name}
                  onChange={(e) => setNewSystemItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow"
                  placeholder="e.g., Awesome App"
                  required
                />
              </div>
              
              {isAddSystemModalOpen.type === 'app' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Access Type</label>
                  <select
                    value={newSystemItem.type}
                    onChange={(e) => setNewSystemItem(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Web">Web</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Desktop">Desktop</option>
                  </select>
                </div>
              )}
              
              {(isAddSystemModalOpen.type === 'role' || isAddSystemModalOpen.type === 'permission') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                  <input 
                    type="text" 
                    value={newSystemItem.description}
                    onChange={(e) => setNewSystemItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow"
                    placeholder="Short description of this role/permission"
                    required
                  />
                </div>
              )}
              
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddSystemModalOpen({ type: 'app', open: false })} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200 capitalize">
                  Create {isAddSystemModalOpen.type}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

