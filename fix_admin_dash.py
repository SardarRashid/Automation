import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AdminPanel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'AdminDashboard' not in content:
    import_stmt = "import { AdminDashboard } from '../components/dashboards/AdminDashboard';\n"
    content = content.replace("import { firebaseConfig } from '../lib/firebase';", "import { firebaseConfig } from '../lib/firebase';\n" + import_stmt)

# 2. Replace dashboard block
# The block starts with {activeView === 'dashboard' && (
# We need to find the matching parenthesis.
start_idx = content.find("{activeView === 'dashboard' && (")
if start_idx != -1:
    # Find the end of the block
    paren_count = 0
    in_block = False
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == '(':
            paren_count += 1
            in_block = True
        elif content[i] == ')':
            paren_count -= 1
            if in_block and paren_count == 0:
                end_idx = i
                break
    
    if end_idx != -1:
        # also we need to replace the } after the parenthesis if it's there, but actually it's just {activeView === 'dashboard' && (<AdminDashboard />)}
        # Wait, the original is: {activeView === 'dashboard' && (\n <div className="max-w-7xl... > ... </div>\n)}
        
        replacement = "{activeView === 'dashboard' && <AdminDashboard />}"
        # We need to replace from start_idx up to end_idx + 1, plus any trailing } if it's wrapped in a {}
        # Let's just find {activeView === 'dashboard' && ( ... )}
        
        # In react, it is usually {activeView === 'dashboard' && ( ... )}
        # The { is before activeView.
        # So start_idx is exactly at {activeView === 'dashboard' && (
        # Wait, let's look back to the { and forward to the }
        bracket_start = content.rfind('{', 0, start_idx + 1)
        
        bracket_count = 0
        bracket_end = -1
        for i in range(bracket_start, len(content)):
            if content[i] == '{': bracket_count += 1
            elif content[i] == '}': 
                bracket_count -= 1
                if bracket_count == 0:
                    bracket_end = i
                    break
                    
        if bracket_end != -1:
            content = content[:bracket_start] + replacement + content[bracket_end+1:]
        
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced AdminDashboard")
