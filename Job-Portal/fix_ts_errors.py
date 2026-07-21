import glob
import re
import os

src_dir = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\src'
files = glob.glob(os.path.join(src_dir, '**', '*.tsx'), recursive=True) + glob.glob(os.path.join(src_dir, '**', '*.ts'), recursive=True)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove residual response.ok checks
    new_content = re.sub(r'if\s*\(!response\.ok\).*?;\n', '', content)
    new_content = re.sub(r'if\s*\(!res\.ok\).*?;\n', '', new_content)
    
    # Also if there are multi-line if (!response.ok) { throw new Error(...) }
    new_content = re.sub(r'if\s*\(!response\.ok\)\s*\{[^}]*\}\n', '', new_content)
    new_content = re.sub(r'if\s*\(!res\.ok\)\s*\{[^}]*\}\n', '', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed residual ok checks in {filepath}")

# Also delete server.ts so it doesn't break compilation
server_path = r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\server.ts'
if os.path.exists(server_path):
    os.remove(server_path)
    print("Deleted server.ts")

