
import re

filepath = "Job-Portal/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { initializeApp, getApps, getApp } from \x27firebase/app\x27;", "")
content = content.replace("import firebaseConfig from \x27../firebase-applet-config.json\x27;", "")
content = content.replace("const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();", "")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Removed redundant Firebase init from App.tsx")

