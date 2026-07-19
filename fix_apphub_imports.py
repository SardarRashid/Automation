import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AppHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the lucide-react import and add the new ones
content = content.replace("import { Download, Globe, Smartphone, AppWindow, Wrench } from 'lucide-react';", "import { Download, Globe, Smartphone, AppWindow, Wrench, Sun, Moon } from 'lucide-react';\nimport { motion } from 'motion/react';\nimport { useTheme } from '../contexts/ThemeContext';")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added useTheme and motion imports")
