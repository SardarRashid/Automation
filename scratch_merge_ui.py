import os
import re

old_path = r'Job-Portal/src/App.tsx'
new_path = r'D:\AntiGravity\Latest_Active_Apps\New folder\App.tsx'

with open(old_path, 'r', encoding='utf-8') as f:
    old_content = f.read()

with open(new_path, 'r', encoding='utf-8') as f:
    new_content = f.read()

# 1. Update lucide imports
old_lucide = re.search(r'import \{[\s\S]*?\} from \'lucide-react\';', old_content).group(0)
new_lucide = re.search(r'import \{[\s\S]*?\} from \'lucide-react\';', new_content).group(0)
old_content = old_content.replace(old_lucide, new_lucide)

# 2. Add state for tools/you sheets
state_injection = """
  // New Mobile Sheets State
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [isYouSheetOpen, setIsYouSheetOpen] = useState(false);
  const toolsTabs = ['cv_manager', 'learning', 'scanner'] as const;
  const youTabs = ['profile', 'settings'] as const;
"""
old_content = old_content.replace('const [isDataLoaded, setIsDataLoaded] = useState(false);', 'const [isDataLoaded, setIsDataLoaded] = useState(false);\n' + state_injection)

# 3. Replace the Main Header / Navigation and Sidebar with the new one
# The old content has:
#       {/* Main Header / Navigation */}
#       <header ...>...</header>
#       <div className="flex flex-1 overflow-hidden">
#           {/* Desktop Sidebar */}
#           <aside ...>...</aside>
#           {/* Main Content Area */}
#           ...

# The new content has:
#       {/* Main Header / Navigation */}
#       <header ...>...</header>
#       <div className="flex flex-1 overflow-hidden">
#           {/* Main Content Area */}

def extract_between(text, start, end, include_end=False):
    s_idx = text.find(start)
    if s_idx == -1: return None
    e_idx = text.find(end, s_idx)
    if e_idx == -1: return None
    if include_end:
        e_idx += len(end)
    return text[s_idx:e_idx]

old_header_sidebar = extract_between(old_content, '      {/* Main Header / Navigation */}', '{/* Main Content Area */}')
new_header_sidebar = extract_between(new_content, '      {/* Main Header / Navigation */}', '{/* Main Content Area */}')

old_content = old_content.replace(old_header_sidebar, new_header_sidebar)

# 4. Insert the mobile bottom nav and sheets at the end
new_bottom_nav = extract_between(new_content, '      {/* Mobile bottom tab bar', '    </div>\n  );\n}\n', include_end=False)
# Remove anything before the final </div> in old_content
old_bottom_nav = extract_between(old_content, '      {/* Mobile bottom tab bar', '    </div>\n  );\n}\n', include_end=False)

if old_bottom_nav:
    old_content = old_content.replace(old_bottom_nav, new_bottom_nav)
else:
    # Find the last </div>
    last_div = '    </div>\n  );\n}'
    old_content = old_content.replace(last_div, new_bottom_nav + '\n' + last_div)

# 5. Fix any missing ExecutiveDashboard render if the new file removed it
# If ExecutiveDashboard is missing in activeTab === 'dashboard' in the new layout, we need to ensure it's there.
# Let's write the modified file first.
with open('scratch_merge_test.tsx', 'w', encoding='utf-8') as f:
    f.write(old_content)
