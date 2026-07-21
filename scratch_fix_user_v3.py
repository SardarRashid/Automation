import re

filepath = "frontend/src/pages/admin/UserManagement.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove Roles Tab button
content = re.sub(r"\{\s*id:\s*'roles',\s*label:\s*'Roles',\s*icon:\s*Shield\s*\},?\n", "", content)

# 2. Add System Role dropdown to Details tab
details_target = """                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>"""
role_dropdown = """                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">System Role</label>
                    <select
                      value={user.role || ''}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        const newAccess = getTemplateForRole(newRole);
                        setUser({ 
                          ...user, 
                          role: newRole,
                          applicationAccess: {
                            ...(user.applicationAccess || {}),
                            ...newAccess
                          }
                        });
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="">No Role</option>
                      <option value="system_admin">System Admin</option>
                      <option value="it_admin">IT Admin</option>
                      <option value="admin">Administrator</option>
                      <option value="manager">Manager</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="salesperson">Salesperson</option>
                      <option value="storekeeper">Storekeeper</option>
                      <option value="user">Standard User</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>"""
content = content.replace(details_target, role_dropdown)

# 3. Remove roles block entirely
roles_block_pattern = re.compile(r"\{\s*activeTab\s*===\s*'roles'\s*&&\s*\(\s*<div className=\"space-y-4\">.*?</div>\s*\)\s*\}\s*", re.DOTALL)
content = re.sub(roles_block_pattern, "", content)

# 4. Replace Permissions block
permissions_target = re.compile(r"\{\s*activeTab\s*===\s*'permissions'\s*&&\s*\(\s*<div className=\"space-y-4\">.*?</div>\s*\)\s*\}", re.DOTALL)
new_permissions_block = """{activeTab === 'permissions' && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">Add Custom Permission</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="newPermissionKey"
                      placeholder="e.g. inventory_mobile, can_delete_invoices" 
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('newPermissionKey') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const key = input.value.trim().toLowerCase().replace(/\\s+/g, '_');
                          setUser({
                            ...user,
                            permissions: { ...(user.permissions || {}), [key]: true }
                          });
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-600">Toggle fine-grained permissions below.</p>
                  {Object.entries(user.permissions || {}).map(([perm, value]) => (
                    <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <span className="font-medium text-slate-900 capitalize">{perm.replace(/_/g, ' ')} <span className="text-xs text-slate-400 ml-2">({perm})</span></span>
                      <button
                        onClick={() => setUser({
                          ...user,
                          permissions: {
                            ...user.permissions,
                            [perm]: !value
                          }
                        })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          value ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}"""

match = permissions_target.search(content)
if match:
    content = content[:match.start()] + new_permissions_block + content[match.end():]

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("UserManagement.tsx rebuilt.")
