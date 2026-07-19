
import re

filepath = "frontend/src/pages/AdminPanel.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "        {/* User Slide-over */}"
end_marker = "      {/* Add User Modal */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + "        {/* User Slide-over Removed to prevent duplication */}\n" + content[end_idx:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully removed User Slide-over.")
else:
    print(f"Could not find markers. start_idx={start_idx}, end_idx={end_idx}")

