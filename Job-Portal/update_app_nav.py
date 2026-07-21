import os
import re

filepath = 'src/App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imports_to_add = """
import CareerCoach from './components/CareerCoach';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import CoverLetterGenerator from './components/CoverLetterGenerator';
"""
if "import CareerCoach" not in content:
    content = content.replace("import UserProfileBuilder from './components/UserProfileBuilder';", "import UserProfileBuilder from './components/UserProfileBuilder';\n" + imports_to_add)

# 2. Update Type
type_pattern = r"useState<\'dashboard\' \| \'automation\' \| \'cv_manager\' \| \'learning\' \| \'tracker\' \| \n?\'scanner\' \| \'profile\' \| \'settings\'>"
new_type = "useState<'dashboard' | 'automation' | 'cv_manager' | 'learning' | 'tracker' | 'scanner' | 'profile' | 'settings' | 'career_coach' | 'resume_analyzer' | 'cover_letter'>"
# A more robust regex for type:
content = re.sub(
    r"useState<\s*([\'\w\s\|]+)\s*>\s*\(\s*'dashboard'\s*\);",
    lambda m: "useState<" + m.group(1).replace("\n", "") + " | 'career_coach' | 'resume_analyzer' | 'cover_letter'>('dashboard');" if "career_coach" not in m.group(1) else m.group(0),
    content
)

# 3. Add to Desktop Nav
if "{ id: 'career_coach'" not in content:
    desktop_nav_pattern = r"(\{\s*id:\s*'profile',\s*label:\s*'My Profile'\s*\})"
    desktop_new_nav = r"\1,\n              { id: 'career_coach', label: 'Career Coach' },\n              { id: 'resume_analyzer', label: 'Resume Analyzer' },\n              { id: 'cover_letter', label: 'Cover Letter Generator' }"
    content = re.sub(desktop_nav_pattern, desktop_new_nav, content, count=1)

# 4. Add to Mobile Nav
if "{ id: 'career_coach', label: 'Coach' }" not in content:
    mobile_nav_pattern = r"(\{\s*id:\s*'profile',\s*label:\s*'Profile'\s*\})"
    mobile_new_nav = r"\1,\n              { id: 'career_coach', label: 'Coach' },\n              { id: 'resume_analyzer', label: 'ATS' },\n              { id: 'cover_letter', label: 'Letter' }"
    content = re.sub(mobile_nav_pattern, mobile_new_nav, content, count=1)

# 5. Add rendering blocks inside AnimatePresence
rendering_block = """
            {activeTab === 'career_coach' && (
              <CareerCoach profile={profile} />
            )}

            {activeTab === 'resume_analyzer' && (
              <ResumeAnalyzer />
            )}

            {activeTab === 'cover_letter' && (
              <CoverLetterGenerator profile={profile} />
            )}
"""

if "activeTab === 'career_coach'" not in content:
    # insert before {/* AI AUTOMATION AGENT HUB */}
    content = content.replace("{/* AI AUTOMATION AGENT HUB */}", rendering_block + "\n            {/* AI AUTOMATION AGENT HUB */}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx updated successfully.")
