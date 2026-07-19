import re

file_path = r'D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\pages\AdminPanel.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
content = content.replace("import { NotificationBell } from '../components/NotificationBell';", "import { NotificationBell } from '../components/NotificationBell';\nimport { AuditLogViewer } from '../components/AuditLogViewer';")

# 2. Add 'System Logs' to sidebar
# The sidebar has a nav element with items like Dashboard, Users, Roles, Permissions...
# It looks something like:
#          <button onClick={() => setActiveView('extensions')} className={w-full flex items-center...
sidebar_extensions = '''          <button onClick={() => setActiveView('extensions')} className={w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all }>
            <Layout className={w-5 h-5 } />
            Extensions
          </button>'''

sidebar_logs = '''          <button onClick={() => setActiveView('extensions')} className={w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all }>
            <Layout className={w-5 h-5 } />
            Extensions
          </button>
          <button onClick={() => setActiveView('logs')} className={w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all }>
            <Activity className={w-5 h-5 } />
            System Logs
          </button>'''

content = content.replace(sidebar_extensions, sidebar_logs)

# 3. Render AuditLogViewer in activeView === 'logs'
# We have a switch or if/else chain for activeView rendering.
# It usually ends with ctiveView === 'extensions' && (...) or similar.
render_extensions = '''{activeView === 'extensions' && renderExtensions()}'''
render_logs = '''{activeView === 'extensions' && renderExtensions()}
        {activeView === 'logs' && <AuditLogViewer />}'''
content = content.replace(render_extensions, render_logs)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
