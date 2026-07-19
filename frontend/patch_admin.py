import re

with open('src/pages/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Hide change password button
content = re.sub(
    r'<button\s+onClick=\{\(\) => handleUpdatePassword.*?title="Change Password"\s*>\s*<Key className="w-4 h-4" />\s*</button>',
    '',
    content,
    flags=re.DOTALL
)

# Remove the handleUpdatePassword function
content = re.sub(
    r'const handleUpdatePassword = async.*?};\n',
    '',
    content,
    flags=re.DOTALL
)

with open('src/pages/AdminPanel.tsx', 'w') as f:
    f.write(content)
