import re

with open('d:/AntiGravity/inventory-web-workspace/frontend/src/pages/AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add secondaryAuth imports
import_block = """import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);
"""
content = content.replace("import ScannerTracking from './ScannerTracking';", "import ScannerTracking from './ScannerTracking';\n" + import_block)

# 2. Rewrite handleAddUser
old_add_user = """  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userKey = newUserEmail.toLowerCase().replace(/[.#$\\[\\]]/g, '_');
    
    try {
      // 1. Create the user in Firebase Auth via our backend endpoint
      // so it doesn't log the current admin out
      if (newUserRole !== 'pending') {
        const signUpRes = await fetch('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newUserEmail, password: newUserPass })
        });
        
        if (!signUpRes.ok) {
          const signUpData = await signUpRes.json();
          throw new Error(signUpData.error?.message || 'Failed to create Auth user');
        }
      }

      // 2. Add the user to the Realtime Database
      // Create initial allowedApps object based on the single role selected in the dropdown
      const newAllowedApps: Record<string, boolean> = {};
      const ALL_APPS = ['desktop', 'app', 'scanner', 'scanner_admin', 'salesman', 'extension'];
      ALL_APPS.forEach(appKey => {
        newAllowedApps[appKey] = (appKey === newUserRole || (newUserRole === 'manager' && appKey === 'app'));
      });

      const newPermissions: Record<string, boolean> = {};
      if (newUserRole === 'manager') {
        newPermissions.salesman_admin = true;
        newPermissions.reports = true;
        newPermissions.invoices = true;
        newPermissions.request_forms = true;
        newPermissions.inventory_app = true;
      }

      await set(ref(database, `users/${userKey}`), {
        email: newUserEmail,
        password: newUserPass, // Kept for legacy compatibility
        role: newUserRole === 'manager' ? 'app' : newUserRole,
        allowedApps: newAllowedApps,
        permissions: newPermissions
      });
      
      setNewUserEmail('');
      setNewUserPass('');
      alert(`User ${newUserEmail} successfully registered for ${newUserRole}!`);
    } catch (err: any) {
      console.error(err);
      alert(`Error registering user: ${err.message}`);
    }
  };"""

new_add_user = """  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userKey = newUserEmail.toLowerCase().replace(/[.#$\\[\\]]/g, '_');
    
    try {
      let uid = userKey;
      if (newUserRole !== 'pending') {
        try {
          const cred = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPass);
          uid = cred.user.uid;
        } catch (err: any) {
          if (err.code !== 'auth/email-already-in-use') {
            alert(`Failed to create Firebase Auth credential: ${err.message}`);
            return;
          }
        }
      }

      const newAllowedApps: Record<string, boolean> = {
        desktop: newUserRole === 'desktop',
        app: newUserRole === 'manager' || newUserRole === 'app',
        scanner: newUserRole === 'scanner',
        scanner_admin: newUserRole === 'scanner_admin',
        salesman: newUserRole === 'salesman',
        extension: newUserRole === 'extension',
        inventory_taking: newUserRole === 'inventory_taking',
        loginext: false
      };

      const newPermissions: Record<string, boolean> = {};
      if (newUserRole === 'manager' || newUserRole === 'app') {
        newPermissions.salesman_admin = true;
        newPermissions.reports = true;
        newPermissions.invoices = true;
        newPermissions.request_forms = true;
        newPermissions.inventory_app = true;
      }

      const userData = {
        email: newUserEmail,
        password: newUserPass,
        role: newUserRole === 'manager' ? 'app' : newUserRole,
        allowedApps: newAllowedApps,
        permissions: newPermissions
      };

      await set(ref(database, `users/${userKey}`), userData);
      if (uid !== userKey) {
        await set(ref(database, `users/${uid}`), userData);
        if (newUserRole === 'salesman') {
            await set(ref(database, `sales_users/${uid}`), { ...userData, id: uid, role: 'SALESPERSON', territory: 'North Territory' });
        }
      }
      
      setNewUserEmail('');
      setNewUserPass('');
      alert(`User ${newUserEmail} successfully registered!`);
    } catch (err: any) {
      console.error(err);
      alert(`Error registering user: ${err.message}`);
    }
  };"""

content = content.replace(old_add_user, new_add_user)

with open('d:/AntiGravity/inventory-web-workspace/frontend/src/pages/AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
