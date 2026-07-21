import os

filepath = 'src/components/CompanyPortalScanner.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Loader2 to lucide-react imports
if 'Loader2' not in content:
    content = content.replace("Trash2\n} from 'lucide-react';", "Trash2,\n  Loader2\n} from 'lucide-react';")

# Add state
if 'const [tailoringPosTitle, setTailoringPosTitle]' not in content:
    state_anchor = "const [scanningId, setScanningId] = useState<string | null>(null);"
    state_new = state_anchor + "\n  const [tailoringPosTitle, setTailoringPosTitle] = useState<string | null>(null);"
    content = content.replace(state_anchor, state_new)

# Update pushToTracker to set state
push_func_anchor = "const pushToTracker = async (company: CompanyInfo, position: OpenPosition) => {"
push_func_new = push_func_anchor + "\n    setTailoringPosTitle(position.title);"
content = content.replace(push_func_anchor, push_func_new)

# Find the end of pushToTracker try/catch to reset state
catch_anchor = """      showToast(`Tailoring failed: ${e.message}`, 'error');
    }
  };"""
catch_new = """      showToast(`Tailoring failed: ${e.message}`, 'error');
    } finally {
      setTailoringPosTitle(null);
    }
  };"""
content = content.replace(catch_anchor, catch_new)

# Update the button
old_button = """                        <button
                          onClick={() => pushToTracker(selectedCompany, pos)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Tailor & Tracker Push
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>"""

new_button = """                        <button
                          onClick={() => pushToTracker(selectedCompany, pos)}
                          disabled={tailoringPosTitle === pos.title}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md"
                        >
                          {tailoringPosTitle === pos.title ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Tailoring...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Tailor & Tracker Push
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>"""

content = content.replace(old_button, new_button)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("CompanyPortalScanner updated.")
