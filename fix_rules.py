import re
with open('database.rules.json', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("sardarrashid121_gmail_com", "sardarrashid121@gmail_com")

with open('database.rules.json', 'w', encoding='utf-8') as f:
    f.write(content)
