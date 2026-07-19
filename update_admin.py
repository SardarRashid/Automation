import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AdminPanel.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { auth, database } from '../lib/firebase';", "import { auth, database } from '../lib/firebase';\nimport { permissionService } from '../services/permissions';")

# Refactor handleSaveUser
old_save_user = '''  const handleSaveUser = async (userKey: string, instantChanges?: any) => {
    const changes = instantChanges || stagedChanges[userKey];
    if (!changes) return;
    try {
      await update(ref(database, users/), changes);
      
      // Support for Barcode Sticker Printer Extension's comma-formatted keys
      if (changes.allowedApps?.extension && changes.email) {
        const extensionKey = changes.email.toLowerCase().replace(/\./g, ',');
        if (extensionKey !== userKey) {
          await update(ref(database, users/), changes).catch(console.error);
        }
      }
      setStagedChanges(prev => {
        const next = { ...prev };
        delete next[userKey];
        return next;
      });
      if (!instantChanges) alert('Changes saved successfully!');
    } catch (err: any) {
      alert('Error saving user: ' + err.message);
    }
  };'''

new_save_user = '''  const handleSaveUser = async (userKey: string, instantChanges?: any) => {
    const changes = instantChanges || stagedChanges[userKey];
    if (!changes) return;
    try {
      await permissionService.updateUser(userKey, changes, currentUser?.uid || 'unknown');
      setStagedChanges(prev => {
        const next = { ...prev };
        delete next[userKey];
        return next;
      });
      if (!instantChanges) alert('Changes saved successfully!');
    } catch (err: any) {
      alert('Error saving user: ' + err.message);
    }
  };'''

content = content.replace(old_save_user, new_save_user)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
