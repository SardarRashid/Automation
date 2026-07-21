import io

with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\admin\UserManagement.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find("{activeTab === 'details'")
new_text = text[:idx] + '          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n'

with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\admin\UserManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(new_text)
