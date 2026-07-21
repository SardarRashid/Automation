import os
import re

filepath = 'src/App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imports_to_add = """
import InterviewAssistant from './components/InterviewAssistant';
import SalaryPredictor from './components/SalaryPredictor';
"""
if "import InterviewAssistant" not in content:
    content = content.replace("import CoverLetterGenerator from './components/CoverLetterGenerator';", "import CoverLetterGenerator from './components/CoverLetterGenerator';\n" + imports_to_add)

# 2. Update Type
content = re.sub(
    r"useState<\s*([\'\w\s\|]+)\s*>\s*\(\s*'dashboard'\s*\);",
    lambda m: "useState<" + m.group(1).replace("\n", "") + " | 'interview_assistant' | 'salary_predictor'>('dashboard');" if "interview_assistant" not in m.group(1) else m.group(0),
    content
)

# 3. Add to Desktop Nav
if "{ id: 'interview_assistant'" not in content:
    desktop_nav_pattern = r"(\{\s*id:\s*'cover_letter',\s*label:\s*'Cover Letter Generator'\s*\})"
    desktop_new_nav = r"\1,\n              { id: 'interview_assistant', label: 'Interview Assistant' },\n              { id: 'salary_predictor', label: 'Salary Predictor' }"
    content = re.sub(desktop_nav_pattern, desktop_new_nav, content, count=1)

# 4. Add to Mobile Nav
if "{ id: 'interview_assistant', label: 'Interview' }" not in content:
    mobile_nav_pattern = r"(\{\s*id:\s*'cover_letter',\s*label:\s*'Letter'\s*\})"
    mobile_new_nav = r"\1,\n              { id: 'interview_assistant', label: 'Interview' },\n              { id: 'salary_predictor', label: 'Salary' }"
    content = re.sub(mobile_nav_pattern, mobile_new_nav, content, count=1)

# 5. Add rendering blocks inside AnimatePresence
rendering_block = """
            {activeTab === 'interview_assistant' && (
              <InterviewAssistant />
            )}

            {activeTab === 'salary_predictor' && (
              <SalaryPredictor profile={profile} />
            )}
"""

if "activeTab === 'interview_assistant'" not in content:
    # insert before {/* AI AUTOMATION AGENT HUB */}
    content = content.replace("{/* AI AUTOMATION AGENT HUB */}", rendering_block + "\n            {/* AI AUTOMATION AGENT HUB */}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx updated for Batch 3 successfully.")
