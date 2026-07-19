import re

filepath = "frontend/src/pages/AdminPanel.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the "Job Portal" button
content = re.sub(
    r"<button\s*onClick=\{\(\) => window\.open\('https://automation-suit-jobortal\.web\.app', '_blank'\)\}.*?<AppWindow className=\"w-5 h-5\" /> Job Portal\s*</button>",
    "",
    content,
    flags=re.DOTALL
)

# Change wrapper from flex-col md:flex-row to flex-col
content = content.replace(
    "<div className=\"flex h-[calc(100vh-4rem)] w-full bg-slate-50 font-sans overflow-x-auto flex-col md:flex-row\">",
    "<div className=\"flex h-[calc(100vh-4rem)] w-full bg-slate-50 font-sans overflow-x-auto flex-col\">"
)

# Change sidebar to topbar
# Replace the whole sidebar class
sidebar_old = "<div className=\"w-full md:w-64 bg-[#0f172a] text-slate-300 flex flex-row md:flex-col flex-shrink-0 overflow-x-auto md:overflow-x-visible overflow-y-hidden md:overflow-y-auto min-h-[64px] md:min-h-0\">"
sidebar_new = "<div className=\"w-full bg-[#0f172a] text-slate-300 flex flex-row items-center flex-shrink-0 overflow-x-auto shadow-md z-20\">"
content = content.replace(sidebar_old, sidebar_new)

# Remove the specific Sidebar AdminPanel header (the 16px high box)
header_old = """        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">AdminPanel</span>
          </div>
        </div>"""

header_new = """        <div className="flex items-center px-6 border-r border-slate-800 h-16 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Admin</span>
          </div>
        </div>"""
content = content.replace(header_old, header_new)

# Change the content sections to row
content = content.replace(
    "<div className=\"flex-1 overflow-y-auto py-6 px-4 space-y-6\">",
    "<div className=\"flex-1 flex flex-row items-center overflow-x-auto px-4 gap-6\">"
)

# Replace vertical sections with horizontal ones
content = content.replace(
    "<div>\n            <p className=\"px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2\">Main</p>",
    "<div className=\"flex items-center gap-2 border-r border-slate-800 pr-4\">"
)

content = content.replace(
    "<div>\n            <p className=\"px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2\">User Management</p>",
    "<div className=\"flex items-center gap-2 border-r border-slate-800 pr-4\">"
)

content = content.replace(
    "<div>\n            <p className=\"px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2\">Applications</p>",
    "<div className=\"flex items-center gap-2 border-r border-slate-800 pr-4\">"
)

content = content.replace(
    "<div>\n            <p className=\"px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2\">System</p>",
    "<div className=\"flex items-center gap-2\">"
)

# Replace block buttons with inline buttons
content = re.sub(
    r"<button\s*onClick=\{\(\) => setActiveView\('([^']+)'\)\}\s*className=\{`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors \$\{activeView === '([^']+)' \? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'\}`\}\s*>",
    r"<button onClick={() => setActiveView('\1')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === '\2' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>",
    content
)

content = re.sub(
    r"<button\s*onClick=\{\(\) => \{\s*setActiveView\('users'\);\s*setSelectedUserKey\(null\);\s*\}\}\s*className=\{`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors \$\{activeView === 'users' \? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800 hover:text-white'\}`\}\s*>",
    r"<button onClick={() => { setActiveView('users'); setSelectedUserKey(null); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${activeView === 'users' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>",
    content
)

content = content.replace(
    "<button className=\"w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-slate-800 hover:text-white\">",
    "<button className=\"flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 hover:text-white text-sm whitespace-nowrap\">"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("AdminPanel refactored to topbar!")
