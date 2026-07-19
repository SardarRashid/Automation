import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the permissions logic using regex to handle whitespace differences
content = re.sub(
    r'if\s*\(data\.permissions\)\s*\{\s*setPermissions\(data\.permissions\);\s*if\s*\(!data\.permissions\[activeTab\]\)\s*\{\s*const\s+firstAllowed\s*=\s*Object\.keys\(data\.permissions\)\.find\(k\s*=>\s*data\.permissions\[k\]\s*===\s*true\);\s*if\s*\(firstAllowed\)\s*setActiveTab\(firstAllowed\);\s*else\s*setActiveTab\(''\);\s*\}\s*\}\s*else\s*\{\s*setPermissions\(\{\}\);\s*setActiveTab\(''\);\s*\}',
    '''const combinedPermissions: Record<string, boolean> = { ...(data.permissions || {}) };
                if (data.allowedApps?.scanner_admin) combinedPermissions.scanner_tracking = true;
                if (data.allowedApps?.salesman) combinedPermissions.salesman_admin = true;
                if (data.allowedApps?.extension || data.allowedApps?.scanner || data.allowedApps?.desktop || data.allowedApps?.app || data.allowedApps?.scanner_admin || data.allowedApps?.salesman) {
                  combinedPermissions.app_hub = true;
                }

                setPermissions(combinedPermissions);
                
                if (Object.keys(combinedPermissions).length > 0) {
                  if (!combinedPermissions[activeTab]) {
                    const firstAllowed = Object.keys(combinedPermissions).find(k => combinedPermissions[k] === true);
                    if (firstAllowed) setActiveTab(firstAllowed);
                  }
                } else {
                  setActiveTab('');
                }''',
    content,
    flags=re.DOTALL
)

# Replace the access restricted condition
content = re.sub(
    r'\{\(appAccess\s*===\s*false\s*\|\|\s*Object\.keys\(permissions\)\.length\s*===\s*0\)\s*&&\s*user\?\.email\s*!==\s*\'sardarrashid121@gmail\.com\'\s*\?\s*\(',
    "{(appAccess === false && Object.keys(permissions).length === 0) && user?.email !== 'sardarrashid121@gmail.com' ? (",
    content
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done patching App.tsx")
