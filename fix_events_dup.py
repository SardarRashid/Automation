import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\services\core\EventTypes.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Deduplicate
enum_content_match = re.search(r'export enum BusinessEventType \{(.*?)\}', content, re.DOTALL)
if enum_content_match:
    lines = enum_content_match.group(1).split('\n')
    seen = set()
    new_lines = []
    for line in lines:
        match = re.search(r'^\s*([A-Z_]+)\s*=', line)
        if match:
            key = match.group(1)
            if key in seen:
                continue
            seen.add(key)
        new_lines.append(line)
    
    new_enum = "export enum BusinessEventType {" + '\n'.join(new_lines) + "}"
    content = content[:enum_content_match.start()] + new_enum + content[enum_content_match.end():]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Deduplicated EventTypes.ts")
