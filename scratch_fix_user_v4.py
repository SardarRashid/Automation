import os
import re

filepath = 'frontend/src/pages/admin/UserManagement.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import for getDefaultPermissions
if "import { getDefaultPermissions } from '../../config/PermissionsRegistry';" not in content:
    content = content.replace("import { getTemplateForRole } from '../../config/RoleRegistry';",
                              "import { getTemplateForRole } from '../../config/RoleRegistry';\nimport { getDefaultPermissions } from '../../config/PermissionsRegistry';")

# Update the System Role onChange
old_role_onchange = """                      onChange={(e) => {
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
                      }}"""

new_role_onchange = """                      onChange={(e) => {
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
                      }}"""

content = content.replace(old_role_onchange, new_role_onchange)

# Update the Permissions list renderer
old_perms_list = """                  {Object.entries(user.permissions || {}).map(([perm, value]) => (
                    <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">"""

new_perms_list = """                  {Object.entries({ ...getDefaultPermissions('ADMIN'), ...(user.permissions || {}) }).map(([perm, _]) => {
                    const value = user.permissions?.[perm] || false;
                    return (
                    <div key={perm} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">"""

content = content.replace(old_perms_list, new_perms_list)

# We must also fix the closing parenthesis because we added `return (` to the map block.
old_perms_end = """                      </button>
                    </div>
                  ))}
                </div>"""

new_perms_end = """                      </button>
                    </div>
                  )})}
                </div>"""

content = content.replace(old_perms_end, new_perms_end)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('UserManagement.tsx fully unified.')
