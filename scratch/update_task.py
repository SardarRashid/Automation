
import os
filepath = "C:\\Users\\rashid.siddique\\.gemini\\antigravity\\brain\\23695e28-842f-4b40-8dff-2cd7a1191bc2\\task.md"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("- `[/]` Verify frontend build and deploy", "- `[x]` Verify frontend build and deploy")
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

