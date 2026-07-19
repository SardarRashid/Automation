import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\main.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "ThemeProvider" not in content:
    content = content.replace("import App from './App.tsx'", "import App from './App.tsx'\nimport { ThemeProvider } from './contexts/ThemeContext'")
    
    content = content.replace("<App />", "<ThemeProvider>\n        <App />\n      </ThemeProvider>")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added ThemeProvider to main.tsx")
else:
    print("Already added.")
