import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\InventoryApp.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if "OfflineIndicator" not in content:
    imports = """import { OfflineIndicator } from '../components/mobile/OfflineIndicator';
import { SuccessOverlay } from '../components/mobile/SuccessOverlay';
"""
    content = re.sub(r'(import React.*?;)', rf'\1\n{imports}', content)

# 2. Add Hooks and Success State
if "const [showSuccess" not in content:
    hooks = """
  // Mobile UX Hooks
  const [showSuccess, setShowSuccess] = useState(false);
"""
    content = re.sub(r'(const \[error, setError\] = useState<string \| null>\(null\);)', rf'\1\n{hooks}', content)

# 3. Add Success Overlay and Offline Indicator to the main render
if "<OfflineIndicator />" not in content:
    render_insert = """
      <OfflineIndicator />
      <SuccessOverlay isVisible={showSuccess} message="Action Completed!" />
"""
    content = re.sub(r'(<div className="min-h-screen bg-slate-50 flex flex-col">)', rf'\1{render_insert}', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("InventoryApp refactored.")
