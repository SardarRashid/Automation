import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\CentralReportsHub.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the 5 closing divs with 4 closing divs.
old_divs = """          </div>
          </div>
        </div>
      </div>
    </div>
  );"""

new_divs = """          </div>
        </div>
      </div>
    </div>
  );"""

content = content.replace(old_divs, new_divs)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Removed extra div")
