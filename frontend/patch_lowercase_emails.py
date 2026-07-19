import os

files_to_patch = [
    'D:/AntiGravity/inventory-web-workspace/frontend/src/App.tsx',
    'D:/AntiGravity/inventory-web-workspace/frontend/src/pages/AdminPanel.tsx',
    'D:/AntiGravity/InventorySuitAndroid/scanner-mobile-workspace/src/App.tsx',
    'D:/AntiGravity/InventorySuitAndroid/scanner-mobile-workspace/src/lib/firebase.ts',
    'D:/AntiGravity/InventorySuitAndroid/scanner-admin-web/src/App.tsx'
]

for file_path in files_to_patch:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content.replace(
        ".replace(/[.#$\\[\\]]/g, '_')",
        ".toLowerCase().replace(/[.#$\\[\\]]/g, '_')"
    )
    
    # In case it was already replaced
    new_content = new_content.replace(".toLowerCase().toLowerCase()", ".toLowerCase()")
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes needed for {file_path}")
