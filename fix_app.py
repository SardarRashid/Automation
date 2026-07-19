import re
with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("user?.email === 'sardarrashid121@gmail.com'", "userRole === 'it_admin'")
content = content.replace("user?.email !== 'sardarrashid121@gmail.com'", "userRole !== 'it_admin'")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
