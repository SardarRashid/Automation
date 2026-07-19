
filepath = "frontend/src/pages/AdminPanel.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "        {/* User Slide-over Removed to prevent duplication */}\n      {/* Add User Modal */}",
    "        {/* User Slide-over Removed to prevent duplication */}\n      </div>\n      {/* Add User Modal */}"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

