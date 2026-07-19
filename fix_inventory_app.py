import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\InventoryApp.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update setActiveTab defaults
content = content.replace("setActiveTab('daily')", "setActiveTab('dashboard')")
content = content.replace('setActiveTab("daily")', 'setActiveTab("dashboard")')
content = content.replace("const [activeTab, setActiveTab] = useState('daily');", "const [activeTab, setActiveTab] = useState('dashboard');")

# 2. Insert dashboard button if not exists
if "onClick={() => setActiveTab('dashboard')}" not in content:
    button_html = '''
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors }
                >
                  Dashboard
                </button>
'''
    content = content.replace("onClick={() => setActiveTab('pivot')}", button_html.strip() + "\n                <button\n                  onClick={() => setActiveTab('pivot')}")

# 3. Insert dashboard component if not exists
if "{activeTab === 'dashboard' && (" not in content:
    component_html = '''
        {activeTab === 'dashboard' && (
          <InventorySupervisorDashboard onAction={(action, payload) => {
             if (action === 'navigate' && payload) setActiveTab(payload);
          }} />
        )}
'''
    content = content.replace("{activeTab === 'pivot' && (", component_html.strip() + "\n\n        {activeTab === 'pivot' && (")
    # Actually wait, MobileStockTake is first?
    # I replaced near 'pivot'.
    
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated InventoryApp.tsx")
