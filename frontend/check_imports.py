import os
import re

for root, _, files in os.walk(r'D:\AntiGravity\inventory-web-workspace\frontend\src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if 'useState(' in content and 'useState' not in content[:content.find('useState(')]:
                print(f"Missing useState import in: {path}")
            if 'handleLogout' in content and 'const handleLogout' not in content and 'function handleLogout' not in content:
                print(f"Uses handleLogout but might not define it in: {path}")
