import { useState, useEffect, Suspense, lazy } from 'react';
import { AIAssistant } from './components/ui/AIAssistant';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/ToastNotification';

import './services/workflow/WorkflowEngine';
import './services/inventory';
import './services/ledger';
import './services/sales';
import './services/audit';
import './services/notifications';

import { auth, signInUser, registerUser, logoutUser, database } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import type { User } from 'firebase/auth';
import { LogOut, ShieldAlert, Menu, X, Sun, Moon, Lock } from 'lucide-react';
import { getApplicationsForUser, APPLICATIONS } from './config/ApplicationRegistry';
import { SalesmanAdminProvider } from './pages/salesman-admin/SalesmanAdminContext';
import { AccessDenied } from './components/AccessDenied';
const ReportGenerator = lazy(() => import('./pages/ReportGenerator'));
const POProcessor = lazy(() => import('./pages/POProcessor'));
const RequestForms = lazy(() => import('./pages/RequestForms'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Notes = lazy(() => import('./pages/Notes'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminDashboard = lazy(() => import('./components/dashboards/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const ScannerTracking = lazy(() => import('./pages/ScannerTracking'));
const SalesmanAdmin = lazy(() => import('./pages/SalesmanAdmin_V1'));
const SalesmanMobileApp = lazy(() => import('./pages/SalesmanMobileApp_V2'));
const AppHub = lazy(() => import('./pages/AppHub'));
const CentralReportsHub = lazy(() => import('./pages/CentralReportsHub'));
const InventoryAppNew = lazy(() => import('./inventory/InventoryApp'));
const InventoryAppV1 = lazy(() => import('./inventory/InventoryApp_V1'));
const InventoryMobileRoute = lazy(() => import('./inventory/InventoryMobileRoute'));


const PageLoader = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[400px]">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
      <div className="text-slate-500 font-medium">Loading Module...</div>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [applicationAccess, setApplicationAccess] = useState<any>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>('storekeeper');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  
  // Isolated states for files so they persist inside each tab without leaking
  const [reportsFile, setReportsFile] = useState<File | null>(null);
  const [invoicesFile, setInvoicesFile] = useState<File | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('app_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_dark_mode', 'false');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser?.email) {
        const userKey = currentUser.email.toLowerCase().replace(/[.#$\[\]]/g, '_');
        onValue(ref(database, `users/${userKey}`), (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserProfile(data);
            setUserRole(data.role || 'storekeeper');
            
            // Use applicationAccess for determining app access
            const appAccess = data.applicationAccess || {};
            setApplicationAccess(appAccess);
            
            // SYSTEM ADMIN PROTECTION: System Admin (role: 'system_admin') always has full access
            // This cannot be overridden by applicationAccess, roles, or permissions
            const isSystemAdmin = data.role === 'system_admin' || data.email?.toLowerCase().includes('admin@');
            
            // FAIL-SAFE RECOVERY: Designated administrator account always gets Main Admin access
            // This prevents permanent lockout if System Admin configuration is lost
            const isDesignatedAdmin = data.email?.toLowerCase() === 'sardarrashid121@gmail.com';
            setIsSystemAdmin(isSystemAdmin || isDesignatedAdmin);
            
            if (isSystemAdmin || isDesignatedAdmin) {
              setPermissions({
                main_dashboard: true,
                reports: true, 
                invoices: true, 
                request_forms: true, 
                reminders: true, 
                notes: true, 
                profile: true,
                app_hub: true,
                scanner_tracking: true, 
                salesman_admin: true, 
                inventory_app: true,
                central_reports: true,
                admin: true
              });
              const isInventoryMobile = window.location.pathname === '/inventory-mobile' || window.location.search.includes('inventory_mobile') || window.location.hostname.includes('automation-suit-inventory.web.app');
              if (isInventoryMobile) {
                setActiveTab('inventory_app');
              } else if (!activeTab) {
                setActiveTab('admin');
              }
            } else if (data.role === 'it_admin' || data.role === 'admin') {
              // IT Admin overrides all permissions
              setPermissions({
                main_dashboard: true,
                reports: true, 
                invoices: true, 
                request_forms: true, 
                reminders: true, 
                notes: true, 
                profile: true,
                app_hub: true,
                scanner_tracking: true, 
                salesman_admin: true, 
                inventory_app: true,
                central_reports: true,
                admin: true
              });
              const isInventoryMobile = window.location.pathname === '/inventory-mobile' || window.location.search.includes('inventory_mobile') || window.location.hostname.includes('automation-suit-inventory.web.app');
              if (isInventoryMobile) {
                setActiveTab('inventory_app');
              } else if (!activeTab) {
                setActiveTab('main_dashboard');
              }
            } else {
              // Build permissions based on applicationAccess using Application Registry
              const combinedPermissions: Record<string, boolean> = {};
              
              // Map applicationAccess to permissions using Application Registry
              APPLICATIONS.forEach(app => {
                if (appAccess[app.applicationAccessKey]) {
                  combinedPermissions[app.route] = true;
                }
              });
              
              // Special case: salesAdmin also grants central_reports
              if (appAccess.salesAdmin) {
                combinedPermissions.central_reports = true;
              }
              
              // Special case: extensions grants productivity apps
              if (appAccess.extensions) {
                combinedPermissions.request_forms = true;
                combinedPermissions.reminders = true;
                combinedPermissions.notes = true;
                combinedPermissions.profile = true;
              }
              
              // Always show app_hub if user has any application access
              if (Object.keys(appAccess).length > 0) {
                combinedPermissions.app_hub = true;
              }
              
              // Add internal permissions from data.permissions if they exist
              if (data.permissions) {
                Object.keys(data.permissions).forEach(key => {
                  combinedPermissions[key] = data.permissions[key];
                });
              }
              
              setPermissions(combinedPermissions);

              const isInventoryMobile = window.location.pathname === '/inventory-mobile' || window.location.search.includes('inventory_mobile') || window.location.hostname.includes('automation-suit-inventory.web.app');
              if (isInventoryMobile && combinedPermissions.inventory_app) {
                setActiveTab('inventory_app');
              } else if (Object.keys(combinedPermissions).length > 0) {
                if (!combinedPermissions[activeTab]) {
                  const firstAllowed = Object.keys(combinedPermissions).find(k => combinedPermissions[k] === true);
                  if (firstAllowed) setActiveTab(firstAllowed);
                  else setActiveTab('');
                }
              } else {
                setActiveTab('');
              }
            }
          } else {
            setApplicationAccess({});
            setPermissions({});
            setActiveTab('');
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const trimmedEmail = email.trim();
      if (isSignUp) {
        await registerUser(trimmedEmail, password);
        const userKey = trimmedEmail.toLowerCase().replace(/[.#$\[\]]/g, '_');
        try {
          await set(ref(database, `users/${userKey}`), {
            email: trimmedEmail.toLowerCase(),
            role: 'pending',
            permissions: {}
          });
        } catch (dbErr: any) {
          console.error("Database error during signup:", dbErr);
          alert("Login successful, but failed to save profile. " + dbErr.message);
        }
      } else {
        await signInUser(trimmedEmail, password);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Clear all local state
      setEmail('');
      setPassword('');
      setLoginError('');
      setUser(null);
      setUserProfile(null);
      setUserRole('');
      setApplicationAccess({});
      setPermissions({
        main_dashboard: false,
        reports: false,
        invoices: false,
        request_forms: false,
        reminders: false,
        notes: false,
        profile: false,
        app_hub: false,
        scanner_tracking: false,
        salesman_admin: false,
        inventory_app: false,
        central_reports: false,
        admin: false
      });
      setActiveTab('app_hub');
      // Clear all localStorage items related to user session
      localStorage.removeItem('inventory_profile_v2');
      localStorage.removeItem('inventory_dest_profile');
      localStorage.removeItem('inventory_po_profile');
      localStorage.removeItem('inventoryLogin');
      // Clear any other cached user data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_') || key.startsWith('auth_') || key.startsWith('session_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Serve InventoryApp_V1 standalone for /inventory-mobile — must be inside App()
  // so all React hooks/contexts (lucide, etc.) share the same module instance.
  // InventoryApp_V1 has its own PIN login, no Firebase Auth needed.
  const isInventoryMobilePath = window.location.pathname === '/inventory-mobile' ||
      new URLSearchParams(window.location.search).get('app') === 'inventory_mobile' ||
      window.location.hostname.includes('automation-suit-inventory.web.app');
  

  if (!user) {

    return (
      <ToastProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Suite</h1>
            <p className="text-slate-500 mt-2">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              />
            </div>
            
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-green-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-800 focus:ring-4 focus:ring-green-200 transition-all duration-200"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
            
            <div className="text-center mt-4 text-sm text-slate-600">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-700 hover:underline font-semibold"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
        </ThemeProvider>
      </ToastProvider>
    );
  }

  const isInventoryMobile = window.location.pathname === '/inventory-mobile' || window.location.search.includes('inventory_mobile') || window.location.hostname.includes('automation-suit-inventory.web.app');

  if (isInventoryMobile && activeTab === 'inventory_app' && user) {
    return <Suspense fallback={<PageLoader />}><InventoryMobileRoute currentUser={{ id: user.uid, name: userProfile?.name || user.email?.split('@')[0] || 'User', email: user.email || '', role: userRole as any, pin: '0000', assignedStoreRooms: userProfile?.assignedStoreRooms || [], assignedSection: userProfile?.assignedSection || 'All', assignedStoreNum: userProfile?.assignedStoreNum || 'All', assignedLocation: userProfile?.assignedLocation || 'All' }} onLogout={handleLogout} /></Suspense>;
  }

  return (
    <ToastProvider>
      <ThemeProvider>
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans relative overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative ${isSidebarOpen ? 'md:translate-x-0 md:flex w-64' : 'md:hidden w-0'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-all duration-200 ease-in-out print:hidden`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Suite</h1>
              <p className="text-xs font-medium text-green-700 dark:text-green-500 uppercase tracking-wider">Administration</p>
            </div>
          </div>
          <button 
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {(() => {
            const userApps = getApplicationsForUser(applicationAccess, isSystemAdmin);
            return userApps.map((app) => (
              <button
                key={app.id}
                onClick={() => app.externalUrl ? window.open(app.externalUrl, '_blank') : setActiveTab(app.route)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === app.route 
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <app.icon className={`w-5 h-5 mr-3 ${activeTab === app.route ? 'text-green-700' : 'text-slate-400'}`} />
                {app.displayName}
              </button>
            ));
          })()}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center mb-4 px-2 justify-between">
            <div className="flex items-center truncate">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm shrink-0">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shrink-0"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block print:h-auto">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 sm:px-8 z-0 print:hidden shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title={isSidebarOpen ? "Collapse Menu" : "Expand Menu"}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex-1 truncate">
            {activeTab === 'main_dashboard' && 'Business Dashboard'}
            {activeTab === 'reports' && 'Generate Report Engine'}
            {activeTab === 'invoices' && 'Process POs & Invoices'}
            {activeTab === 'request_forms' && 'Create Request Forms'}
            {activeTab === 'reminders' && 'Task Reminders'}
            {activeTab === 'notes' && 'Important Notes'}
            {activeTab === 'profile' && 'Profile Settings'}
            {activeTab === 'app_hub' && 'Apps & Extensions'}
            {activeTab === 'scanner_tracking' && 'Scanner Tracking'}
            {activeTab === 'salesman_admin' && 'Salesman Admin'}
            {activeTab === 'central_reports' && 'Central Reports'}
            {activeTab === 'admin' && 'Admin Panel'}
          </h2>
        </header>
        
        <main className={`flex-1 overflow-y-auto ${['admin', 'salesman_admin', 'central_reports', 'inventory_app', 'scanner_tracking'].includes(activeTab) ? 'p-0' : 'p-4 sm:p-8'} bg-slate-50/50 print:p-0 print:overflow-visible print:bg-white print:block print:h-auto relative z-0`}>
          <div className={`${['admin', 'salesman_admin', 'central_reports', 'inventory_app', 'scanner_tracking'].includes(activeTab) ? 'w-full h-full' : 'max-w-6xl mx-auto'} print:max-w-none print:mx-0`}>
            {(Object.keys(applicationAccess).length === 0 && Object.keys(permissions).length === 0) && (userRole !== 'it_admin' && userRole !== 'admin' && userRole !== 'system_admin') ? (
              <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                  <div className="bg-amber-100 text-amber-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                  <p className="text-slate-500 mb-6">Your account does not have Web App access, or is waiting for administrator approval.</p>
                  <p className="text-sm font-medium text-slate-400">Please contact the system administrator.</p>
                </div>
              </div>
            ) : (
              <>
                <Suspense fallback={<PageLoader />}>
                  {activeTab === 'main_dashboard' && (userRole === 'it_admin' || userRole === 'app' || userRole === 'admin') ? (
                    <AdminDashboard />
                  ) : activeTab === 'main_dashboard' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'reports' && permissions.reports ? (
                    <ReportGenerator sharedActionFile={reportsFile} setSharedActionFile={setReportsFile} />
                  ) : activeTab === 'reports' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'invoices' && permissions.invoices ? (
                    <POProcessor sharedActionFile={invoicesFile} setSharedActionFile={setInvoicesFile} />
                  ) : activeTab === 'invoices' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'request_forms' && permissions.request_forms ? (
                    <RequestForms />
                  ) : activeTab === 'request_forms' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'reminders' && permissions.reminders ? (
                    <Reminders />
                  ) : activeTab === 'reminders' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'notes' && permissions.notes ? (
                    <Notes />
                  ) : activeTab === 'notes' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'profile' && permissions.profile ? (
                    <ProfileSettings />
                  ) : activeTab === 'profile' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'app_hub' && permissions.app_hub ? (
                    <AppHub onNavigate={setActiveTab} />
                  ) : activeTab === 'app_hub' ? (
                    <AccessDenied onReturn={() => setActiveTab('')} />
                  ) : null}
                  
                  {activeTab === 'scanner_tracking' && permissions.scanner_tracking ? (
                    <ScannerTracking />
                  ) : activeTab === 'scanner_tracking' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'salesman_admin' && permissions.salesman_admin ? (
                    userProfile?.role === 'pending' || userRole === 'SALESPERSON' 
                      ? <SalesmanMobileApp onBack={() => setActiveTab('app_hub')} /> 
                      : <SalesmanAdmin />
                  ) : activeTab === 'salesman_admin' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'central_reports' && permissions.salesman_admin ? (
                    <SalesmanAdminProvider>
                      <CentralReportsHub />
                    </SalesmanAdminProvider>
                  ) : activeTab === 'central_reports' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}

                  {activeTab === 'salesman_mobile' && permissions.salesman_admin ? (
                    <SalesmanMobileApp onBack={() => setActiveTab('app_hub')} />
                  ) : activeTab === 'salesman_mobile' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}

                  {activeTab === 'inventory_app' && permissions.inventory_app ? (
                    userRole === 'storekeeper' ? <Suspense fallback={<PageLoader />}><InventoryMobileRoute currentUser={{ id: user?.uid || '', name: userProfile?.name || user?.email?.split('@')[0] || 'User', email: user?.email || '', role: userRole as any, pin: '0000', assignedStoreRooms: userProfile?.assignedStoreRooms || [], assignedSection: userProfile?.assignedSection || 'All', assignedStoreNum: userProfile?.assignedStoreNum || 'All', assignedLocation: userProfile?.assignedLocation || 'All' }} onLogout={handleLogout} /></Suspense> : <InventoryAppNew currentUser={{ id: user?.uid || '', name: userProfile?.name || user?.email?.split('@')[0] || 'User', email: user?.email || '', role: userRole as any, pin: '0000', assignedStoreRooms: userProfile?.assignedStoreRooms || [], assignedSection: userProfile?.assignedSection || 'All', assignedStoreNum: userProfile?.assignedStoreNum || 'All', assignedLocation: userProfile?.assignedLocation || 'All' }} onLogout={handleLogout} />
                  ) : activeTab === 'inventory_app' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'admin' && (userRole === 'it_admin' || userRole === 'admin' || userRole === 'system_admin') ? (
                    <AdminPanel />
                  ) : activeTab === 'admin' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                </Suspense>
              </>
            )}
          </div>
        </main>
      </div>
        <AIAssistant context="management" />
    </div>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;





