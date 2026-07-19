import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend\src\services\OfflineSyncEngine.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

persist_code = """
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) {
          console.log('[OfflineSync] Storage will not be cleared except by explicit user action');
        } else {
          console.warn('[OfflineSync] Storage may be cleared by the browser under storage pressure.');
        }
      });
    }
"""

if "navigator.storage.persist" not in content:
    content = content.replace(
        "if (typeof window !== 'undefined') {",
        persist_code + "\n    if (typeof window !== 'undefined') {"
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added navigator.storage.persist to OfflineSyncEngine")
else:
    print("Already exists")
