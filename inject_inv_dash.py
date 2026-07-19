import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\InventoryApp.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace AnalyticsView with InventorySupervisorDashboard
content = content.replace("import { AnalyticsView } from './components/AnalyticsView';", "import { InventorySupervisorDashboard } from '../components/dashboards/InventorySupervisorDashboard';")

content = content.replace("<AnalyticsView />", "<InventorySupervisorDashboard onAction={(a) => setActiveTab(a)} />")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
