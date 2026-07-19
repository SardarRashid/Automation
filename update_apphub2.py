import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AppHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Change signature
if "interface AppHubProps" not in content:
    content = content.replace("export default function AppHub() {", "interface AppHubProps { onNavigate?: (tab: string) => void; }\n\nexport default function AppHub({ onNavigate }: AppHubProps) {")

# Find the button rendering part and add Test Locally
button_pattern = r'(<a\s*href=\{app\.downloadUrl\}\s*target="_blank"\s*rel="noopener noreferrer"\s*className=".*?">\s*<Download className="w-4 h-4 mr-2" />\s*.*?</a>)'

replacement = r'''\1
              {onNavigate && app.id === 'salesman-pwa' && (
                <button
                  onClick={() => onNavigate('salesman_mobile')}
                  className="mt-2 w-full bg-emerald-100 text-emerald-700 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center hover:bg-emerald-200 transition-colors"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Test Locally
                </button>
              )}'''

content = re.sub(button_pattern, replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AppHub.tsx")
