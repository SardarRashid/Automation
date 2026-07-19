import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\CentralReportsHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded light mode colors with dark mode alternatives
replacements = {
    "bg-slate-50": "bg-slate-50 dark:bg-slate-900",
    "bg-white": "bg-white dark:bg-slate-800",
    "border-slate-200": "border-slate-200 dark:border-slate-700",
    "text-slate-800": "text-slate-800 dark:text-slate-100",
    "text-slate-700": "text-slate-700 dark:text-slate-200",
    "text-slate-600": "text-slate-600 dark:text-slate-300",
    "text-slate-500": "text-slate-500 dark:text-slate-400",
    "text-indigo-700": "text-indigo-700 dark:text-indigo-400",
    "text-indigo-600": "text-indigo-600 dark:text-indigo-400",
    "bg-indigo-600": "bg-indigo-600 dark:bg-indigo-500",
    "bg-indigo-700": "bg-indigo-700 dark:bg-indigo-600",
    "bg-indigo-50": "bg-indigo-50 dark:bg-indigo-900/30",
    "border-indigo-200": "border-indigo-200 dark:border-indigo-800",
    "divide-slate-100": "divide-slate-100 dark:divide-slate-700"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Skeletons for loading state instead of text
skeleton = """              <div className="h-full p-4 space-y-4 w-full">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/4 mb-6"></div>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse w-1/6"></div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse w-2/6"></div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse w-1/6"></div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse w-2/6"></div>
                  </div>
                ))}
              </div>"""

content = content.replace("""              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400">
                <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
                <p>Generating Report Data...</p>
              </div>""", skeleton)
              
# Add motion import and apply it to the main table container
if "framer-motion" not in content and "motion/react" not in content:
    content = content.replace("import { exportToCSV", "import { motion } from 'motion/react';\nimport { exportToCSV")
    content = content.replace("<div className=\"bg-white dark:bg-slate-800 border", "<motion.div initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.3}} className=\"bg-white dark:bg-slate-800 border")
    content = content.replace("            )}", "            )}\n          </motion.div>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated CentralReportsHub UI")
