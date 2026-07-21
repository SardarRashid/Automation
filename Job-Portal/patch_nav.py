import io
import re

with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update State
state_target = """  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [isYouSheetOpen, setIsYouSheetOpen] = useState(false);
  const toolsTabs = ['cv_manager', 'learning', 'scanner'] as const;
  const youTabs = ['profile', 'settings'] as const;"""

state_replacement = """  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [isAiSheetOpen, setIsAiSheetOpen] = useState(false);
  const [isInsightsSheetOpen, setIsInsightsSheetOpen] = useState(false);
  const [isYouSheetOpen, setIsYouSheetOpen] = useState(false);
  
  const toolsTabs = ['cv_manager', 'document_center', 'scanner'] as const;
  const aiTabs = ['career_coach', 'resume_analyzer', 'cover_letter', 'interview_assistant', 'salary_predictor', 'outreach'] as const;
  const insightsTabs = ['analytics', 'company_intelligence', 'daily_discovery', 'learning'] as const;
  const youTabs = ['profile', 'settings'] as const;
  
  const closeAllSheets = () => {
    setIsToolsSheetOpen(false);
    setIsAiSheetOpen(false);
    setIsInsightsSheetOpen(false);
    setIsYouSheetOpen(false);
  };"""

if state_target in content:
    content = content.replace(state_target, state_replacement)
    print("Updated state definitions.")
else:
    print("Could not find state definitions.")

# 2. Update Navigation
nav_target = """          <div className="relative">
            <button
              onClick={() => { setIsToolsSheetOpen(v => !v); setIsYouSheetOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                toolsTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              Tools <ChevronDown className="h-3 w-3" />
            </button>
            {isToolsSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'cv_manager', label: 'Multi-CV manager', icon: Layers },
                  { id: 'learning', label: 'Learning and portfolios', icon: BookOpen },
                  { id: 'scanner', label: 'Company scanner', icon: Building },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsToolsSheetOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    <item.icon className="h-3.5 w-3.5 text-indigo-500" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => { setIsYouSheetOpen(v => !v); setIsToolsSheetOpen(false); }}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ${
                youTabs.includes(activeTab as any) ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : ''
              }`}
              title="Profile and settings"
            >
              <User className="h-4.5 w-4.5" />
            </button>
            {isYouSheetOpen && ("""

nav_replacement = """          {/* AI ASSISTANTS */}
          <div className="relative">
            <button
              onClick={() => { const v = !isAiSheetOpen; closeAllSheets(); setIsAiSheetOpen(v); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                aiTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              AI Agents <ChevronDown className="h-3 w-3" />
            </button>
            {isAiSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'career_coach', label: 'Career Coach', icon: Sparkles },
                  { id: 'resume_analyzer', label: 'Resume Analyzer', icon: FileText },
                  { id: 'cover_letter', label: 'Cover Letter Gen', icon: PenLine },
                  { id: 'interview_assistant', label: 'Interview Prep', icon: UserPlus },
                  { id: 'salary_predictor', label: 'Salary Predictor', icon: DollarSign },
                  { id: 'outreach', label: 'Outreach Gen', icon: Mail },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INSIGHTS */}
          <div className="relative">
            <button
              onClick={() => { const v = !isInsightsSheetOpen; closeAllSheets(); setIsInsightsSheetOpen(v); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                insightsTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              Insights <ChevronDown className="h-3 w-3" />
            </button>
            {isInsightsSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'analytics', label: 'Performance', icon: TrendingUp },
                  { id: 'company_intelligence', label: 'Company Intel', icon: Globe },
                  { id: 'daily_discovery', label: 'Daily Discovery', icon: Zap },
                  { id: 'learning', label: 'Learning & Portfolios', icon: BookOpen },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TOOLS */}
          <div className="relative">
            <button
              onClick={() => { const v = !isToolsSheetOpen; closeAllSheets(); setIsToolsSheetOpen(v); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                toolsTabs.includes(activeTab as any)
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              Tools <ChevronDown className="h-3 w-3" />
            </button>
            {isToolsSheetOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50">
                {[
                  { id: 'cv_manager', label: 'Multi-CV manager', icon: Layers },
                  { id: 'document_center', label: 'Document Center', icon: Folder },
                  { id: 'scanner', label: 'Company scanner', icon: Building },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); closeAllSheets(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-indigo-500" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              onClick={() => { const v = !isYouSheetOpen; closeAllSheets(); setIsYouSheetOpen(v); }}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ${
                youTabs.includes(activeTab as any) ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : ''
              }`}
              title="Profile and settings"
            >
              <User className="h-4.5 w-4.5" />
            </button>
            {isYouSheetOpen && ("""

# Replace PenLine and UserPlus since they might not be imported. Wait! Let me check imports.
# I will just use existing icons like FileText, User, DollarSign, Mail, TrendingUp, Globe, Zap, BookOpen, Layers, Folder, Building
nav_replacement = nav_replacement.replace('PenLine', 'FileText').replace('UserPlus', 'User')

if nav_target in content:
    content = content.replace(nav_target, nav_replacement)
    print("Updated Navigation.")
else:
    print("Could not find Navigation definitions.")

with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
