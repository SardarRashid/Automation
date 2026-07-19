
import os
filepath = "C:\\Users\\rashid.siddique\\.gemini\\antigravity\\brain\\23695e28-842f-4b40-8dff-2cd7a1191bc2\\task.md"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("- `[ ]` Fix `cv_auto_emails` JSON parsing in `App.tsx`", "- `[x]` Fix `cv_auto_emails` JSON parsing in `App.tsx` (Replaced with RTDB load)")
content = content.replace("- `[ ]` Add missing Gmail OAuth token UI prompt", "- `[x]` Add missing Gmail OAuth token UI prompt")
content = content.replace("- `[ ]` Swap `localStorage` for Firebase Realtime Database in `App.tsx`", "- `[x]` Swap `localStorage` for Firebase Realtime Database in `App.tsx`")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

