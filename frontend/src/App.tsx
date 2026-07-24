import { useState, Suspense, lazy, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { getApplicationsForUser } from './config/ApplicationRegistry';
import { ToastProvider } from './components/ui/ToastNotification';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIAssistant } from './components/ui/AIAssistant';
import './services/workflow/WorkflowEngine';
import './services/inventory';
import './services/ledger';
import './services/sales';
import './services/audit';
import './services/notifications';
import { LogOut, Menu, X, Sun, Moon, ShieldAlert } from 'lucide-react';
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
const SalesmanAdmin = lazy(() => import('./pages/SalesmanAdmin'));
const SalesmanMobileApp = lazy(() => import('./pages/SalesmanMobileApp_V2'));
const AppHub = lazy(() => import('./pages/AppHub'));
const CentralReportsHub = lazy(() => import('./pages/CentralReportsHub'));
const InventoryAppNew = lazy(() => import('./inventory/InventoryApp'));
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
  const { 
    user, userProfile, userRole, permissions, applicationAccess, 
    isSystemAdmin, isRecoveryMode, loading, loginError, showForcePasswordChange,
    login, register, logout, setLoginError 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('main_dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Isolated states for files so they persist inside each tab without leaking
  const [reportsFile, setReportsFile] = useState<File | null>(null);
  const [invoicesFile, setInvoicesFile] = useState<File | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('app_dark_mode') === 'true';
  });

  useEffect(() => {
    const titles: Record<string, string> = {
      'main_dashboard': 'Business Dashboard',
      'reports': 'Report Engine',
      'invoices': 'PO & Invoices',
      'request_forms': 'Request Forms',
      'reminders': 'Reminders',
      'notes': 'Notes',
      'profile': 'Profile Settings',
      'app_hub': 'Apps & Extensions',
      'scanner_tracking': 'Scanner Tracking',
      'salesman_admin': 'Sales Admin',
      'central_reports': 'Central Reports',
      'salesman_mobile': 'Salesman App',
      'inventory_app': 'Inventory App',
      'admin': 'Admin Panel'
    };
    document.title = titles[activeTab] || 'Inventory Suite';
  }, [activeTab]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('app_dark_mode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const trimmedEmail = email.trim();
      if (isSignUp) {
        await register(trimmedEmail, password);
      } else {
        await login(trimmedEmail, password);
      }
    } catch (err: any) {
      // error is handled by context, but we can catch it here if we want to log it
    }
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('app_hub');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
                    className="text-green-700 font-semibold hover:underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ThemeProvider>
      </ToastProvider>
    );
  }

  // FORCE PASSWORD CHANGE VIEW
  if (showForcePasswordChange) {
    return (
      <ToastProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Password Change Required</h2>
              <p className="text-slate-600 mb-6">Your administrator has required you to change your password before continuing. Please contact your administrator to receive a reset link or instructions.</p>
              <button onClick={handleLogout} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </ThemeProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ThemeProvider>
        <div className={`flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
          {/* Sidebar */}
          <div 
            className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20`}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
              {isSidebarOpen && <span className="font-bold text-xl text-slate-800 dark:text-white truncate">Inventory Suite</span>}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <Menu size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {(() => {
                const userApps = getApplicationsForUser(applicationAccess, isSystemAdmin);
                return userApps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => app.externalUrl ? window.open(app.externalUrl, '_blank') : setActiveTab(app.route)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                        activeTab === app.route 
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-medium' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title={!isSidebarOpen ? app.displayName : undefined}
                    >
                      <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'} ${activeTab === app.route ? 'text-green-700 dark:text-green-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      {isSidebarOpen && <span>{app.displayName}</span>}
                    </button>
                  );
                });
              })()}
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-4`}>
                {isSidebarOpen && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {userProfile?.name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {isRecoveryMode ? 'Recovery Mode' : userRole.replace('_', ' ')}
                    </span>
                  </div>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  title="Toggle theme"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
              <button 
                onClick={handleLogout}
                className={`flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors ${!isSidebarOpen && 'px-0'}`}
                title="Sign out"
              >
                <LogOut size={20} className={isSidebarOpen ? "mr-2" : ""} />
                {isSidebarOpen && <span>Sign Out</span>}
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {isRecoveryMode && (
              <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 z-50">
                <ShieldAlert size={16} />
                RECOVERY MODE ENABLED - FULL ACCESS GRANTED
              </div>
            )}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-8 shrink-0">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
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
                {activeTab === 'inventory_app' && 'Inventory App'}
              </h2>
            </header>
            
            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
              <div className="h-full">
                <Suspense fallback={<PageLoader />}>
                  {activeTab === 'main_dashboard' && (isSystemAdmin || applicationAccess.mainAdmin) ? (
                    <AdminDashboard />
                  ) : activeTab === 'main_dashboard' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'reports' && (isSystemAdmin || applicationAccess.reports) ? (
                    <ReportGenerator sharedActionFile={reportsFile} setSharedActionFile={setReportsFile} />
                  ) : activeTab === 'reports' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'invoices' && (isSystemAdmin || applicationAccess.poInvoice) ? (
                    <POProcessor sharedActionFile={invoicesFile} setSharedActionFile={setInvoicesFile} />
                  ) : activeTab === 'invoices' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'request_forms' && (isSystemAdmin || applicationAccess.requestForms) ? (
                    <RequestForms />
                  ) : activeTab === 'request_forms' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'reminders' && (isSystemAdmin || applicationAccess.reminders) ? (
                    <Reminders />
                  ) : activeTab === 'reminders' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'notes' && (isSystemAdmin || applicationAccess.notes) ? (
                    <Notes />
                  ) : activeTab === 'notes' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'profile' && (isSystemAdmin || applicationAccess.profile) ? (
                    <ProfileSettings />
                  ) : activeTab === 'profile' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'app_hub' && (isSystemAdmin || applicationAccess.appHub) ? (
                    <AppHub onNavigate={setActiveTab} />
                  ) : activeTab === 'app_hub' ? (
                    <AccessDenied onReturn={() => setActiveTab('')} />
                  ) : null}
                  
                  {activeTab === 'scanner_tracking' && (isSystemAdmin || applicationAccess.scanner) ? (
                    <ScannerTracking />
                  ) : activeTab === 'scanner_tracking' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'salesman_admin' && (isSystemAdmin || applicationAccess.salesAdmin) ? (
                    <SalesmanAdminProvider>
                      <SalesmanAdmin />
                    </SalesmanAdminProvider>
                  ) : activeTab === 'salesman_admin' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'central_reports' && (isSystemAdmin || applicationAccess.salesAdmin) ? (
                    <SalesmanAdminProvider>
                      <CentralReportsHub />
                    </SalesmanAdminProvider>
                  ) : activeTab === 'central_reports' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}

                  {activeTab === 'salesman_mobile' && (isSystemAdmin || applicationAccess.salesmanMobile) ? (
                    <SalesmanMobileApp onBack={() => setActiveTab('app_hub')} />
                  ) : activeTab === 'salesman_mobile' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}

                  {activeTab === 'inventory_app' && (isSystemAdmin || applicationAccess.inventoryAdmin || applicationAccess.storekeeperMobile || isInventoryMobilePath) ? (
                    userRole === 'storekeeper' ? <Suspense fallback={<PageLoader />}><InventoryMobileRoute currentUser={{ id: user?.uid || '', name: userProfile?.name || user?.email?.split('@')[0] || 'User', email: user?.email || '', role: userRole as any, pin: '0000', assignedStoreRooms: userProfile?.assignedStoreRooms || [], assignedSection: userProfile?.assignedSection || 'All', assignedStoreNum: userProfile?.assignedStoreNum || 'All', assignedLocation: userProfile?.assignedLocation || 'All' }} onLogout={handleLogout} /></Suspense> : <InventoryAppNew currentUser={{ id: user?.uid || '', name: userProfile?.name || user?.email?.split('@')[0] || 'User', email: user?.email || '', role: userRole as any, pin: '0000', assignedStoreRooms: userProfile?.assignedStoreRooms || [], assignedSection: userProfile?.assignedSection || 'All', assignedStoreNum: userProfile?.assignedStoreNum || 'All', assignedLocation: userProfile?.assignedLocation || 'All' }} onLogout={handleLogout} />
                  ) : activeTab === 'inventory_app' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                  
                  {activeTab === 'admin' && (isSystemAdmin || applicationAccess.mainAdmin) ? (
                    <AdminPanel />
                  ) : activeTab === 'admin' ? (
                    <AccessDenied onReturn={() => setActiveTab('app_hub')} />
                  ) : null}
                </Suspense>
              </div>
            </main>
          </div>
          
          <AIAssistant />
        </div>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
