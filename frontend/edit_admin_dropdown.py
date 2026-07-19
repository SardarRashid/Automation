import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\AdminPanel.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the "Edit User" button in the dropdown
old_dropdown_btn = r"""<button
                                  onClick=\{\(e\) => \{ e\.stopPropagation\(\); setSelectedUserKey\(key\); setOpenMenuKey\(null\); \}\}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  Edit User
                                </button>"""

new_dropdown_btns = r"""<button
                                  onClick={(e) => { e.stopPropagation(); setEditingUser({key, email: u.email || '', role: u.role || 'scanner', password: u.password || ''}); setOpenMenuKey(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  Edit Credentials
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedUserKey(key); setOpenMenuKey(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  Manage Access
                                </button>"""

content = re.sub(old_dropdown_btn, new_dropdown_btns, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AdminPanel.tsx successfully.")
