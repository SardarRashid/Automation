
import re

filepath = "Job-Portal/server.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix PORT
content = content.replace("const PORT = 3000;", "const PORT = process.env.PORT || 3000;")

# 2. Fix ArMan in /api/tailor-cv
content = content.replace(
    "const { masterCv, linkedIn, jobDescription, jobTitle, companyName, extraInstructions, country, category } = req.body;",
    "const { masterCv, linkedIn, jobDescription, jobTitle, companyName, extraInstructions, country, category, candidateName } = req.body;"
)
content = content.replace("ArMan\x27s", "${candidateName || \x27the candidate\x27}\x27s")
content = content.replace("ArMan", "${candidateName || \x27the candidate\x27}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated server.ts successfully!")

