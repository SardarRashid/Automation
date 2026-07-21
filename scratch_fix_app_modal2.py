import re

filepath = "frontend/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add sendPasswordResetEmail to imports
if "from 'firebase/auth'" in content:
    content = content.replace("import { onAuthStateChanged } from 'firebase/auth';", "import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';")

# Find the block where the main app renders
target = """    return (
      <ToastProvider>
        <ThemeProvider>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans relative overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white transition-colors duration-300">"""

# In case the spacing is slightly different
regex = re.compile(r"(\s*return\s*\(\s*<ToastProvider>\s*<ThemeProvider>\s*)(<div className=\"flex h-screen bg-slate-100 dark:bg-slate-950)")

modal_block = """      {showForcePasswordChange && (
        <div className="fixed inset-0 bg-slate-900/95 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Password Change Required</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Your administrator has required you to change your password before continuing.</p>
            <button 
              onClick={() => {
                sendPasswordResetEmail(auth, user?.email || "")
                  .then(() => alert("Password reset email sent! Check your inbox."))
                  .catch((e: any) => alert("Error: " + e.message));
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Send Password Reset Email
            </button>
            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white py-3 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      """

match = regex.search(content)
if match:
    # We want to replace the LAST match because the login screen also has ToastProvider/ThemeProvider
    matches = list(regex.finditer(content))
    last_match = matches[-1]
    
    new_content = content[:last_match.start(2)] + modal_block + content[last_match.start(2):]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Modal injected successfully.")
else:
    print("Target regex not found.")
