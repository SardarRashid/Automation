
import os
filepath = "C:\\Users\\rashid.siddique\\.gemini\\antigravity\\brain\\23695e28-842f-4b40-8dff-2cd7a1191bc2\\task.md"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("- `[ ]` Cleanup `firebase-applet-config.json`", "- `[x]` Cleanup `firebase-applet-config.json`")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

