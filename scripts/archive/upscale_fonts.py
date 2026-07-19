import os
import re

files = [
    'frontend/src/inventory/components/MobileStockTake.tsx',
    'frontend/src/inventory/components/DailySheetView.tsx',
    'frontend/src/pages/SalesmanMobileApp.tsx',
    'frontend/src/pages/SalesmanAdmin.tsx'
]

replacements = [
    (r'text-\[9px\]', 'text-sm'),
    (r'text-\[10px\]', 'text-base'),
    (r'text-\[11px\]', 'text-lg'),
    (r'text-xs', 'text-base'),
    (r'text-sm', 'text-lg'),
    (r'text-md', 'text-xl')
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in replacements:
            content = re.sub(old, new, content)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Upscaled fonts in {filepath}")
    else:
        print(f"File not found: {filepath}")
