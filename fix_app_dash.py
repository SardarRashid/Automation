import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'AdminDashboard' not in content:
    import_stmt = "import { AdminDashboard } from './components/dashboards/AdminDashboard';\n"
    content = content.replace("import { AdminPanel } from './pages/AdminPanel';", "import { AdminPanel } from './pages/AdminPanel';\n" + import_stmt)

# Add sidebar button
if "activeTab === 'main_dashboard'" not in content:
    button_html = '''
            {(userRole === 'it_admin' || userRole === 'app' || userRole === 'admin') && (
              <button
                onClick={() => setActiveTab('main_dashboard')}
                className={w-full flex items-center px-3 py-2.5 rounded-lg transition-colors }
              >
                <LayoutDashboard className={w-5 h-5 mr-3 } />
                Business Dashboard
              </button>
            )}
'''
    # Insert right before reports button
    content = content.replace("{permissions.reports && (", button_html.strip() + "\n            {permissions.reports && (")

    # Add to header titles
    content = content.replace("{activeTab === 'reports' && 'Generate Sale Reports'}", "{activeTab === 'main_dashboard' && 'Business Dashboard'}\n            {activeTab === 'reports' && 'Generate Sale Reports'}")

    # Add to render block
    render_html = '''
                {activeTab === 'main_dashboard' && (userRole === 'it_admin' || userRole === 'app' || userRole === 'admin') && <AdminDashboard />}
'''
    content = content.replace("{activeTab === 'reports' && permissions.reports", render_html.strip() + "\n                {activeTab === 'reports' && permissions.reports")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added main_dashboard to App.tsx")
