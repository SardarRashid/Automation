import io

with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\admin\UserManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert System Role in details tab
# We find:
#                   <div>
#                     <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
#                     <input
#                       type="text"
#                       value={user.department || ''}
#                       onChange={(e) => setUser({ ...user, department: e.target.value })}
#                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
#                       placeholder="Enter department"
#                     />
#                   </div>
#                 </div>

target = """                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={user.department || ''}
                      onChange={(e) => setUser({ ...user, department: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                      placeholder="Enter department"
                    />
                  </div>
                </div>"""

replacement = """                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={user.department || ''}
                      onChange={(e) => setUser({ ...user, department: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                      placeholder="Enter department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">System Role</label>
                    <select
                      value={user.role || ''}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        const newAccess = getTemplateForRole(newRole);
                        const newPerms = getDefaultPermissions(newRole);
                        setUser({ 
                          ...user, 
                          role: newRole,
                          applicationAccess: {
                            ...(user.applicationAccess || {}),
                            ...newAccess
                          },
                          permissions: {
                            ...(user.permissions || {}),
                            ...newPerms
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
                </div>"""

if target in content:
    content = content.replace(target, replacement)
    print("Injected System Role successfully.")
else:
    print("Could not find Department block.")

# 2. Add custom permission state
# We find:
#   const [saving, setSaving] = useState(false);
#   const { addToast } = useToast();
target2 = """  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();"""

replacement2 = """  const [saving, setSaving] = useState(false);
  const [newPermissionKey, setNewPermissionKey] = useState('');
  const { addToast } = useToast();"""

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Injected newPermissionKey successfully.")
else:
    print("Could not find useState hook block.")


# 3. Replace the old roles and permissions tabs
# We find everything from: {activeTab === 'roles' && ( ... down to end of permissions ... )}
# Let's just use string find to replace it.

import re
roles_pattern = re.compile(r"\{\s*activeTab\s*===\s*'roles'.*?\}\s*\)\s*\}\s*\{\s*activeTab\s*===\s*'permissions'.*?\}\s*\)\s*\}", re.DOTALL)

new_permissions_block = """
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Add Custom Permission</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPermissionKey}
                      onChange={(e) => setNewPermissionKey(e.target.value)}
                      placeholder="e.g. custom_feature_access"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!newPermissionKey.trim()) return;
                        const key = newPermissionKey.trim().replace(/\s+/g, '_').toLowerCase();
                        setUser({
                          ...user,
                          permissions: {
                            ...(user.permissions || {}),
                            [key]: true
                          }
                        });
                        setNewPermissionKey('');
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-600 text-sm">Fine-grained permissions for each application. These override default role permissions if set explicitly.</p>
                  {Object.entries({ ...getDefaultPermissions('ADMIN'), ...(user.permissions || {}) }).map(([perm, _]) => {
                    const value = user.permissions?.[perm] || false;
                    return (
                      <div key={perm} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                        <span className="font-medium text-slate-900 capitalize">{perm.replace(/_/g, ' ')}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setUser({
                              ...user,
                              permissions: { ...(user.permissions || {}), [perm]: true }
                            })}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              value === true ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            Granted
                          </button>
                          <button
                            onClick={() => setUser({
                              ...user,
                              permissions: { ...(user.permissions || {}), [perm]: false }
                            })}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              value === false ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            Denied
                          </button>
                          <button
                            onClick={() => {
                              const newPerms = { ...user.permissions };
                              delete newPerms[perm];
                              setUser({ ...user, permissions: newPerms });
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              user.permissions?.[perm] === undefined ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            Inherit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
"""

if roles_pattern.search(content):
    content = roles_pattern.sub(new_permissions_block.strip(), content)
    print("Replaced roles and permissions successfully.")
else:
    print("Could not find roles and permissions block.")

# Wait! The tab button for 'roles' needs to be removed!
# { id: 'roles', label: 'App Roles', icon: Shield },
target_tab = "{ id: 'roles', label: 'App Roles', icon: Shield },"
if target_tab in content:
    content = content.replace(target_tab, "")
    print("Removed roles tab button.")

# Also remove 'roles' from activeTab type.
target_type = "<'details' | 'apps' | 'roles' | 'permissions' | 'password' | 'advanced'>"
replacement_type = "<'details' | 'apps' | 'permissions' | 'password' | 'advanced'>"
if target_type in content:
    content = content.replace(target_type, replacement_type)
    print("Updated activeTab type.")

with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\admin\UserManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
