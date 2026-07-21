import os
import re

filepath = 'frontend/src/pages/SalesmanAdmin.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the RBAC definitions
content = re.sub(r'export type UserRole = .*?;\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'export interface UserPermissions \{\n  \[key: string\]: boolean;\n\}\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'export const getDefaultPermissions = .*?\n\n', '', content, flags=re.DOTALL)

# Find the start of export interface User to clip the hasAccess function
# We use a non-greedy match to drop everything up to export interface User
content = re.sub(r'export const hasAccess = .*?\nexport interface User \{', 'export interface User {', content, flags=re.DOTALL)

# Add imports
imports = "import { UserRole, UserPermissions, getDefaultPermissions, hasAccess } from '../config/PermissionsRegistry';\n"

if "from 'lucide-react';" in content:
    content = content.replace("from 'lucide-react';\n", "from 'lucide-react';\n" + imports)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('SalesmanAdmin.tsx cleaned.')
