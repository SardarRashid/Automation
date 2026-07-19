import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "import { AIAssistant }" not in content:
    content = content.replace("import { auth } from './lib/firebase';", "import { auth } from './lib/firebase';\nimport { AIAssistant } from './components/ui/AIAssistant';")

    # Add <AIAssistant context="management" /> right before the closing </div> of the main flex container
    # The structure has a <div className="flex h-screen bg-gray-100 overflow-hidden">
    # At the very end of App we return ( <div ...> ... </div> );
    # Let's insert it before the last </div>
    
    # Using regex to insert it before the very last </div>
    content = re.sub(r'(</div>\s*)$', r'  <AIAssistant context="management" />\n\1', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added AIAssistant to App.tsx")
else:
    print("Already added to App.tsx")
