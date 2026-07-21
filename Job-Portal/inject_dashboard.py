import os
import re

filepath = 'src/App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if missing
if "import ExecutiveDashboard" not in content:
    content = "import ExecutiveDashboard from './components/ExecutiveDashboard';\n" + content

# The dashboard is wrapped in {activeTab === 'dashboard' && ( <motion.div ... > ... </motion.div> )}
# Let's use regex to replace it
pattern = r"\{activeTab === 'dashboard' && \(\s*<motion\.div\s*key=\"dashboard\"[\s\S]*?\{/\* AI AUTOMATION AGENT HUB \*/\}"
replacement = r"""{activeTab === 'dashboard' && (
              <ExecutiveDashboard 
                applications={applications} 
                profile={profile} 
                automationLogs={automationLogs} 
              />
            )}
  
            {/* AI AUTOMATION AGENT HUB */}"""

new_content = re.sub(pattern, replacement, content, count=1)

if new_content != content:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Dashboard replaced successfully.")
else:
    print("Could not find the dashboard block to replace.")
