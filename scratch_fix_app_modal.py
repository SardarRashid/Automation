import re

filepath = "frontend/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add sendPasswordResetEmail to imports
if "from 'firebase/auth'" in content:
    content = content.replace("import { onAuthStateChanged } from 'firebase/auth';", "import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';")

# Add the modal block
target = """    return (
      <ToastProvider>
      <ThemeProvider>"""

modal_block = """    return (
      <ToastProvider>
      <ThemeProvider>
      {showForcePasswordChange && (
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
      )}"""

parts = content.rsplit(target, 1)
if len(parts) == 2:
    content = parts[0] + modal_block + parts[1]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Modal injected.")
else:
    print("Target not found.")
