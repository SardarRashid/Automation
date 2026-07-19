
import re

filepath = "Job-Portal/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace profile
content = re.sub(
    r"const \[profile, setProfile\] = useState<UserProfile>\(\(\) => \{[\s\S]*?const saved = localStorage\.getItem\(\x27cv_auto_profile\x27\);[\s\S]*?return (\{[\s\S]*?id: \x27prof-1\x27[\s\S]*?\});\n  \}\);",
    r"const [profile, setProfile] = useState<UserProfile>(\1);",
    content
)

# If it still fails, let\x27s just replace the specific strings.
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")

