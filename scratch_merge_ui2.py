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

# 3. Replace <header>...</header>
def get_block(content, start_marker, end_marker):
    start = content.find(start_marker)
    if start == -1: return None
    end = content.find(end_marker, start)
    if end == -1: return None
    return content[start:end + len(end_marker)]

old_header = get_block(old_content, '      {/* Main Header / Navigation */}', '      </header>')
new_header = get_block(new_content, '      {/* Main Header / Navigation */}', '      </header>')

if old_header and new_header:
    old_content = old_content.replace(old_header, new_header)

# 4. Remove old Mobile Tab Helper Drawer
old_drawer = get_block(old_content, '        {/* Mobile Tab Helper Drawer if viewport is small */}', '        </div>')
if old_drawer:
    old_content = old_content.replace(old_drawer, '')

# 5. Extract new bottom nav and sheets
new_bottom_nav_start = '      {/* Mobile bottom tab bar'
new_bottom_nav_end = '      </AnimatePresence>'

new_bottom_nav = get_block(new_content, new_bottom_nav_start, new_bottom_nav_end)

# The new_bottom_nav contains the first AnimatePresence. We actually need ALL of them.
# So let's extract everything from "Mobile bottom tab bar" to the end of the file except the last 2 lines.
start_idx = new_content.find('      {/* Mobile bottom tab bar')
if start_idx != -1:
    end_idx = new_content.rfind('    </div>')
    new_bottom_blocks = new_content[start_idx:end_idx].strip()
    
    # Now find the last </div> in old_content and inject
    old_end_idx = old_content.rfind('    </div>')
    old_content = old_content[:old_end_idx] + '\n      ' + new_bottom_blocks + '\n\n' + old_content[old_end_idx:]

with open(old_path, 'w', encoding='utf-8') as f:
    f.write(old_content)
print("UI Successfully merged!")
