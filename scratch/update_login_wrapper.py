
import os

filepath = "Job-Portal/src/LoginWrapper.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update userKey creation
content = content.replace("replace(/\\./g, \x27,\x27)", "replace(/[.#$\[\]]/g, \x27_\x27)")

# 2. Update role to pending
content = content.replace("role: \x27applicant\x27, // Role for job portal users", "role: \x27pending\x27, // Role for job portal users")

# 3. Update jobPortal access logic
content = content.replace("if (userData.applicationAccess?.jobPortal) {", "if (userData.applicationAccess?.jobPortal && userData.role !== \x27pending\x27) {")

# 4. Set jobPortal: false on signup
content = content.replace("jobPortal: true", "jobPortal: false")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated LoginWrapper.tsx")

