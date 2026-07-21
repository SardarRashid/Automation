import os
import re

filepath = 'src/App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imports_to_add = """
import OutreachGenerator from './components/OutreachGenerator';
import PerformanceAnalytics from './components/PerformanceAnalytics';
"""
if "import OutreachGenerator" not in content:
    content = content.replace("import DocumentCenter from './components/DocumentCenter';", "import DocumentCenter from './components/DocumentCenter';\n" + imports_to_add)

# 2. Update Type
content = re.sub(
    r"useState<\s*([\'\w\s\|]+)\s*>\s*\(\s*'dashboard'\s*\);",
    lambda m: "useState<" + m.group(1).replace("\n", "") + " | 'outreach' | 'analytics'>('dashboard');" if "outreach" not in m.group(1) else m.group(0),
    content
)

# 3. Add to Desktop Nav
if "{ id: 'outreach'" not in content:
    desktop_nav_pattern = r"(\{\s*id:\s*'document_center',\s*label:\s*'Document Center'\s*\})"
    desktop_new_nav = r"\1,\n              { id: 'outreach', label: 'Networking & Outreach' },\n              { id: 'analytics', label: 'Performance Analytics' }"
    content = re.sub(desktop_nav_pattern, desktop_new_nav, content, count=1)

# 4. Add to Mobile Nav
if "{ id: 'outreach', label: 'Network' }" not in content:
    mobile_nav_pattern = r"(\{\s*id:\s*'document_center',\s*label:\s*'Docs'\s*\})"
    mobile_new_nav = r"\1,\n              { id: 'outreach', label: 'Network' },\n              { id: 'analytics', label: 'Analytics' }"
    content = re.sub(mobile_nav_pattern, mobile_new_nav, content, count=1)

# 5. Add rendering blocks inside AnimatePresence
rendering_block = """
            {activeTab === 'outreach' && (
              <OutreachGenerator profile={profile} />
            )}

            {activeTab === 'analytics' && (
              <PerformanceAnalytics />
            )}
"""

if "activeTab === 'outreach'" not in content:
    content = content.replace("{/* AI AUTOMATION AGENT HUB */}", rendering_block + "\n            {/* AI AUTOMATION AGENT HUB */}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx updated for Batch 5 successfully.")
