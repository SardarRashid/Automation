import os
import re

admin_console_path = 'frontend/src/inventory/components/AdminConsole.tsx'
with open(admin_console_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

if 'handleClearAllInventory' not in admin_content:
    # Add clear handler
    handlers = """
  const handleClearAllInventory = async () => {
    if (window.confirm("Are you absolutely SURE you want to clear ALL inventory records? This action is irreversible.")) {
      try {
        await set(ref(database, 'inventory_records'), null);
        alert("All inventory data cleared.");
      } catch (e) {
        alert("Failed to clear data.");
        console.error(e);
      }
    }
  };
"""
    # Need to import set and ref from firebase/database if not imported
    if 'set(' not in admin_content and 'ref(' not in admin_content:
        admin_content = admin_content.replace(
            "import { getStorekeepers, saveStorekeeper, deleteStorekeeper, getStoreRooms } from \"../services/dbService\";",
            "import { getStorekeepers, saveStorekeeper, deleteStorekeeper, getStoreRooms } from \"../services/dbService\";\nimport { ref, set } from 'firebase/database';\nimport { database } from '../../lib/firebase';"
        )
    elif 'ref(' not in admin_content:
         admin_content = admin_content.replace(
            "import { getStorekeepers, saveStorekeeper, deleteStorekeeper, getStoreRooms } from \"../services/dbService\";",
            "import { getStorekeepers, saveStorekeeper, deleteStorekeeper, getStoreRooms } from \"../services/dbService\";\nimport { ref, set } from 'firebase/database';\nimport { database } from '../../lib/firebase';"
        )
    
    admin_content = re.sub(r'(  return \()', handlers + r'\1', admin_content, count=1)
    
    # Add button
    # There is a button with UserPlus "Add Storekeeper"
    admin_content = admin_content.replace(
        '<button onClick={() => setFormMode(true)}',
        '<button onClick={handleClearAllInventory} className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 transition-colors mr-2"><Trash2 className="w-4 h-4" /> Clear All Data</button>\n          <button onClick={() => setFormMode(true)}'
    )
    
    with open(admin_console_path, 'w', encoding='utf-8') as f:
        f.write(admin_content)
    print("Added Clear All Data to AdminConsole.tsx")
