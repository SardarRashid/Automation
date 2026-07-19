import os
import re

files = [
    'frontend/src/inventory/components/MobileStockTake.tsx',
    'frontend/src/inventory/components/DailySheetView.tsx',
    'frontend/src/pages/SalesmanMobileApp.tsx',
    'frontend/src/pages/SalesmanAdmin.tsx'
]

font_replacements = [
    # Reverting text-lg back to text-sm
    (r'text-lg', 'text-sm'),
    # Reverting text-xl back to text-base
    (r'text-xl', 'text-base'),
    # Reverting text-base back to text-xs
    (r'text-base', 'text-xs'),
    # Except headers which we might want text-base or text-sm
    (r'text-3xl', 'text-2xl'),
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in font_replacements:
            content = re.sub(old, new, content)
            
        # Add table borders
        content = re.sub(
            r'<table\s+className="([^"]+)"',
            lambda m: f'<table className="{m.group(1)} border border-slate-200"' if 'border' not in m.group(1) else m.group(0),
            content
        )
        content = re.sub(
            r'<th\s+className="([^"]+)"',
            lambda m: f'<th className="{m.group(1)} border border-slate-200"' if 'border' not in m.group(1) else m.group(0),
            content
        )
        content = re.sub(
            r'<td\s+className="([^"]+)"',
            lambda m: f'<td className="{m.group(1)} border border-slate-200"' if 'border' not in m.group(1) else m.group(0),
            content
        )
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Adjusted fonts and borders in {filepath}")
    else:
        print(f"File not found: {filepath}")
