
import re

filepath = "Job-Portal/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add isDataLoaded right before profile
if "const [isDataLoaded, setIsDataLoaded]" not in content:
    content = content.replace(
        "const [profile, setProfile] = useState<UserProfile>(",
        "const [isDataLoaded, setIsDataLoaded] = useState(false);\n  const [profile, setProfile] = useState<UserProfile>("
    )

# Fix profile
content = re.sub(
    r"const \[profile, setProfile\] = useState<UserProfile>\(\(\) => \{[\s\S]*?return (\{[\s\S]*?id: \x27prof-1\x27,[\s\S]*?\});\n  \}\);",
    r"const [profile, setProfile] = useState<UserProfile>(\1);",
    content
)

# Fix rejections
content = re.sub(
    r"const \[rejections, setRejections\] = useState<RejectionLearning\[\]>\(\(\) => \{[\s\S]*?return (\[[\s\S]*?\]);\n  \}\);",
    r"const [rejections, setRejections] = useState<RejectionLearning[]>(\1);",
    content
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed App.tsx")

