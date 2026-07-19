import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\AdminPanel.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state
state_pattern = r"(const \[isAddUserModalOpen, setIsAddUserModalOpen\] = useState\(false\);)"
state_replacement = r"\1\n    const [editingUser, setEditingUser] = useState<{key: string, email: string, role: string, password?: string} | null>(null);"
content = re.sub(state_pattern, state_replacement, content, count=1)

# 2. Add Edit button to users table
button_pattern = r"(<button\s+onClick=\{\(\) => handleRevokeAccess\(key\)\}\s+className=\"w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors\"\s+title=\"Revoke Access\"\s*>)"
button_replacement = r"""<button 
                              onClick={() => setEditingUser({key, email: u.email || '', role: u.role || 'scanner', password: u.password || ''})} 
                              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" 
                              title="Edit User"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            \1"""
content = re.sub(button_pattern, button_replacement, content)

# 3. Add Edit Modal at the end, right before {/* System Item Modal */}
modal_pattern = r"(\{\/\* System Item Modal \*\/})"
modal_replacement = r"""{/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-x-auto animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Edit User Details</h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1.5 rounded-full hover:bg-slate-50 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const { update, ref } = await import('firebase/database');
                  await update(ref(database, `users/${editingUser.key}`), {
                    email: editingUser.email,
                    password: editingUser.password,
                    role: editingUser.role
                  });
                  setEditingUser(null);
                  alert('User updated successfully!');
                } catch (err: any) {
                  alert('Error updating user: ' + err.message);
                }
              }} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email / Username</label>
                  <input type="text" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 placeholder-slate-400 transition-shadow" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                  <input type="text" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 placeholder-slate-400 transition-shadow" placeholder="Leave blank to keep unchanged" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Role / App Access</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 bg-white transition-shadow">
                    <option value="app">Main Inventory App</option>
                    <option value="admin">System Admin</option>
                    <option value="manager">Manager</option>
                    <option value="scanner">Scanner Mobile App</option>
                    <option value="salesman">Salesman Mobile App</option>
                    <option value="extension">Sticker Printer Extension</option>
                  </select>
                </div>
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                  <strong>Note:</strong> Changes to Email or Password will immediately affect Mobile App and Extension logins. Firebase Authentication updates may need to be done manually if the user logs into the Main Admin App.
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        \1"""
content = re.sub(modal_pattern, modal_replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AdminPanel.tsx successfully.")
