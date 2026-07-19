import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure Suspense and lazy are imported
if "Suspense" not in content:
    content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, Suspense, lazy } from 'react';")

# Convert standard imports to lazy imports
lazy_replacements = [
    ("import ReportGenerator from './pages/ReportGenerator';", "const ReportGenerator = lazy(() => import('./pages/ReportGenerator'));"),
    ("import POProcessor from './pages/POProcessor';", "const POProcessor = lazy(() => import('./pages/POProcessor'));"),
    ("import RequestForms from './pages/RequestForms';", "const RequestForms = lazy(() => import('./pages/RequestForms'));"),
    ("import Reminders from './pages/Reminders';", "const Reminders = lazy(() => import('./pages/Reminders'));"),
    ("import Notes from './pages/Notes';", "const Notes = lazy(() => import('./pages/Notes'));"),
    ("import { ProfileSettings } from './pages/ProfileSettings';", "const ProfileSettings = lazy(() => import('./pages/ProfileSettings').then(module => ({ default: module.ProfileSettings })));"),
    ("import AdminPanel from './pages/AdminPanel';", "const AdminPanel = lazy(() => import('./pages/AdminPanel'));"),
    ("import { AdminDashboard } from './components/dashboards/AdminDashboard';", "const AdminDashboard = lazy(() => import('./components/dashboards/AdminDashboard').then(module => ({ default: module.AdminDashboard })));"),
    ("import ScannerTracking from './pages/ScannerTracking';", "const ScannerTracking = lazy(() => import('./pages/ScannerTracking'));"),
    ("import SalesmanAdmin from './pages/salesman-admin';", "const SalesmanAdmin = lazy(() => import('./pages/salesman-admin'));"),
    ("import SalesmanMobileApp from './pages/SalesmanMobileApp';", "const SalesmanMobileApp = lazy(() => import('./pages/SalesmanMobileApp'));"),
    ("import AppHub from './pages/AppHub';", "const AppHub = lazy(() => import('./pages/AppHub'));"),
    ("import CentralReportsHub from './pages/CentralReportsHub';", "const CentralReportsHub = lazy(() => import('./pages/CentralReportsHub'));"),
    ("import InventoryApp from './inventory/InventoryApp';", "const InventoryApp = lazy(() => import('./inventory/InventoryApp'));")
]

for old, new in lazy_replacements:
    content = content.replace(old, new)

# Define a fallback loading component
loading_component = """
const PageLoader = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[400px]">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
      <div className="text-slate-500 font-medium">Loading Module...</div>
    </div>
  </div>
);
"""
if "const PageLoader" not in content:
    # Insert after imports
    content = content.replace("function App() {", loading_component + "\nfunction App() {")

# Wrap the main routes block in Suspense
# Find where the activeTab components are rendered
content = content.replace(
    """                {activeTab === 'main_dashboard' && (userRole === 'it_admin' || userRole === 'app' || userRole === 'admin') && <AdminDashboard />}""",
    """                <Suspense fallback={<PageLoader />}>
                  {activeTab === 'main_dashboard' && (userRole === 'it_admin' || userRole === 'app' || userRole === 'admin') && <AdminDashboard />}"""
)

# And close it at the end of the admin panel
content = content.replace(
    """                {activeTab === 'admin' && userRole === 'it_admin' && <AdminPanel />}
              </>""",
    """                {activeTab === 'admin' && userRole === 'it_admin' && <AdminPanel />}
                </Suspense>
              </>"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.tsx with React.lazy")
