import os

admin_path = "frontend/src/pages/AdminPanel.tsx"
head_path = "scratch/AdminPanel_head_utf8.tsx"

with open(admin_path, "r", encoding="utf-8") as f:
    admin_content = f.read()

with open(head_path, "r", encoding="utf-8") as f:
    head_content = f.read()

start_idx = head_content.find("{activeView === 'users' && (")
end_idx = head_content.find("{activeView === 'pending' && (")

if start_idx == -1 or end_idx == -1:
    print("Could not find block in head")
    exit(1)

users_block = head_content[start_idx:end_idx].strip()

# Strip the opening {activeView === 'users' && ( and closing )}
inner_content = users_block[len("{activeView === 'users' && ("):-2] # last two chars should be `)}`

conditional_block = """{activeView === 'users' && (
  selectedUserKey ? (
    <UserManagement 
      userKey={selectedUserKey} 
      onBack={() => setSelectedUserKey(null)} 
    />
  ) : (""" + inner_content + """)
)}"""

target_str = "{activeView === 'users' && <UserManagement />}"
if target_str in admin_content:
    admin_content = admin_content.replace(target_str, conditional_block)
    with open(admin_path, "w", encoding="utf-8") as f:
        f.write(admin_content)
    print("Successfully patched AdminPanel.tsx")
else:
    print("Target string not found in AdminPanel.tsx")
