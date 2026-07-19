
import os

filepath = "frontend/src/pages/AdminPanel.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

target = """<Puzzle className="w-5 h-5" /> Extensions
              </button>"""

if target in content:
    replacement = target + """
            </div>

            <div>
              <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Portals</p>
              <button 
                onClick={() => window.open(\x27https://automation-suit-jobortal.web.app\x27, \x27_blank\x27)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-slate-800 hover:text-white"
              >
                <AppWindow className="w-5 h-5" /> Job Portal
              </button>"""
    
    # Actually wait, there is already a `</div>` after the target in the original code. 
    # Let me just replace the target with target + button.
    
    better_replacement = target + """
              <button 
                onClick={() => window.open(\x27https://automation-suit-jobortal.web.app\x27, \x27_blank\x27)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-slate-800 hover:text-white"
              >
                <AppWindow className="w-5 h-5" /> Job Portal
              </button>"""
    
    content = content.replace(target, better_replacement)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Job Portal link to AdminPanel sidebar.")
else:
    print("Target line not found.")

