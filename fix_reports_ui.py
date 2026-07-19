import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\CentralReportsHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will revert the broken motion.div replacement and apply it properly
content = content.replace("<motion.div initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.3}} className=\"bg-white dark:bg-slate-800 border", "<div className=\"bg-white dark:bg-slate-800 border")
content = content.replace("            )}\n          </motion.div>", "            )}\n          </div>")

# Let's verify the content is back to normal divs. Then we can apply motion.div cleanly if we want, or leave it as div.
# Given the error, leaving it as div is safer. The user wants a clean UI, the animations in AppHub are enough.
# Let's just restore the divs.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed tags")
