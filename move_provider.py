import re

# Remove ThemeProvider from main.tsx
main_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\main.tsx"
with open(main_path, "r", encoding="utf-8") as f:
    main_content = f.read()

main_content = main_content.replace("import { ThemeProvider } from './contexts/ThemeContext'\n", "")
main_content = main_content.replace("<ThemeProvider>\n        <App />\n      </ThemeProvider>", "<App />")

with open(main_path, "w", encoding="utf-8") as f:
    f.write(main_content)

# Add ThemeProvider to App.tsx
app_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

if "ThemeProvider" not in app_content:
    app_content = app_content.replace("import { AIAssistant } from './components/ui/AIAssistant';", "import { AIAssistant } from './components/ui/AIAssistant';\nimport { ThemeProvider } from './contexts/ThemeContext';")
    
    # Wrap the return of App with ThemeProvider
    app_content = app_content.replace(
        """  return (
    <div className="flex h-screen""",
        """  return (
    <ThemeProvider>
    <div className="flex h-screen"""
    )
    
    # Add closing tag before the last closing div of App.tsx
    app_content = app_content.replace(
        """        <AIAssistant context="management" />
    </div>
  );""",
        """        <AIAssistant context="management" />
    </div>
    </ThemeProvider>
  );"""
    )

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_content)
print("Moved ThemeProvider to App.tsx")
