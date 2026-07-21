import os
import re

filepath = 'src/App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imports_to_add = """
import CompanyIntelligence from './components/CompanyIntelligence';
import DailyJobDiscovery from './components/DailyJobDiscovery';
import DocumentCenter from './components/DocumentCenter';
"""
if "import CompanyIntelligence" not in content:
    content = content.replace("import SalaryPredictor from './components/SalaryPredictor';", "import SalaryPredictor from './components/SalaryPredictor';\n" + imports_to_add)

# 2. Update Type
content = re.sub(
    r"useState<\s*([\'\w\s\|]+)\s*>\s*\(\s*'dashboard'\s*\);",
    lambda m: "useState<" + m.group(1).replace("\n", "") + " | 'company_intelligence' | 'daily_discovery' | 'document_center'>('dashboard');" if "company_intelligence" not in m.group(1) else m.group(0),
    content
)

# 3. Add to Desktop Nav
if "{ id: 'company_intelligence'" not in content:
    desktop_nav_pattern = r"(\{\s*id:\s*'salary_predictor',\s*label:\s*'Salary Predictor'\s*\})"
    desktop_new_nav = r"\1,\n              { id: 'company_intelligence', label: 'Company Intelligence' },\n              { id: 'daily_discovery', label: 'Daily Job Discovery' },\n              { id: 'document_center', label: 'Document Center' }"
    content = re.sub(desktop_nav_pattern, desktop_new_nav, content, count=1)

# 4. Add to Mobile Nav
if "{ id: 'company_intelligence', label: 'Intel' }" not in content:
    mobile_nav_pattern = r"(\{\s*id:\s*'salary_predictor',\s*label:\s*'Salary'\s*\})"
    mobile_new_nav = r"\1,\n              { id: 'company_intelligence', label: 'Intel' },\n              { id: 'daily_discovery', label: 'Discovery' },\n              { id: 'document_center', label: 'Docs' }"
    content = re.sub(mobile_nav_pattern, mobile_new_nav, content, count=1)

# 5. Add rendering blocks inside AnimatePresence
rendering_block = """
            {activeTab === 'company_intelligence' && (
              <CompanyIntelligence />
            )}

            {activeTab === 'daily_discovery' && (
              <DailyJobDiscovery profile={profile} />
            )}

            {activeTab === 'document_center' && (
              <DocumentCenter profile={profile} />
            )}
"""

if "activeTab === 'company_intelligence'" not in content:
    content = content.replace("{/* AI AUTOMATION AGENT HUB */}", rendering_block + "\n            {/* AI AUTOMATION AGENT HUB */}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx updated for Batch 4 successfully.")
