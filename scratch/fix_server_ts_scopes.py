
import re

filepath = "Job-Portal/server.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure candidateName is extracted in all relevant endpoints, or safely default it
# We can do this by using req.body?.candidateName or req.body?.profile?.name
content = content.replace("${candidateName || \x27the candidate\x27}", "${req.body.candidateName || req.body.profile?.name || \x27the candidate\x27}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated scopes in server.ts!")

