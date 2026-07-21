import re

filepath = "frontend/src/pages/admin/UserManagement.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
if "import { CustomUser } from" not in content:
    content = content.replace(
        "import { APPLICATIONS } from '../../config/ApplicationRegistry';",
        "import { APPLICATIONS } from '../../config/ApplicationRegistry';\nimport { CustomUser } from '../../types/User';\nimport { getTemplateForRole } from '../../config/RoleRegistry';"
    )

# 2. Remove old CustomUser interface
# It starts with "interface CustomUser {" and ends with "  };" for applicationRoles
# We will use regex to find the interface and strip it.
pattern = re.compile(r"interface CustomUser \{.*?  \};?\n\s*\};?\n", re.DOTALL)
content = re.sub(pattern, "", content)

# 3. Add auto-template applying when role changes
# Let's look for `onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}`
role_change_pattern = re.compile(r"onChange=\{\(e\) => setEditingUser\(\{\s*\.\.\.editingUser,\s*role:\s*e\.target\.value\s*\}\)\}")
new_role_change = """onChange={(e) => {
                  const newRole = e.target.value;
                  const newAccess = getTemplateForRole(newRole);
                  setEditingUser({ 
                    ...editingUser, 
                    role: newRole,
                    applicationAccess: {
                      ...(editingUser.applicationAccess || {}),
                      ...newAccess
                    }
                  });
                }}"""
content = re.sub(role_change_pattern, new_role_change, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("UserManagement.tsx updated.")
