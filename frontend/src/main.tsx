import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

// Auto-retry wrapper: if a lazy import fails (stale cache after deploy),
// clear all caches and reload the page once.
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((err) => {
      // Only auto-reload once to avoid infinite loops
      const hasReloaded = sessionStorage.getItem('cache_bust_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('cache_bust_reload', 'true');
        // Clear all caches
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        // Unregister service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs =>
            regs.forEach(reg => reg.unregister())
          );
        }
        // Force reload from server
        window.location.reload();
      }
      throw err;
    })
  );
}

// Clear the reload flag on successful load so future deploys can also auto-recover
sessionStorage.removeItem('cache_bust_reload');

const ScannerMobileApp = lazyWithRetry(() => import('./pages/ScannerMobileApp'));
const SalesmanMobileApp = lazyWithRetry(() => import('./pages/SalesmanMobileApp_V2'));

const hostname = window.location.hostname;
let RootComponent = App;

if (hostname === 'automation-suit-scanner.web.app' || hostname === 'orderscanner-app.web.app') {
  RootComponent = ScannerMobileApp;
} else if (hostname === 'automation-suit-salesman.web.app') {
  RootComponent = SalesmanMobileApp;
}

import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-900"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <RootComponent />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Also unregister stale service workers on every load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}
