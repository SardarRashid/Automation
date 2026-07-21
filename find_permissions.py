import io
with io.open(r'D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\pages\admin\UserManagement.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
idx = text.find("activeTab === 'permissions'")
print(text[idx-50:idx+2000])
