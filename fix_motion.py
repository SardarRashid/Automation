import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AppHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'motion/react';")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed motion import")
