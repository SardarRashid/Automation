
import os

filepath = "frontend/src/pages/AdminPanel.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update ALL_APPS
old_all_apps = "const ALL_APPS = [\x27desktop\x27, \x27app\x27, \x27scanner\x27, \x27scanner_admin\x27, \x27salesman\x27, \x27extension\x27];"
new_all_apps = "const ALL_APPS = [\x27desktop\x27, \x27app\x27, \x27scanner\x27, \x27scanner_admin\x27, \x27salesman\x27, \x27extension\x27, \x27jobPortal\x27];"
content = content.replace(old_all_apps, new_all_apps)

# 2. Update newAllowedApps logic
old_logic = "newAllowedApps[appKey] = (newUserRole === \x27admin\x27 || appKey === newUserRole || (newUserRole === \x27manager\x27 && appKey === \x27app\x27));"
new_logic = "newAllowedApps[appKey] = (newUserRole === \x27admin\x27 || appKey === newUserRole || (newUserRole === \x27manager\x27 && appKey === \x27app\x27) || (newUserRole === \x27applicant\x27 && appKey === \x27jobPortal\x27));"
content = content.replace(old_logic, new_logic)

# 3. Add to filterApp
old_filter_app = """<option value="Scanner">Scanner App</option>"""
new_filter_app = """<option value="jobPortal">Job Portal</option>\n                        <option value="Scanner">Scanner App</option>"""
content = content.replace(old_filter_app, new_filter_app)

# 4. Add to newUserRole (Add User Modal)
old_new_user_role = """<option value="extension">Sticker Printer Extension</option>"""
new_new_user_role = """<option value="extension">Sticker Printer Extension</option>\n                    <option value="applicant">Job Portal Applicant</option>"""
content = content.replace(old_new_user_role, new_new_user_role)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated AdminPanel.tsx!")

