import os
import re

files = [
    'frontend/src/inventory/components/MobileStockTake.tsx',
    'frontend/src/inventory/components/DailySheetView.tsx',
    'frontend/src/pages/SalesmanMobileApp.tsx',
    'frontend/src/pages/SalesmanAdmin.tsx'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Add table borders
        content = re.sub(
            r'<table\s+className="([^"]+)"',
            lambda m: f'<table className="{m.group(1)} border border-slate-200"' if 'border border-slate-200' not in m.group(1) else m.group(0),
            content
        )
        content = re.sub(
            r'<th\s+className="([^"]+)"',
            lambda m: f'<th className="{m.group(1)} border border-slate-200"' if 'border border-slate-200' not in m.group(1) else m.group(0),
            content
        )
        content = re.sub(
            r'<td\s+className="([^"]+)"',
            lambda m: f'<td className="{m.group(1)} border border-slate-200"' if 'border border-slate-200' not in m.group(1) else m.group(0),
            content
        )
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added borders in {filepath}")
