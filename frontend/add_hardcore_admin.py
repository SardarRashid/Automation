import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\App.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the block inside onValue:
target_code = """
        onValue(ref(database, `users/${userKey}`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
              setUserProfile(data);
              setUserRole(data.role || 'storekeeper');
              const hasAppAccess = data.allowedApps?.app === true || data.role === 'app' || data.role === 'it_admin' || data.role === 'admin';
              setAppAccess(hasAppAccess);
              
              // IT Admin overrides all permissions locally for the UI
              if (data.role === 'it_admin' || data.role === 'admin') {
"""

replacement_code = """
        onValue(ref(database, `users/${userKey}`), (snapshot) => {
            let data = snapshot.val() || {};
            
            // HARDCORE ADMIN OVERRIDE
            const isHardcoreAdmin = currentUser.email?.toLowerCase() === 'sardarrashid121@gmail.com' || currentUser.email?.toLowerCase() === 'superadmin@test.com';
            if (isHardcoreAdmin) {
                data = { ...data, role: 'it_admin', allowedApps: { app: true, desktop: true, extension: true, salesman: true, scanner: true, scanner_admin: true } };
            }
            
            if (data && (Object.keys(data).length > 0 || isHardcoreAdmin)) {
              setUserProfile(data);
              setUserRole(data.role || 'storekeeper');
              const hasAppAccess = data.allowedApps?.app === true || data.role === 'app' || data.role === 'it_admin' || data.role === 'admin' || isHardcoreAdmin;
              setAppAccess(hasAppAccess);
              
              // IT Admin overrides all permissions locally for the UI
              if (data.role === 'it_admin' || data.role === 'admin' || isHardcoreAdmin) {
"""

content = content.replace(target_code, replacement_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx successfully.")
