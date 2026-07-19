import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\salesman-admin\index.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import Dashboard from './components/Dashboard';", "import { SalesSupervisorDashboard } from '../../components/dashboards/SalesSupervisorDashboard';")

# Find the dashboard render logic.
# Looking for ctiveTab === 'dashboard' && <Dashboard />
content = content.replace("<Dashboard />", "<SalesSupervisorDashboard onAction={(a) => setActiveTab(a)} />")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
