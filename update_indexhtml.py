import re

file_path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "fonts.googleapis.com" not in content:
    font_link = """    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">"""
    
    content = content.replace("</head>", f"{font_link}\n  </head>")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added Inter font to index.html")
else:
    print("Already added.")
