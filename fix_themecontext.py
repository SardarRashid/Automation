import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\contexts\ThemeContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace with React.useState
content = content.replace("import React, { createContext, useContext, useEffect, useState } from 'react';", "import React, { createContext, useContext } from 'react';")
content = content.replace("useState<Theme>", "React.useState<Theme>")
content = content.replace("useState(false)", "React.useState(false)")
content = content.replace("useEffect(()", "React.useEffect(()")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ThemeContext.tsx")
