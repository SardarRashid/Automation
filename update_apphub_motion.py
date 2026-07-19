import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AppHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure we have motion imported
if "framer-motion" not in content:
    content = content.replace("import { Smartphone, Download, Settings, Package, AppWindow } from 'lucide-react';", "import { Smartphone, Download, Settings, Package, AppWindow, Sun, Moon } from 'lucide-react';\nimport { motion } from 'framer-motion';\nimport { useTheme } from '../contexts/ThemeContext';")

# Inject Theme Toggle logic inside AppHub component
if "const { theme, setTheme, isDark } = useTheme();" not in content:
    content = content.replace("export default function AppHub({ onNavigate }: AppHubProps) {", "export default function AppHub({ onNavigate }: AppHubProps) {\n  const { theme, setTheme, isDark } = useTheme();")

# Modify header to include the Theme toggle
old_header = """        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AppWindow className="w-6 h-6 text-green-700" />
            Apps & Extensions Hub
          </h1>
          <p className="text-slate-600 mt-2">
            Download and install official company tools, Chrome extensions, and mobile apps all from one place.
          </p>
        </div>"""

new_header = """        <div className="flex justify-between items-start">
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
        </div>"""
content = content.replace(old_header, new_header)

# Modify grid mapping to use framer-motion cards
old_map = """          {APPS.map(app => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">"""

new_map = """          {APPS.map((app, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              key={app.id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-400/5 dark:to-purple-400/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />"""
content = content.replace(old_map, new_map)

content = content.replace("</div>\n          ))}","</motion.div>\n          ))}")

# Make background dynamic
content = content.replace("className=\"p-6 bg-slate-50 min-h-screen text-slate-900 font-sans\"", "className=\"p-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300\"")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AppHub.tsx")
