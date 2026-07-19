import os
import re

file_path = "D:/AntiGravity/inventory-web-workspace/frontend/src/pages/ScannerTracking.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { database } from '../lib/firebase';", "import { database, firebaseConfig } from '../lib/firebase';")
content = content.replace("import { ref, get, set, remove } from 'firebase/database';", "import { ref, get, set, remove, onValue } from 'firebase/database';")
content = content.replace("Trash2, X, AlertCircle, Upload, Trash", "Trash2, X, AlertCircle, Upload, Trash, Users, UserPlus")

# 2. Add interface for ScannerUser
user_interface = """
interface ScannerUser {
  email: string;
  role: string;
  blocked?: boolean;
}
"""
content = content.replace("interface ScannerOrder", user_interface + "\ninterface ScannerOrder")

# 3. Add state variables inside component
state_vars = """
  // Scanner Management State
  const [activeSubTab, setActiveSubTab] = useState<'tracking' | 'users'>('tracking');
  const [scannerUsers, setScannerUsers] = useState<Record<string, ScannerUser>>({});
  const [newScannerEmail, setNewScannerEmail] = useState('');
  const [newScannerPass, setNewScannerPass] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    if (activeSubTab === 'users') {
      const usersRef = ref(database, 'users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const allUsers = snapshot.val();
          const filtered: Record<string, ScannerUser> = {};
          Object.entries(allUsers).forEach(([key, val]: [string, any]) => {
            if (!key.includes(',') && (val.role === 'scanner' || val.role === 'scanner_admin')) {
              filtered[key] = val;
            }
          });
          setScannerUsers(filtered);
        }
      });
      return () => unsubscribe();
    }
  }, [activeSubTab]);

  const handleAddScannerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setAddingUser(true);
    
    if (!newScannerEmail || !newScannerPass) {
      setUserError('Email and Password are required.');
      setAddingUser(false);
      return;
    }

    const userKey = newScannerEmail.replace(/[.#$\\[\\]]/g, '_');
    
    try {
      const signUpResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newScannerEmail,
          password: newScannerPass,
          returnSecureToken: true
        })
      });

      const signUpData = await signUpResponse.json();
      if (!signUpResponse.ok) {
        throw new Error(signUpData.error?.message || 'Failed to create user');
      }

      const userData = {
        email: newScannerEmail,
        password: newScannerPass,
        role: 'scanner',
        app_role: 'scanner',
        blocked: false,
        allowedApps: { scanner: true },
        permissions: {}
      };

      await set(ref(database, `users/${userKey}`), userData);

      const legacyUserKey = newScannerEmail.replace(/\\./g, ',');
      if (legacyUserKey !== userKey) {
        await set(ref(database, `users/${legacyUserKey}`), userData);
      }

      setNewScannerEmail('');
      setNewScannerPass('');
      alert('Scanner user added successfully!');
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleToggleBlock = async (key: string, currentUser: ScannerUser) => {
    try {
      const newBlocked = !currentUser.blocked;
      await set(ref(database, `users/${key}/blocked`), newBlocked);
      
      const legacyKey = currentUser.email.replace(/\\./g, ',');
      if (legacyKey !== key) {
        await set(ref(database, `users/${legacyKey}/blocked`), newBlocked);
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };
"""
content = content.replace("const [formError, setFormError] = useState<string | null>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);", 
                          "const [formError, setFormError] = useState<string | null>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);\n" + state_vars)

# 4. Add Tab UI at the top of return statement
tabs_ui = """
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      {/* Header and Tabs */}
      <div className="bg-slate-900 px-6 py-4 flex-shrink-0 flex gap-2 overflow-x-auto shadow-inner">
        <button onClick={() => setActiveSubTab('tracking')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'tracking' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <MapPin className="w-4 h-4" /> Live Tracking & Uploads
        </button>
        <div className="w-px bg-slate-700 mx-2 h-8 self-center"></div>
        <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          <Users className="w-4 h-4" /> Manage Scanner Users
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {activeSubTab === 'tracking' ? (
          <>
"""
content = content.replace('return (\n    <div className="space-y-6">', tabs_ui)

# 5. Add Users UI at the bottom
users_ui = """
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Add New Scanner User
                </h3>
                <form onSubmit={handleAddScannerUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" required value={newScannerEmail} onChange={(e) => setNewScannerEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="scanner@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="text" required value={newScannerPass} onChange={(e) => setNewScannerPass(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Min 6 characters" minLength={6} />
                  </div>
                  {userError && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100">{userError}</div>}
                  <button type="submit" disabled={addingUser} className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {addingUser ? 'Creating...' : 'Create Scanner User'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-500" /> Scanner Team ({Object.keys(scannerUsers).length})
                  </h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="p-4 pl-6">Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {Object.entries(scannerUsers).map(([key, u]) => (
                        <tr key={key} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 pl-6 font-medium text-slate-800">{u.email}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${u.blocked ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                              {u.blocked ? 'BLOCKED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button onClick={() => handleToggleBlock(key, u)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${u.blocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                              {u.blocked ? 'Unblock' : 'Block Access'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {Object.keys(scannerUsers).length === 0 && (
                        <tr><td colSpan={3} className="p-8 text-center text-slate-500 text-sm font-medium">No scanner users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
"""

# replace the last closing div of the original component
content = content.replace("    </div>\n  );\n}\n", users_ui + "\n}\n")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched ScannerTracking.tsx")
