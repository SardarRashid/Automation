import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\eslint.config.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "'preserve-caught-error': 'off'" not in content:
    content = content.replace(
        "'@typescript-eslint/no-unused-vars': 'off',",
        "'@typescript-eslint/no-unused-vars': 'off',\n      'preserve-caught-error': 'off',"
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added preserve-caught-error off")
