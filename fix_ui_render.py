import re

def insert_component(file_path, comp_string):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if we already successfully inserted it to avoid double insertion
    if f"<AIAssistant context" in content:
        print(f"Already rendered in {file_path}")
        return

    # Replace the last `  );\n}` with the component string
    pattern = re.compile(r'(\s*</div>\s*\);\s*\}\s*(export default \w+;)?\s*)$')
    if pattern.search(content):
        content = pattern.sub(rf'\n        {comp_string}\1', content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully inserted into {file_path}")
    else:
        print(f"Could not find end of component in {file_path}")

insert_component(r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx', '<AIAssistant context="management" />')
insert_component(r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\InventoryApp.tsx', '<AIAssistant context="inventory" />')
insert_component(r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\SalesmanMobileApp.tsx', '<AIAssistant context="sales" />')
