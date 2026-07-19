import os
import re

old_app_path = "D:/AntiGravity/InventorySuitAndroid/scanner-admin-web/src/App.tsx"
new_app_path = "D:/AntiGravity/inventory-web-workspace/frontend/src/pages/ScannerTracking.tsx"

with open(old_app_path, "r", encoding="utf-8") as f:
    old_content = f.read()

# 1. Fix imports
content = old_content.replace(
    "import { FirebaseAPI } from './lib/firebase';",
    "import { database, firebaseConfig } from '../lib/firebase';\nimport { ref, get, set, remove, onValue } from 'firebase/database';"
)
# Add missing imports if needed
if "import React" not in content:
    content = "import React, { useState, useEffect } from 'react';\n" + content

# 2. Rename component
content = content.replace("export default function App() {", "export default function ScannerTracking() {")

# 3. Remove Login Screen Block
# The login block looks like:
#   if (!user) {
#     return (
#       ...
#     );
#   }
login_block_pattern = re.compile(r"if\s*\(!user\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}", re.MULTILINE)
content = login_block_pattern.sub("", content)

# 4. Remove `const [user, setUser] = useState<any>(null);` and instead get email from somewhere or just use a dummy
content = content.replace("const [user, setUser] = useState<any>(null);", "const user = { email: 'admin@company.com' };")
content = content.replace("const [email, setEmail] = useState('');", "")
content = content.replace("const [password, setPassword] = useState('');", "")

# 5. Remove `const saved = localStorage.getItem('scanner_admin_user');` 
content = content.replace("const saved = localStorage.getItem('scanner_admin_user');", "//")
content = content.replace("if (saved) setUser(JSON.parse(saved));", "//")

# 6. Fix `FirebaseAPI.adminCreateUser` to use raw fetch or RTDB (like I did in previous script)
# Wait, let's just replace `FirebaseAPI.adminCreateUser(nuEmail, nuPassword);`
create_user_code = """
      const signUpResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: nuEmail,
          password: nuPassword,
          returnSecureToken: true
        })
      });
      const signUpData = await signUpResponse.json();
      if (!signUpResponse.ok) throw new Error(signUpData.error?.message || 'Failed to create user');
"""
content = content.replace("await FirebaseAPI.adminCreateUser(nuEmail, nuPassword);", create_user_code)

# 7. Strip the <nav> block since the main app already has a header/sidebar
nav_pattern = re.compile(r"<nav className=\"bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-md\">[\s\S]*?</nav>", re.MULTILINE)
content = nav_pattern.sub("", content)

# 8. Adjust `min-h-screen bg-slate-50` to fit nicely in the flex-1 container of the main app
content = content.replace("<div className=\"min-h-screen bg-slate-50 text-slate-900 font-sans\">", "<div className=\"h-full bg-slate-50 text-slate-900 font-sans overflow-y-auto w-full\">")

# 9. Clean up `user` dependency in useEffects (so they run unconditionally)
content = content.replace("if (!user) return;", "//")

# 10. Clean up handleLogin and handleLogout to avoid unused errors
content = re.sub(r"const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?^\s*\};", "", content, flags=re.MULTILINE)
content = re.sub(r"const handleLogout = \(\) => \{[\s\S]*?^\s*\};", "", content, flags=re.MULTILINE)

with open(new_app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("ScannerTracking.tsx rewritten using old source.")
