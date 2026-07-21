import os
import re

components_dir = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src\components'

# Mapping of method names to their exact argument names based on aiService.ts
method_args = {
    'calculateGranularJobMatch': ['cvText', 'jobDescription'],
    'generateInterviewQuestions': ['jobDescription', 'companyName', 'roleLevel'],
    'evaluateInterviewAnswer': ['question', 'answer', 'jobDescription'],
    'predictSalary': ['jobTitle', 'location', 'experience', 'profileData'],
    'generateLearningPath': ['targetRole', 'currentProfile'],
    'getCompanyIntelligence': ['companyName'],
    'generateDailyJobMatches': ['profile'],
    'generateOutreachEmail': ['company', 'hiringManager', 'profile'],
    'generateLinkedInNote': ['company', 'targetRole', 'profile'],
    'generateCareerRoadmap': ['profile'],
    'generateCoverLetter': ['profile', 'jobDescription', 'companyName'],
    'analyzeResume': ['cvText', 'targetJob']
}

for root, dirs, files in os.walk(components_dir):
    for f in files:
        if not f.endswith('.tsx'): continue
        filepath = os.path.join(root, f)
        
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
            
        if 'aiService' not in content:
            continue
            
        # Replace import
        content = re.sub(r"import \{ aiService \} from '\.\./services/aiService';", "import { API } from '../lib/apiClient';", content)
        
        # Replace method calls
        for method, args in method_args.items():
            if method in content:
                # We need to find `aiService.method(a, b, c)` and replace with `API.method({ arg1: a, arg2: b, arg3: c })`
                # Since regex is hard for nested parentheses, we can manually split.
                # A simpler regex that captures arguments separated by commas (assuming no nested commas in arguments for these specific calls)
                
                if len(args) == 1:
                    content = re.sub(rf"aiService\.{method}\((.*?)\)", rf"API.{method}({{ {args[0]}: \1 }})", content)
                elif len(args) == 2:
                    content = re.sub(rf"aiService\.{method}\((.*?),\s*(.*?)\)", rf"API.{method}({{ {args[0]}: \1, {args[1]}: \2 }})", content)
                elif len(args) == 3:
                    content = re.sub(rf"aiService\.{method}\((.*?),\s*(.*?),\s*(.*?)\)", rf"API.{method}({{ {args[0]}: \1, {args[1]}: \2, {args[2]}: \3 }})", content)
                elif len(args) == 4:
                    content = re.sub(rf"aiService\.{method}\((.*?),\s*(.*?),\s*(.*?),\s*(.*?)\)", rf"API.{method}({{ {args[0]}: \1, {args[1]}: \2, {args[2]}: \3, {args[3]}: \4 }})", content)
                    
        # Some methods were already migrated to server.ts but components might still use aiService.ts!
        # Let's catch those: generateCvVariant, generateOutreachEmail (wait, outreach is new), etc.
        if 'generateCvVariant' in content:
            content = re.sub(r"aiService\.generateCvVariant\((.*?),\s*(.*?),\s*(.*?)\)", r"API.generateCvVariant({ profileData: \1, variantName: \2, targetRole: \3 })", content)

        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
            
print("Refactored React components.")
