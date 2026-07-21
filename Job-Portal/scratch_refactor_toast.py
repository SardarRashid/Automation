import os

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the state
old_state = "const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);"
new_state = "const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);"
content = content.replace(old_state, new_state)

# Replace the auto-dismiss (lines 255-261)
old_auto_dismiss = """  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);"""
new_auto_dismiss = """  // Toast auto-dismiss handled directly in showToast"""
content = content.replace(old_auto_dismiss, new_auto_dismiss)

# Replace showToast function
old_show_toast = """  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };"""
new_show_toast = """  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };"""
content = content.replace(old_show_toast, new_show_toast)

# Replace rendering block
old_render = """      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' :
              toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
              'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-500" />}
            {toast.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>"""

new_render = """      {/* Toast Alert Queue */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
                toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' :
                toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
                'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-500" />}
              {toast.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>"""

content = content.replace(old_render, new_render)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("App.tsx refactored for Toast Queue.")
