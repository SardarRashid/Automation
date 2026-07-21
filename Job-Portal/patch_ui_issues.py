import os

app_file = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\App.tsx'
with open(app_file, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Fix App.tsx - Mobile "Menu" replacing "Tools" and "You" sheets
# We will create one "Menu" sheet that has everything
app_content = app_content.replace(
"""      {/* Mobile slide-up sheet: Tools */}
      <AnimatePresence>
        {isToolsSheetOpen && (
          <>
            <motion.div
              key="tools-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToolsSheetOpen(false)}
              className="xl:hidden fixed inset-0 z-50 bg-slate-950/40"
            />
            <motion.div
              key="tools-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Tools</p>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'cv_manager', label: 'Multi-CV manager', icon: Layers },
                  { id: 'learning', label: 'Learning and portfolios', icon: BookOpen },
                  { id: 'scanner', label: 'Company scanner', icon: Building },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsToolsSheetOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 text-left"
                  >
                    <item.icon className="h-4.5 w-4.5 text-indigo-500" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile slide-up sheet: You */}
      <AnimatePresence>
        {isYouSheetOpen && (
          <>
            <motion.div
              key="you-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsYouSheetOpen(false)}
              className="xl:hidden fixed inset-0 z-50 bg-slate-950/40"
            />
            <motion.div
              key="you-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">You</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveTab('profile'); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <User className="h-4.5 w-4.5 text-indigo-500" /> My profile
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Settings className="h-4.5 w-4.5 text-indigo-500" /> Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>""",

"""      {/* Mobile slide-up sheet: Menu */}
      <AnimatePresence>
        {(isToolsSheetOpen || isYouSheetOpen || isAiSheetOpen || isInsightsSheetOpen) && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllSheets}
              className="xl:hidden fixed inset-0 z-50 bg-slate-950/40"
            />
            <motion.div
              key="menu-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[85vh] overflow-y-auto"
            >
              <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Agents</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'career_coach', label: 'Career Coach', icon: Sparkles },
                  { id: 'resume_analyzer', label: 'Resume Analyzer', icon: FileText },
                  { id: 'cover_letter', label: 'Cover Letter', icon: FileText },
                  { id: 'interview_assistant', label: 'Interview Prep', icon: User },
                  { id: 'salary_predictor', label: 'Salary Predictor', icon: DollarSign },
                  { id: 'outreach', label: 'Outreach', icon: Mail },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Insights</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'analytics', label: 'Performance', icon: TrendingUp },
                  { id: 'company_intelligence', label: 'Company Intel', icon: Globe },
                  { id: 'daily_discovery', label: 'Discovery', icon: Zap },
                  { id: 'learning', label: 'Learning', icon: BookOpen },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tools & Profile</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => { setActiveTab('cv_manager'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Layers className="h-4 w-4 text-indigo-500" /> CV Manager
                </button>
                <button
                  onClick={() => { setActiveTab('document_center'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Folder className="h-4 w-4 text-indigo-500" /> Documents
                </button>
                <button
                  onClick={() => { setActiveTab('scanner'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Building className="h-4 w-4 text-indigo-500" /> Scanner
                </button>
                <button
                  onClick={() => { setActiveTab('profile'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <User className="h-4 w-4 text-indigo-500" /> Profile
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-left"
                >
                  <Settings className="h-4 w-4 text-indigo-500" /> Settings
                </button>
                <button
                  onClick={() => { handleGoogleSignOut(); closeAllSheets(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-400 text-left"
                >
                  <LogOut className="h-4 w-4 text-rose-500" /> Sign Out
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>"""
)

# Fix Mobile Nav buttons to reflect "Menu"
app_content = app_content.replace(
"""        <button
          onClick={() => setIsToolsSheetOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            toolsTabs.includes(activeTab as any) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Folder className="h-5 w-5" />
          Tools
        </button>
        <button
          onClick={() => setIsYouSheetOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            youTabs.includes(activeTab as any) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <User className="h-5 w-5" />
          You
        </button>""",
"""        <button
          onClick={() => { setActiveTab('cv_manager'); closeAllSheets(); }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            activeTab === 'cv_manager' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Layers className="h-5 w-5" />
          CVs
        </button>
        <button
          onClick={() => setIsToolsSheetOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-semibold ${
            (isToolsSheetOpen || isYouSheetOpen || isAiSheetOpen || isInsightsSheetOpen) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <ChevronDown className="h-5 w-5" />
          Menu
        </button>"""
)

# Add Logout to desktop Profile
app_content = app_content.replace(
"""                <button
                  onClick={() => { setActiveTab('settings'); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-indigo-500" /> Settings
                </button>
              </div>""",
"""                <button
                  onClick={() => { setActiveTab('settings'); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-indigo-500" /> Settings
                </button>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 w-full" />
                <button
                  onClick={() => { handleGoogleSignOut(); setIsYouSheetOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500" /> Sign Out
                </button>
              </div>"""
)

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_content)


wrapper_file = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\LoginWrapper.tsx'
with open(wrapper_file, 'r', encoding='utf-8') as f:
    wrapper_content = f.read()

# Remove Logout from LoginWrapper absolute div
import re
wrapper_content = re.sub(
    r'<div className="absolute top-4 right-4 z-50">.*?</div>',
    '',
    wrapper_content,
    flags=re.DOTALL
)

with open(wrapper_file, 'w', encoding='utf-8') as f:
    f.write(wrapper_content)

print("Patch successful!")
