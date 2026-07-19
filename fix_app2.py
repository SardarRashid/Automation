import re
with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I accidentally added lines 90-101 which are duplicates of 81-89.
# Let's just fix it using replace_file_content instead of regex to be safe.
