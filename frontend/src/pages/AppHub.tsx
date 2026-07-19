import React from 'react';
import { Download, Globe, Smartphone, AppWindow, Wrench, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/ui/ToastNotification';

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'chrome-extension' | 'android-app' | 'web-app';
  downloadUrl: string;
}

const APPS: AppItem[] = [
  {
    id: 'job-portal',
    name: 'Job Portal',
    description: 'Recruitment and Job Application Portal.',
    icon: <Globe className="w-8 h-8 text-indigo-500" />,
    type: 'web-app',
    downloadUrl: 'https://automation-suit-jobortal.web.app'
  },

  {
    id: 'loginext-scraper',
    name: 'LogiNext Scraper Extension',
    description: 'Chrome extension to extract pending orders and map coordinates directly from LogiNext.',
    icon: <Globe className="w-8 h-8 text-blue-500" />,
    type: 'chrome-extension',
    downloadUrl: '/LogiNextExtension.zip'
  },
  {
    id: 'sticker-printer',
    name: 'Sticker Printer Extension',
    description: 'Chrome extension to print dispatch and delivery stickers automatically.',
    icon: <Wrench className="w-8 h-8 text-orange-500" />,
    type: 'chrome-extension',
    downloadUrl: '/StickerPrinterExtension.zip'
  },
  {
    id: 'scanner-pwa',
    name: 'Scanner Mobile App',
    description: 'The dedicated Progressive Web App (PWA) for Scanner. Click the link to open it, then install via "Add to Home Screen".',
    icon: <Smartphone className="w-8 h-8 text-emerald-500" />,
    type: 'web-app',
    downloadUrl: 'https://automation-suit-scanner.web.app'
  },
  {
    id: 'salesman-pwa',
    name: 'Salesman Mobile App',
    description: 'The dedicated mobile app for Salesmen. Click the link to open it, then install via "Add to Home Screen".',
    icon: <Smartphone className="w-8 h-8 text-green-600" />,
    type: 'web-app',
    downloadUrl: 'https://automation-suit-salesman.web.app'
  },
  {
      id: 'inventory-mobile',
    name: 'Inventory Mobile App',
    description: 'The dedicated mobile app for Inventory Stock Taking. Click the link to open it, then install via "Add to Home Screen".',
    icon: <Smartphone className="w-8 h-8 text-teal-600" />,
    type: 'web-app',
    downloadUrl: 'https://automation-suit-inventory.web.app'
  }
];

interface AppHubProps { onNavigate?: (tab: string) => void; }

export default function AppHub({ onNavigate }: AppHubProps) {
  const { setTheme, isDark } = useTheme();
  const { addToast } = useToast();
  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                <AppWindow className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              Enterprise Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Centralized access to all official applications, modules, and extensions.
            </p>
          </div>
          
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APPS.map((app, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              key={app.id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-400/5 dark:to-purple-400/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
              <div>
                <div className="bg-slate-50 p-3 rounded-xl w-fit mb-4">
                  {app.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{app.name}</h3>
                <p className="text-slate-600 text-sm mb-6">{app.description}</p>
              </div>

              {app.type === 'chrome-extension' ? (
                <a 
                  href={app.downloadUrl} 
                  download 
                  className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-800 hover:bg-green-100 font-semibold py-2.5 rounded-lg transition-colors border border-green-200"
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </a>
              ) : (
                <a 
                  href={app.downloadUrl !== '#' ? app.downloadUrl : undefined}
                  target={app.downloadUrl !== '#' ? '_blank' : undefined}
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold py-2.5 rounded-lg transition-colors border border-emerald-200"
                  onClick={() => {
                    if (app.type === 'web-app') {
                      addToast('info', `Opening ${app.name} in a new tab. IMPORTANT: Once the new page fully loads, use your browser menu to select "Install App" or "Add to Home Screen". Do NOT use the install prompt that might have popped up for the current page.`);
                    }
                  }}
                >
                  <Smartphone className="w-4 h-4" />
                  {app.downloadUrl === 'https://automation-suit-cece7.web.app' ? 'Open & Install' : 'Open Mobile App'}
                </a>
              )}
              {onNavigate && app.id === 'central-reports' && (
                <button
                  onClick={() => onNavigate('central_reports')}
                  className="mt-3 w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-bold flex items-center justify-center hover:bg-indigo-700 transition-colors"
                >
                  <AppWindow className="w-4 h-4 mr-2" />
                  Open Reporting Engine
                </button>
              )}

            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl mt-12 shadow-lg">
          <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            How to Install a Chrome Extension (Developer Mode)
          </h2>
          <ol className="list-decimal pl-5 space-y-3">
            <li><strong>Download</strong> the ZIP file from the App Hub above.</li>
            <li><strong>Extract (Unzip)</strong> the downloaded folder to a location on your computer.</li>
            <li>Open Google Chrome and type <code className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">chrome://extensions/</code> in the address bar.</li>
            <li>Turn on <strong>Developer mode</strong> using the toggle switch in the top right corner.</li>
            <li>Click the <strong>Load unpacked</strong> button that appears in the top left.</li>
            <li>Select the folder you extracted in Step 2. The extension is now installed!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

